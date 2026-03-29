/**
 * auth.js
 * ──────────────────────────────────────────────────────────────────────────
 * Frontend auth module: Login/Signup modal, profile dashboard, leaderboard,
 * XP sync, page-based navigation, and auto-login popup.
 * ──────────────────────────────────────────────────────────────────────────
 */

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Token helpers ────────────────────────────────────────────────────────

function getToken()  { return localStorage.getItem('rr_token'); }
function getUser()   { try { return JSON.parse(localStorage.getItem('rr_user')); } catch { return null; } }
function setAuth(token, user) {
  localStorage.setItem('rr_token', token);
  localStorage.setItem('rr_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('rr_token');
  localStorage.removeItem('rr_user');
}
function isLoggedIn() { return !!getToken(); }

// ── API Calls ────────────────────────────────────────────────────────────

async function apiPost(path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`;
  const res = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function apiGet(path) {
  const res = await fetch(`${API}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Signup / Login ───────────────────────────────────────────────────────

async function signup(username, password) {
  const data = await apiPost('/api/auth/signup', { username, password });
  setAuth(data.token, data.user);
  document.documentElement.classList.remove('auth-pending');
  return data.user;
}

async function login(username, password) {
  const data = await apiPost('/api/auth/login', { username, password });
  setAuth(data.token, data.user);

  // Restore server-side state to localStorage
  const state = JSON.parse(localStorage.getItem('rr_state') || '{}');
  state.xp = data.user.xp ?? state.xp ?? 0;
  state.level = data.user.level ?? state.level ?? 0;
  state.streak = data.user.streak ?? state.streak ?? 0;
  state.badgesUnlocked = data.user.badgesUnlocked ?? state.badgesUnlocked ?? [];
  state.habitsCompleted = data.user.habitsCompleted ?? state.habitsCompleted ?? 0;
  state.calcUsed = data.user.calcUsed ?? state.calcUsed ?? 0;
  localStorage.setItem('rr_state', JSON.stringify(state));

  if (window.updateXPUI) window.updateXPUI();
  document.documentElement.classList.remove('auth-pending');
  return data.user;
}

function logout() {
  clearAuth();
  updateNavbarAuth();
  window.showToast?.('👋 Logged out successfully');
  setTimeout(() => openAuthModal(true), 500);
}

// ── Sync XP to Backend ──────────────────────────────────────────────────

let syncTimer = null;

function syncState() {
  if (!isLoggedIn()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const state = JSON.parse(localStorage.getItem('rr_state') || '{}');
      await apiPost('/api/auth/sync', {
        xp: state.xp ?? 0,
        level: state.level ?? 0,
        streak: state.streak ?? 0,
        badgesUnlocked: state.badgesUnlocked ?? [],
        habitsCompleted: state.habitsCompleted ?? 0,
        calcUsed: state.calcUsed ?? 0,
      }, true);
    } catch (err) {
      console.warn('[auth] Sync failed:', err.message);
    }
  }, 1000);
}

// ── Navbar auth UI ───────────────────────────────────────────────────────

function updateNavbarAuth() {
  const navXP = document.getElementById('nav-xp');
  const authBtn = document.getElementById('nav-auth-btn');
  const usernameEl = document.getElementById('nav-username');

  if (isLoggedIn()) {
    const user = getUser();
    // When logged in: profile icon opens dashboard, NOT logout
    if (authBtn) { authBtn.textContent = '👤'; authBtn.title = 'My Profile'; }
    if (usernameEl) { usernameEl.textContent = user?.username || ''; usernameEl.style.display = 'inline'; }
    if (navXP) { navXP.style.cursor = 'pointer'; navXP.onclick = () => openProfileDashboard(); }
  } else {
    if (authBtn) { authBtn.textContent = '👤'; authBtn.title = 'Login / Sign Up'; }
    if (usernameEl) { usernameEl.textContent = ''; usernameEl.style.display = 'none'; }
    if (navXP) { navXP.style.cursor = 'pointer'; navXP.onclick = () => openAuthModal(); }
  }
}

// ── Auth Modal ───────────────────────────────────────────────────────────

