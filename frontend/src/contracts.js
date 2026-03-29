/* ================================================================
   RetireRight — Commitment Contracts
   Users pledge to save a specific amount; earn/lose XP based on
   whether they follow through.
   ================================================================ */

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────
const STORAGE_KEY = 'rr_contracts';

const PENALTY_TYPES = {
  xp: { label: 'Lose 100 XP', value: -100 },
  badge: { label: 'Lock a badge for 24h', value: 'badge_lock' },
  streak: { label: 'Reset streak', value: 'streak_reset' },
};

const DURATIONS = [
  { label: '1 Month', months: 1 },
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '1 Year', months: 12 },
];

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────
let contracts = [];

function loadContracts() {
  try {
    contracts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    contracts = [];
  }
}

function saveContracts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function formatINR(n) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function daysBetween(d1, d2) {
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

function getProgress(contract) {
  const start = new Date(contract.createdAt);
  const end = new Date(contract.endDate);
  const now = new Date();
  const total = daysBetween(start, end);
  const elapsed = daysBetween(start, now);
  return Math.min(Math.max(elapsed / total, 0), 1);
}

function getStatusInfo(contract) {
  const now = new Date();
  const end = new Date(contract.endDate);
  if (contract.status === 'completed') return { label: 'Completed ✅', cls: 'status-completed' };
  if (contract.status === 'broken') return { label: 'Broken ❌', cls: 'status-broken' };
  if (now > end) return { label: 'Expired — Needs Review', cls: 'status-expired' };
  const daysLeft = daysBetween(now, end);
  return { label: `${daysLeft} days remaining`, cls: 'status-active' };
}

// ─────────────────────────────────────────
// CREATE CONTRACT
// ─────────────────────────────────────────
function createContract(amount, durationMonths, penaltyType) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + durationMonths);

  const contract = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    amount: parseInt(amount),
    durationMonths,
    penaltyType,
    createdAt: now.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active', // active | completed | broken
    checkins: [], // dates when user checked in
  };

  contracts.unshift(contract);
  saveContracts();
  return contract;
}

// ─────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────
function completeContract(id) {
  const contract = contracts.find((c) => c.id === id);
  if (!contract || contract.status !== 'active') return;
  contract.status = 'completed';
  saveContracts();

  // Reward: +200 XP + exclusive badge
  if (typeof window.earnXP === 'function') {
    window.earnXP(200, '🤝 Contract fulfilled! Promise Keeper! +200 XP');
  }
}

function breakContract(id) {
  const contract = contracts.find((c) => c.id === id);
  if (!contract || contract.status !== 'active') return;
  contract.status = 'broken';
  saveContracts();

  // Apply penalty
  applyPenalty(contract.penaltyType);
}

function checkinContract(id) {
  const contract = contracts.find((c) => c.id === id);
  if (!contract || contract.status !== 'active') return;
  const today = new Date().toDateString();
  if (contract.checkins.includes(today)) return; // already checked in today
  contract.checkins.push(today);
  saveContracts();

  if (typeof window.earnXP === 'function') {
    window.earnXP(15, '📝 Contract check-in! +15 XP');
  }
}

function applyPenalty(penaltyType) {
  const state = JSON.parse(localStorage.getItem('rr_state') || '{}');

  switch (penaltyType) {
    case 'xp':
      state.xp = Math.max((state.xp || 0) - 100, 0);
      localStorage.setItem('rr_state', JSON.stringify(state));
      if (typeof window.showToast === 'function') {
        window.showToast('😰 Contract broken! Lost 100 XP.', 4000);
      }
      break;
    case 'streak':
      state.streak = 0;
      localStorage.setItem('rr_state', JSON.stringify(state));
      if (typeof window.showToast === 'function') {
        window.showToast('😰 Contract broken! Streak reset to 0.', 4000);
      }
      break;
    case 'badge':
      if (typeof window.showToast === 'function') {
        window.showToast('😰 Contract broken! A badge has been temporarily locked.', 4000);
      }
      break;
  }
}

function deleteContract(id) {
  contracts = contracts.filter((c) => c.id !== id);
  saveContracts();
}

// ─────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────
function renderContracts() {
  const container = document.getElementById('contracts-list');
  const emptyState = document.getElementById('contracts-empty');
  if (!container) return;

  if (contracts.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  container.innerHTML = contracts
    .map((c) => {
      const progress = getProgress(c);
      const pctText = Math.round(progress * 100);
      const statusInfo = getStatusInfo(c);
      const durationLabel = DURATIONS.find((d) => d.months === c.durationMonths)?.label || `${c.durationMonths}mo`;
      const checkinToday = c.checkins.includes(new Date().toDateString());
      const penaltyLabel = PENALTY_TYPES[c.penaltyType]?.label || c.penaltyType;

      return `
      <div class="contract-card glass-card ${statusInfo.cls}">
        <div class="contract-header">
          <div class="contract-amount">${formatINR(c.amount)}<span class="contract-freq">/month</span></div>
          <span class="contract-status-badge">${statusInfo.label}</span>
        </div>
        <div class="contract-meta">
          <span>📅 ${durationLabel}</span>
          <span>⚡ Penalty: ${penaltyLabel}</span>
          <span>📝 ${c.checkins.length} check-ins</span>
        </div>
        <div class="contract-progress-wrap">
          <div class="contract-progress-bar">
            <div class="contract-progress-fill" style="width:${pctText}%"></div>
          </div>
          <span class="contract-progress-text">${pctText}%</span>
        </div>
        ${c.status === 'active' ? `
          <div class="contract-actions">
            <button class="btn-primary contract-btn" onclick="window._contractCheckin('${c.id}')" ${checkinToday ? 'disabled' : ''}>
              ${checkinToday ? '✓ Checked in today' : '📝 Daily Check-in +15 XP'}
            </button>
            <button class="btn-primary contract-complete-btn" onclick="window._contractComplete('${c.id}')">
              ✅ Mark Fulfilled (+200 XP)
            </button>
            <button class="btn-ghost contract-break-btn" onclick="window._contractBreak('${c.id}')">
              ❌ Break Contract
            </button>
          </div>
        ` : `
          <div class="contract-actions">
            <button class="btn-ghost contract-delete-btn" onclick="window._contractDelete('${c.id}')">
              🗑️ Remove
            </button>
          </div>
        `}
      </div>`;
    })
    .join('');
}

// ─────────────────────────────────────────
// FORM HANDLER
// ─────────────────────────────────────────
function handleFormSubmit(e) {
  e.preventDefault();
  const amount = document.getElementById('contract-amount').value;
  const duration = parseInt(document.getElementById('contract-duration').value);
  const penalty = document.getElementById('contract-penalty').value;

  if (!amount || amount < 100) {
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ Please enter a valid amount (₹100+)', 3000);
    }
    return;
  }

  createContract(amount, duration, penalty);
  renderContracts();

  if (typeof window.earnXP === 'function') {
    window.earnXP(25, '🤝 Commitment contract created! +25 XP');
  }

  // Reset form
  document.getElementById('contract-amount').value = '';
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
export function initContracts() {
  loadContracts();

  const form = document.getElementById('contract-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Wire up global action handlers
  window._contractCheckin = (id) => {
    checkinContract(id);
    renderContracts();
  };
  window._contractComplete = (id) => {
    completeContract(id);
    renderContracts();
    // Reload XP UI
    if (typeof window.updateXPUI === 'function') window.updateXPUI();
  };
  window._contractBreak = (id) => {
    if (confirm('Are you sure you want to break this contract? The penalty will be applied.')) {
      breakContract(id);
      renderContracts();
      if (typeof window.updateXPUI === 'function') window.updateXPUI();
    }
  };
  window._contractDelete = (id) => {
    deleteContract(id);
    renderContracts();
  };

  renderContracts();
  console.log('[Contracts] Commitment contracts initialized.');
}