function openAuthModal(showSkip = false) {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('show'));
    switchTab('login');

    // Show/hide skip button
    const skipBtn = document.getElementById('auth-skip-btn');
    if (skipBtn) skipBtn.style.display = showSkip ? 'block' : 'none';
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
      if (!isLoggedIn()) {
        window.location.replace('landing.html');
      }
    }, 300);
  }
}

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('auth-login-form').style.display = tab === 'login' ? 'flex' : 'none';
  document.getElementById('auth-signup-form').style.display = tab === 'signup' ? 'flex' : 'none';
  document.getElementById('auth-error').textContent = '';
}

// ── Profile Dashboard Modal ──────────────────────────────────────────────

const LEVELS = [
  { name: 'Savings Seedling',  xp: 0   },
  { name: 'Budget Ninja',      xp: 100  },
  { name: 'SIP Starter',       xp: 250  },
  { name: 'Compound Chaser',   xp: 500  },
  { name: 'Wealth Builder',    xp: 900  },
  { name: 'FIRE Seeker',       xp: 1500 },
  { name: 'RetireRight Legend', xp: 2500 },
];

const BADGES = [
  { emoji: '🏁', name: 'First Step' },
  { emoji: '🔥', name: 'On Fire' },
  { emoji: '🧮', name: 'Math Whiz' },
  { emoji: '💎', name: 'Diamond Hands' },
  { emoji: '🌙', name: 'FIRE Mode' },
  { emoji: '🏆', name: 'Legend' },
  { emoji: '✅', name: 'Habit Hero' },
  { emoji: '🚀', name: 'To the Moon' },
  { emoji: '🤝', name: 'Promise Keeper' },
];

function openProfileDashboard() {
  if (!isLoggedIn()) { openAuthModal(); return; }

  const modal = document.getElementById('profile-modal');
  if (!modal) return;

  const user = getUser();
  const state = JSON.parse(localStorage.getItem('rr_state') || '{}');
  const xp = state.xp ?? 0;
  const levelIdx = LEVELS.findLastIndex(l => xp >= l.xp);
  const level = LEVELS[levelIdx] || LEVELS[0];
  const nextLevel = LEVELS[levelIdx + 1];
  const pct = nextLevel ? ((xp - level.xp) / (nextLevel.xp - level.xp)) * 100 : 100;
  const unlockedBadges = state.badgesUnlocked || [];

  document.getElementById('profile-username').textContent = user?.username || 'User';
  document.getElementById('profile-xp').textContent = xp;
  document.getElementById('profile-level-name').textContent = level.name;
  document.getElementById('profile-level-num').textContent = `Level ${levelIdx + 1}`;
  document.getElementById('profile-xp-fill').style.width = Math.min(pct, 100) + '%';
  document.getElementById('profile-xp-range').textContent = nextLevel
    ? `${xp} / ${nextLevel.xp} XP`
    : `${xp} XP — Max Level!`;
  document.getElementById('profile-streak').textContent = state.streak ?? 0;
  document.getElementById('profile-calcs').textContent = state.calcUsed ?? 0;
  document.getElementById('profile-habits').textContent = state.habitsCompleted ?? 0;

  const badgesGrid = document.getElementById('profile-badges-grid');
  badgesGrid.innerHTML = BADGES.map(b => {
    const unlocked = unlockedBadges.includes(b.name);
    return `<div class="profile-badge ${unlocked ? 'unlocked' : 'locked'}" title="${b.name}">
      <span class="profile-badge-emoji">${b.emoji}</span>
      <span class="profile-badge-name">${b.name}</span>
    </div>`;
  }).join('');

  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('show'));
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
  }
}

// ── Leaderboard ──────────────────────────────────────────────────────────

async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-body');
  if (!container) return;

  try {
    const { leaderboard } = await apiGet('/api/auth/leaderboard');
    const currentUser = getUser()?.username?.toLowerCase();

    if (!leaderboard?.length) {
      container.innerHTML = '<tr><td colspan="5" class="lb-empty">No users yet. Be the first to sign up!</td></tr>';
      return;
    }

    const rankEmoji = ['👑', '🥈', '🥉'];
    container.innerHTML = leaderboard.map(u => {
      const isMe = u.username.toLowerCase() === currentUser;
      return `<tr class="${isMe ? 'lb-me' : ''}">
        <td class="lb-rank">${rankEmoji[u.rank - 1] || u.rank}</td>
        <td class="lb-user">${u.username}${isMe ? ' <span class="lb-you">(you)</span>' : ''}</td>
        <td class="lb-xp">⭐ ${u.xp}</td>
        <td class="lb-level">Lv.${u.level + 1}</td>
        <td class="lb-badges">${u.badgesCount} 🏅</td>
      </tr>`;
    }).join('');
  } catch (err) {
    container.innerHTML = '<tr><td colspan="5" class="lb-empty">Could not load leaderboard</td></tr>';
  }
}

// ── Page-Based Navigation ────────────────────────────────────────────────

// Section IDs that map to nav links
const NAV_SECTIONS = [
  'hero', 'calculator', 'insights', 'future-self', 'lifestyle',
  'invest', 'habits', 'quiz', 'commitment', 'education', 'leaderboard', 'action'
];

function showPage(sectionId) {
  NAV_SECTIONS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === sectionId || sectionId === 'all') {
      el.style.display = '';
      el.style.opacity = '1';
    } else {
      el.style.display = 'none';
    }
  });

  // Always show hero on home
  const hero = document.getElementById('hero');
  const nudge = document.getElementById('nudge-banner');
  if (sectionId === 'all' || sectionId === 'hero') {
    if (hero) hero.style.display = '';
    if (nudge) nudge.style.display = '';
  } else {
    if (hero) hero.style.display = 'none';
    if (nudge) nudge.style.display = 'none';
  }

  // Scroll to top of visible section
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Load leaderboard data when that page is shown
  if (sectionId === 'leaderboard') loadLeaderboard();
}

function initPageNavigation() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const sectionId = href?.replace('#', '');
      if (sectionId) {
        showPage(sectionId);
        // Update active link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });

  // Logo click → show all (home)
  const logo = document.querySelector('.nav-logo');
  if (logo) {
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('all');
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    });
  }
}

// ── Init ─────────────────────────────────────────────────────────────────

export function initAuth() {
  // Wire auth button — opens PROFILE when logged in, LOGIN modal when not
  const authBtn = document.getElementById('nav-auth-btn');
  if (authBtn) {
    authBtn.addEventListener('click', () => {
      if (isLoggedIn()) { openProfileDashboard(); } else { openAuthModal(); }
    });
  }

  // Modal close buttons
  document.getElementById('auth-modal-close')?.addEventListener('click', closeAuthModal);
  document.getElementById('profile-modal-close')?.addEventListener('click', closeProfileModal);

  // Skip button
  document.getElementById('auth-skip-btn')?.addEventListener('click', closeAuthModal);

  // Close on overlay click
  document.getElementById('auth-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'auth-modal') closeAuthModal();
  });
  document.getElementById('profile-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'profile-modal') closeProfileModal();
  });

  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Login form
  document.getElementById('auth-login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('auth-error');
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    try {
      errEl.textContent = '';
      await login(username, password);
      closeAuthModal();
      updateNavbarAuth();
      window.showToast?.(`Welcome back, ${username}! 🎉`);
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  // Signup form
  document.getElementById('auth-signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('auth-error');
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    try {
      errEl.textContent = '';
      await signup(username, password);
      closeAuthModal();
      updateNavbarAuth();
      window.showToast?.(`Account created! Welcome, ${username}! 🚀`);
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  // Profile logout button
  document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
    closeProfileModal();
    logout();
  });

  // Leaderboard refresh
  document.getElementById('lb-refresh-btn')?.addEventListener('click', loadLeaderboard);

  // Patch earnXP to sync after changes
  const origEarnXP = window.earnXP;
  if (origEarnXP) {
    window.earnXP = function(amount, msg) {
      origEarnXP(amount, msg);
      syncState();
    };
  }

  // Initial state
  updateNavbarAuth();
  if (isLoggedIn()) { 
    syncState(); 
    document.documentElement.classList.remove('auth-pending');
  }

  // Init page-based navigation
  initPageNavigation();

  // Intro overlay logic
  if (!isLoggedIn()) {
    if (window.location.search.includes('action=login')) {
      // User clicked Get Started from landing.html
      openAuthModal(false);
      // Clean up URL so refresh doesn't pop it again unnecessarily 
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Not logged in and no intent to login -> go to landing
      window.location.href = 'landing.html';
    }
  }
}


