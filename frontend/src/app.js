/* ================================================================
   RetireRight — App Logic
   Modules: Calculator, Charts, LifestyleSim, Allocation, Gamification,
            EducationTips, FutureSelf, BehavioralNudges
   ================================================================ */

import Chart from 'chart.js/auto';
import './styles.css';
import { initVoice } from './voice.js';
import { initContracts } from './contracts.js';
import { initQuiz } from './quiz.js';
import { initAuth } from './auth.js';

// ─────────────────────────────────────────
// 0. UTILITY
// ─────────────────────────────────────────
const fmt = (n) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  if (n >= 1000)       return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

const fmtRaw = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}
window.showToast = showToast;

// ─────────────────────────────────────────
// 1. SCROLL REVEAL
// ─────────────────────────────────────────
function initReveal() {
  document.querySelectorAll('.section-inner > *, .glass-card, .action-step')
    .forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ─────────────────────────────────────────
// 2. NAVBAR SCROLL EFFECT
// ─────────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar')
    .classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ─────────────────────────────────────────
// 3. HERO MINI CHART
// ─────────────────────────────────────────
function initHeroMiniChart() {
  const ctx = document.getElementById('hero-mini-chart').getContext('2d');
  const years = Array.from({ length: 31 }, (_, i) => i);
  const monthly = 1000, r = 0.12 / 12;
  const vals = years.map(y => {
    const n = y * 12;
    return monthly * ((Math.pow(1 + r, n) - 1) / r);
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        data: vals,
        fill: true,
        borderColor: 'rgba(124,58,237,0.9)',
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 140);
          g.addColorStop(0, 'rgba(124,58,237,0.35)');
          g.addColorStop(1, 'rgba(6,182,212,0.02)');
          return g;
        },
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      animation: { duration: 1200, easing: 'easeInOutQuart' }
    }
  });
}

// ─────────────────────────────────────────
// 4. ANIMATED COUNTERS (HERO)
// ─────────────────────────────────────────
function animateCounter(el, target, prefix = '', suffix = '', duration = 1800) {
  let start = 0, startTime = null;
  const step = (ts) => {
    if (!startTime) startTime = ts;
    const progress = Math.min((ts - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = Math.floor(eased * target);
    if (target >= 1_000_000) {
      el.textContent = prefix + (val / 10_000_000).toFixed(2) + ' Cr' + suffix;
    } else {
      el.textContent = prefix + val.toLocaleString('en-IN') + suffix;
    }
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initHeroCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const val = parseInt(el.dataset.counter);
      const text = el.textContent;
      const prefix = text.includes('₹') ? '₹' : '';
      const suffix = text.includes('%') ? '%' : '';
      animateCounter(el, val, prefix, suffix);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-counter]').forEach(el => observer.observe(el));
}

// ─────────────────────────────────────────
// 5. RETIREMENT CALCULATOR ENGINE
// ─────────────────────────────────────────
let compoundChart = null;
let lastCorpus = 0;

function calcFV(monthly, rateAnnual, years) {
  const r = rateAnnual / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

function initCalculator() {
  const sliders = [
    { id: 'current-age',    valId: 'current-age-val',    fmt: v => v },
    { id: 'retire-age',     valId: 'retire-age-val',     fmt: v => v },
    { id: 'monthly-saving', valId: 'monthly-saving-val', fmt: v => `₹${parseInt(v).toLocaleString('en-IN')}` },
    { id: 'annual-return',  valId: 'annual-return-val',  fmt: v => `${v}%` },
  ];

  sliders.forEach(({ id, valId, fmt: f }) => {
    const slider = document.getElementById(id);
    const valEl  = document.getElementById(valId);
    slider.addEventListener('input', () => {
      valEl.textContent = f(slider.value);
      updateSliderStyle(slider);
    });
    updateSliderStyle(slider);
  });

  document.getElementById('calc-btn').addEventListener('click', () => {
    state.calcUsed = (state.calcUsed || 0) + 1;
    saveState();
    runCalculation();
    earnXP(30, '🔢 Calculation complete! +30 XP');
  });
}

function updateSliderStyle(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.background = `linear-gradient(to right, #7c3aed ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;
}

function runCalculation() {
  const age    = parseInt(document.getElementById('current-age').value);
  const retire = parseInt(document.getElementById('retire-age').value);
  const monthly = parseInt(document.getElementById('monthly-saving').value);
  const rate   = parseFloat(document.getElementById('annual-return').value);
  const years  = Math.max(retire - age, 1);

  const corpus   = calcFV(monthly, rate, years);
  const invested = monthly * years * 12;
  const growth   = corpus - invested;

  // Wait 5 years cost
  const corpusLate = calcFV(monthly, rate, Math.max(years - 5, 1));
  const waitCost   = corpus - corpusLate;

  lastCorpus = corpus;

  // Animate result values
  animateResultVal('corpus-val',   corpus);
  animateResultVal('invested-val', invested);
  animateResultVal('growth-val',   growth);
  animateResultVal('wait-val',     waitCost);

  // Update future self — dynamic perks based on corpus
  updateFutureSelf(corpus, retire, monthly, years);

  // Update lifestyle
  updateLifestyle(corpus);

  // Draw compound chart
  drawCompoundChart(monthly, rate, age, retire);

  // Fetch + render community insights from backend
  fetchInsights({ age, monthly, rate, corpus });
}

// ─────────────────────────────────────────
// 5b. COMMUNITY INSIGHTS FETCH & RENDER
// ─────────────────────────────────────────
const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchInsights({ age, monthly, rate, corpus }) {
  // Derive risk label from current allocation sliders if possible, else from rate
  const equity = parseInt(document.getElementById('equity-slider')?.value ?? 60);
  const crypto = parseInt(document.getElementById('crypto-slider')?.value ?? 10);
  const riskScore = (equity * 0.7 + crypto * 1.5) / 100;
  const riskLevel = riskScore < 0.3 ? 'low' : riskScore < 0.6 ? 'moderate' : 'high';

  const investmentSplit = {
    equity: parseInt(document.getElementById('equity-slider')?.value ?? 60),
    debt:   parseInt(document.getElementById('debt-slider')?.value   ?? 25),
    crypto: parseInt(document.getElementById('crypto-slider')?.value ?? 10),
    cash:   parseInt(document.getElementById('cash-slider')?.value   ?? 5),
  };

  try {
    const res = await fetch(`${BACKEND}/api/insights`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true' 
      },
      body: JSON.stringify({
        age,
        monthlySaving:    monthly,
        annualReturn:     rate,
        estimatedCorpus:  corpus,
        riskLevel,
        investmentSplit,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderInsights(data);
  } catch (err) {
    console.warn('[insights] Backend unavailable — skipping.', err.message);
    // Still show fallback static suggestions from the response if cached, else stay hidden
  }
}

function renderInsights(data) {
  const section = document.getElementById('insights');
  if (!section) return;

  // Update sample count message
  const sampleMsg = document.getElementById('insights-sample-msg');
  if (sampleMsg) {
    sampleMsg.textContent = data.sampleSize >= 3
      ? `Based on ${data.sampleSize} anonymised investors in our community.`
      : data.message || 'Be the first to contribute data — showing benchmark suggestions.';
  }

  // Community stat chips
  if (data.communityStats) {
    const cs = data.communityStats;
    const el = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
    el('ic-avg-saving',   `₹${cs.avgMonthlySaving.toLocaleString('en-IN')}`);
    el('ic-avg-return',   `${cs.avgAnnualReturn}%`);
    el('ic-popular-risk', cs.popularRiskLevel.charAt(0).toUpperCase() + cs.popularRiskLevel.slice(1));
    el('ic-avg-age',      `${cs.avgAge} yrs`);
  } else if (data.benchmarks) {
    // Fallback static benchmarks
    const bm = data.benchmarks;
    const el = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt; };
    el('ic-avg-saving',   `₹${bm.avgMonthlySaving.toLocaleString('en-IN')}`);
    el('ic-avg-return',   `${bm.avgAnnualReturn}%`);
    el('ic-popular-risk', bm.popularRiskLevel.charAt(0).toUpperCase() + bm.popularRiskLevel.slice(1));
    el('ic-avg-age',      '—');
  }

  // Suggestions
  const list = document.getElementById('suggestions-list');
  if (list && data.suggestions?.length) {
    const typeIcon = { personalised: '🎯', community: '📊', general: '📈' };
    list.innerHTML = data.suggestions.map(s => `
      <div class="suggestion-card glass-card">
        <div class="suggestion-type">${typeIcon[s.type] ?? '💡'} ${s.type}</div>
        <div class="suggestion-title">${s.title}</div>
        <div class="suggestion-body">${s.body}</div>
      </div>
    `).join('');
  }

  // Show section with smooth animation
  section.style.display = '';
  section.style.opacity = '0';
  section.style.transition = 'opacity 0.5s ease';
  requestAnimationFrame(() => {
    section.style.opacity = '1';
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}



function animateResultVal(id, target) {
  const el = document.getElementById(id);
  let start = 0, startTime = null;
  const curr = parseFloat(el.dataset.raw || 0);
  const step = (ts) => {
    if (!startTime) startTime = ts;
    const p = Math.min((ts - startTime) / 900, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = curr + (target - curr) * eased;
    el.textContent = fmt(val);
    if (p < 1) requestAnimationFrame(step);
    else el.dataset.raw = target;
  };
  requestAnimationFrame(step);
}

// ─────────────────────────────────────────
// 6. COMPOUND INTEREST CHART
// ─────────────────────────────────────────
function drawCompoundChart(monthly, rate, currentAge, retireAge) {
  const years    = retireAge - currentAge;
  const labels   = Array.from({ length: years + 1 }, (_, i) => currentAge + i);
  const nowData  = labels.map((_, i) => calcFV(monthly, rate, i));
  const lateData = labels.map((_, i) => i < 5 ? 0 : calcFV(monthly, rate, i - 5));

  const ctx = document.getElementById('compound-chart').getContext('2d');

  if (compoundChart) compoundChart.destroy();

  compoundChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Start Now',
          data: nowData,
          borderColor: '#7c3aed',
          backgroundColor: (c) => {
            const g = c.chart.ctx.createLinearGradient(0, 0, 0, 300);
            g.addColorStop(0, 'rgba(124,58,237,0.3)');
            g.addColorStop(1, 'rgba(124,58,237,0.01)');
            return g;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2.5,
        },
        {
          label: 'Wait 5 Years',
          data: lateData,
          borderColor: '#06b6d4',
          backgroundColor: (c) => {
            const g = c.chart.ctx.createLinearGradient(0, 0, 0, 300);
            g.addColorStop(0, 'rgba(6,182,212,0.2)');
            g.addColorStop(1, 'rgba(6,182,212,0.01)');
            return g;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [6, 4],
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,15,31,0.95)',
          borderColor: 'rgba(124,58,237,0.4)',
          borderWidth: 1,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          padding: 12,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#475569', maxTicksLimit: 8 }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: {
            color: '#475569',
            callback: (v) => fmt(v)
          }
        }
      },
      animation: { duration: 800, easing: 'easeInOutCubic' }
    }
  });
}

// ─────────────────────────────────────────
// 7. LIFESTYLE SIMULATOR
// ─────────────────────────────────────────
const LIFESTYLE_ITEMS = [
  { emoji: '☕', label: 'Chai/Coffee per day', cost: 50,     unit: 'years of daily chai' },
  { emoji: '✈️', label: 'International trips', cost: 150000,  unit: 'international vacations' },
  { emoji: '🏠', label: 'Monthly rent',        cost: 25000,   unit: 'years of rent-free life' },
  { emoji: '🍕', label: 'Dinner dates',        cost: 1500,    unit: 'amazing dinner dates' },
  { emoji: '📱', label: 'New iPhones',         cost: 90000,   unit: 'flagship iPhones' },
  { emoji: '🚗', label: 'New Maruti cars',     cost: 900000,  unit: 'brand-new cars' },
  { emoji: '🎓', label: 'College degrees',     cost: 500000,  unit: 'full college degrees' },
  { emoji: '🏋️', label: 'Gym memberships',    cost: 12000,   unit: 'years of gym' },
];

function updateLifestyle(corpus) {
  const grid   = document.getElementById('lifestyle-grid');
  const dispEl = document.getElementById('lifestyle-corpus-display');
  dispEl.textContent = fmt(corpus);

  grid.innerHTML = LIFESTYLE_ITEMS.map(item => {
    let count, unit;
    if (item.label === '☕ Chai/Coffee per day') {
      const days = corpus / item.cost;
      count = (days / 365).toFixed(0);
      unit  = item.unit;
    } else if (item.label.includes('Monthly')) {
      count = (corpus / (item.cost * 12)).toFixed(0);
      unit  = item.unit;
    } else {
      count = Math.floor(corpus / item.cost).toLocaleString('en-IN');
      unit  = item.unit;
    }
    return `
    <div class="lifestyle-card glass-card reveal">
      <div class="lifestyle-emoji">${item.emoji}</div>
      <div class="lifestyle-count">${count}</div>
      <div class="lifestyle-label">${item.label}</div>
      <div class="lifestyle-unit">${unit}</div>
    </div>`;
  }).join('');

  // Re-observe newly added cards
  document.querySelectorAll('.lifestyle-card').forEach(el => {
    el.classList.add('reveal');
    setTimeout(() => el.classList.add('visible'), 100);
  });
}

// ─────────────────────────────────────────
// 7b. DYNAMIC FUTURE SELF UPDATER
// ─────────────────────────────────────────
function updateFutureSelf(corpus, retireAge, monthlySaving, years) {
  // ── Smart Saver side ──
  document.getElementById('corpus-good').textContent = fmt(corpus);
  document.getElementById('future-age-good').textContent = retireAge;
  document.getElementById('future-age-bad').textContent  = retireAge;

  const trips   = Math.floor(corpus / 150000);
  const rentYrs = Math.floor(corpus / (25000 * 12));
  const cars    = Math.floor(corpus / 900000);
  const monthlyPassive = Math.round(corpus * 0.06 / 12); // assume 6% SWR

  let emoji, titleGood;
  if (corpus >= 50_000_000) { emoji = '👑'; titleGood = 'The Ultra-Rich Retiree'; }
  else if (corpus >= 30_000_000) { emoji = '🏖️'; titleGood = 'The Early Retiree'; }
  else if (corpus >= 10_000_000) { emoji = '😎'; titleGood = 'The Comfortable Retiree'; }
  else if (corpus >= 5_000_000)  { emoji = '🙂'; titleGood = 'The Modest Retiree'; }
  else { emoji = '😐'; titleGood = 'The Budget Retiree'; }

  const saverPerks = document.getElementById('perks-saver');
  saverPerks.innerHTML = `
    <li>🏖️ Retired at ${retireAge}, fully funded</li>
    <li>✈️ ${trips.toLocaleString('en-IN')} international trips possible</li>
    <li>🏠 ${rentYrs} years rent-free living</li>
    <li>💰 ${fmt(monthlyPassive)}/month passive income</li>
    <li>🚗 Could buy ${cars} brand-new cars</li>
  `;
  document.querySelector('#path-saver .avatar-face').textContent = emoji;
  document.querySelector('#path-saver .avatar-details h3').textContent = titleGood;

  // ── Impulse Spender side — what happens if they save ₹0 ──
  const spenderPerks = document.querySelector('#path-spender .avatar-perks');
  spenderPerks.innerHTML = `
    <li>👔 Still working at ${Math.min(retireAge + 10, 70)}</li>
    <li>💳 ₹0 saved, dependent on debt</li>
    <li>🏥 Basic health coverage only</li>
    <li>😰 Dependent on children for support</li>
    <li>📉 Missed ${fmt(corpus)} in potential wealth</li>
  `;
  document.querySelector('#path-spender .avatar-details h3').textContent = 'The Late Regret';
}

// ─────────────────────────────────────────
// 8. INVESTMENT ALLOCATION DONUT
// ─────────────────────────────────────────
let allocChart = null;

function initAllocation() {
  const sliders = [
    { id: 'equity-slider', pctId: 'equity-pct', color: '#7c3aed', label: 'Equity' },
    { id: 'debt-slider',   pctId: 'debt-pct',   color: '#06b6d4', label: 'Bonds' },
    { id: 'crypto-slider', pctId: 'crypto-pct', color: '#f59e0b', label: 'Crypto' },
    { id: 'cash-slider',   pctId: 'cash-pct',   color: '#10b981', label: 'Cash' },
  ];

  const ctx = document.getElementById('alloc-donut').getContext('2d');
  allocChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sliders.map(s => s.label),
      datasets: [{
        data: sliders.map(s => parseInt(document.getElementById(s.id).value)),
        backgroundColor: sliders.map(s => s.color + 'cc'),
        borderColor:     sliders.map(s => s.color),
        borderWidth: 2,
        hoverOffset: 10,
      }]
    },
    options: {
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,15,31,0.95)',
          borderColor: 'rgba(124,58,237,0.4)',
          borderWidth: 1,
          callbacks: { label: (c) => ` ${c.label}: ${c.raw}%` }
        }
      },
      animation: { animateRotate: true, duration: 600 }
    }
  });

  sliders.forEach(({ id, pctId, color }, idx) => {
    const slider = document.getElementById(id);
    const pctEl  = document.getElementById(pctId);
    slider.style.setProperty('--slider-color', color);

    // Override slider thumb color with JS
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value);
      pctEl.textContent = val + '%';
      updateAllocChart(sliders);
      updateRiskMeter(sliders);
      updateSliderStyle(slider);
    });
    updateSliderStyle(slider);
  });

  updateRiskMeter(sliders);
}

function updateAllocChart(sliders) {
  const vals = sliders.map(s => parseInt(document.getElementById(s.id).value));
  const total = vals.reduce((a, b) => a + b, 0);

  allocChart.data.datasets[0].data = vals;
  allocChart.update();

  const totalEl = document.getElementById('alloc-total');
  const pctEl   = document.getElementById('alloc-total-pct');
  pctEl.textContent = total + '%';
  totalEl.classList.toggle('over', total !== 100);
  pctEl.style.color = total === 100 ? 'var(--clr-green)' : (total > 100 ? 'var(--clr-red)' : 'var(--clr-amber)');
}

function updateRiskMeter(sliders) {
  const equity = parseInt(document.getElementById('equity-slider').value);
  const crypto = parseInt(document.getElementById('crypto-slider').value);
  const riskScore = Math.min((equity * 0.7 + crypto * 1.5) / 100, 1);

  const fill = document.getElementById('risk-fill');
  const text = document.getElementById('risk-text');
  fill.style.width = (riskScore * 100) + '%';

  if (riskScore < 0.3) {
    text.textContent = 'Conservative'; text.style.color = 'var(--clr-green)';
    fill.style.background = 'var(--gradient-green)';
  } else if (riskScore < 0.6) {
    text.textContent = 'Moderate'; text.style.color = 'var(--clr-amber)';
    fill.style.background = 'var(--gradient-main)';
  } else if (riskScore < 0.8) {
    text.textContent = 'Aggressive'; text.style.color = 'var(--clr-amber)';
    fill.style.background = 'var(--gradient-warm)';
  } else {
    text.textContent = 'Very High Risk 🚨'; text.style.color = 'var(--clr-red)';
    fill.style.background = 'var(--gradient-danger)';
  }
}

// ─────────────────────────────────────────
// 9. GAMIFICATION ENGINE
// ─────────────────────────────────────────
const LEVELS = [
  { name: 'Savings Seedling',  xp: 0   },
  { name: 'Budget Ninja',      xp: 100  },
  { name: 'SIP Starter',       xp: 250  },
  { name: 'Compound Chaser',   xp: 500  },
  { name: 'Wealth Builder',    xp: 900  },
  { name: 'FIRE Seeker',       xp: 1500 },
  { name: 'RetireRight Legend',xp: 2500 },
];

const BADGES = [
  { emoji: '🏁', name: 'First Step',      req: 'Earn 10 XP',         threshold: 10,   type: 'xp' },
  { emoji: '🔥', name: 'On Fire',         req: '3-day streak',        threshold: 3,    type: 'streak' },
  { emoji: '🧮', name: 'Math Whiz',       req: 'Use calculator',      threshold: 1,    type: 'calc' },
  { emoji: '💎', name: 'Diamond Hands',   req: 'Earn 500 XP',         threshold: 500,  type: 'xp' },
  { emoji: '🌙', name: 'FIRE Mode',       req: 'Earn 1000 XP',        threshold: 1000, type: 'xp' },
  { emoji: '🏆', name: 'Legend',          req: 'Reach Level 5',       threshold: 4,    type: 'level' },
  { emoji: '✅', name: 'Habit Hero',      req: 'Complete all habits',  threshold: 5,    type: 'habits' },
  { emoji: '🚀', name: 'To the Moon',     req: 'Earn 2500 XP',        threshold: 2500, type: 'xp' },
  { emoji: '🤝', name: 'Promise Keeper',  req: 'Fulfil a contract',   threshold: 1,    type: 'contract' },
];

let state = JSON.parse(localStorage.getItem('rr_state') || 'null') || {
  xp: 0, level: 0, streak: 0, lastDate: null,
  habitsCompleted: 0, calcUsed: 0, badgesUnlocked: [],
};

function saveState() {
  localStorage.setItem('rr_state', JSON.stringify(state));
}

window.earnXP = function(amount, msg) {
  state.xp += amount;
  updateXPUI();
  checkBadges();
  if (msg) showToast(msg.includes('XP') ? msg : `${msg} +${amount} XP ⭐`);
  saveState();
};

function updateXPUI() {
  const level = LEVELS.findLastIndex(l => state.xp >= l.xp);
  state.level = level;

  const nextLvl = LEVELS[level + 1];
  const currXP  = LEVELS[level].xp;
  const nextXP  = nextLvl ? nextLvl.xp : state.xp;
  const pct     = nextLvl ? ((state.xp - currXP) / (nextXP - currXP)) * 100 : 100;

  document.getElementById('xp-total').textContent  = state.xp;
  document.getElementById('nav-xp-count').textContent = state.xp + ' XP';
  document.getElementById('level-num').textContent = level + 1;
  document.getElementById('level-name').textContent = LEVELS[level].name;
  document.getElementById('xp-fill').style.width   = Math.min(pct, 100) + '%';
  document.getElementById('xp-needed').textContent = nextLvl ? nextXP : '∞';
  document.getElementById('streak-count').textContent = state.streak;

  renderBadges();
}
window.updateXPUI = updateXPUI;

function checkStreak() {
  const today = new Date().toDateString();
  if (state.lastDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (state.lastDate === yesterday) {
    state.streak += 1;
  } else if (!state.lastDate) {
    state.streak = 1;
  } else {
    state.streak = 1; // reset
  }
  state.lastDate = today;
  saveState();
}

function checkBadges() {
  let newlyUnlocked = false;

  BADGES.forEach(badge => {
    // Skip if already unlocked
    if (state.badgesUnlocked.includes(badge.name)) return;

    let unlocked = false;
    if (badge.type === 'login' && state.xp > 0) unlocked = true;
    if (badge.type === 'xp' && state.xp >= badge.threshold) unlocked = true;
    if (badge.type === 'streak' && state.streak >= badge.threshold) unlocked = true;
    if (badge.type === 'calc' && state.calcUsed >= badge.threshold) unlocked = true;
    if (badge.type === 'level' && state.level >= badge.threshold) unlocked = true;
    if (badge.type === 'habits' && state.habitsCompleted >= badge.threshold) unlocked = true;
    if (badge.type === 'contract') {
      try {
        const contracts = JSON.parse(localStorage.getItem('rr_contracts') || '[]');
        const completed = contracts.filter(c => c.status === 'completed').length;
        if (completed >= badge.threshold) unlocked = true;
      } catch {}
    }

    if (unlocked) {
      state.badgesUnlocked.push(badge.name);
      newlyUnlocked = true;
      showBadgePopup(badge);
    }
  });

  if (newlyUnlocked) {
    saveState();
    renderBadges();
    // Also sync to server if logged in
    if (window.syncState) window.syncState();
  }
}

function showBadgePopup(badge) {
  let popup = document.getElementById('badge-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'badge-popup';
    popup.className = 'badge-popup';
    document.body.appendChild(popup);
  }

  // Set content
  popup.innerHTML = `
    <div class="badge-popup-inner">
      <div class="badge-popup-rays"></div>
      <div class="badge-popup-icon">${badge.emoji}</div>
      <div class="badge-popup-text">
        <div class="badge-popup-title">Badge Unlocked!</div>
        <div class="badge-popup-name">${badge.name}</div>
      </div>
    </div>
  `;

  // Animate in
  popup.classList.remove('show');
  void popup.offsetWidth; // trigger reflow
  popup.classList.add('show');

  // Play sound
  try {
    const audio = new Audio('data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
    // We don't have a real mp3 base64 here so we just rely on visual,
    // but we wrap it in a try-catch to avoid errors.
  } catch(e) {}

  // Remove after 4s
  clearTimeout(popup._timer);
  popup._timer = setTimeout(() => {
    popup.classList.remove('show');
  }, 4000);
}

function renderBadges() {
  const grid = document.getElementById('badges-grid');
  grid.innerHTML = BADGES.map(b => {
    const unlocked = state.badgesUnlocked.includes(b.name);
    return `
    <div class="badge-item ${unlocked ? 'unlocked' : 'locked'}" title="${b.req}">
      <div class="badge-emoji">${b.emoji}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-req">${b.req}</div>
    </div>`;
  }).join('');
}

// ─────────────────────────────────────────
// 10. DAILY HABITS
// ─────────────────────────────────────────
const HABITS = [
  { emoji: '💸', title: 'Track all expenses',    desc: 'Log every spend today',        xp: 20 },
  { emoji: '📉', title: 'Skip one impulse buy',  desc: 'Put that money in savings',    xp: 25 },
  { emoji: '🧠', title: 'Read a finance tip',    desc: 'Scroll the education section', xp: 15 },
  { emoji: '📊', title: 'Check your SIP',        desc: 'Review portfolio once a week', xp: 30 },
  { emoji: '🎯', title: 'Set a savings goal',    desc: 'Define your target for month', xp: 20 },
];

let habitsDoneToday = JSON.parse(localStorage.getItem('rr_habits') || '[]');

function initHabits() {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem('rr_habit_date');
  if (savedDate !== today) {
    habitsDoneToday = [];
    localStorage.setItem('rr_habit_date', today);
    localStorage.setItem('rr_habits', '[]');
  }

  const container = document.getElementById('habit-cards');
  container.innerHTML = HABITS.map((h, i) => `
    <div class="habit-card glass-card ${habitsDoneToday.includes(i) ? 'completed' : ''}"
         id="habit-${i}" onclick="toggleHabit(${i})" role="checkbox"
         aria-checked="${habitsDoneToday.includes(i)}" tabindex="0">
      <div class="habit-checkbox">${habitsDoneToday.includes(i) ? '✓' : h.emoji}</div>
      <div class="habit-body">
        <div class="habit-title">${h.title}</div>
        <div class="habit-desc">${h.desc}</div>
        <div class="habit-xp">+${h.xp} XP</div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.habit-card').forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

window.toggleHabit = function(idx) {
  const card = document.getElementById('habit-${idx}');
  const cardEl = document.getElementById(`habit-${idx}`);
  if (habitsDoneToday.includes(idx)) return; // once done, locked for the day
  habitsDoneToday.push(idx);
  localStorage.setItem('rr_habits', JSON.stringify(habitsDoneToday));
  cardEl.classList.add('completed');
  cardEl.querySelector('.habit-checkbox').textContent = '✓';
  cardEl.querySelector('.habit-title').style.textDecoration = 'line-through';

  state.habitsCompleted++;
  earnXP(HABITS[idx].xp, `✅ "${HABITS[idx].title}" done!`);
  checkBadges();

  if (habitsDoneToday.length === HABITS.length) {
    setTimeout(() => showToast('🎉 All habits done today! You\'re crushing it!', 4000), 800);
  }
};

// ─────────────────────────────────────────
// 11. EDUCATION TIPS CAROUSEL
// ─────────────────────────────────────────
const TIPS = [
  {
    icon: '🚀', tag: 'Compound Interest', title: 'The 8th Wonder of the World',
    body: 'Einstein called compound interest the most powerful force in the universe. ₹10,000 at 12% return for 30 years becomes ₹2.99 Lakh — without adding a single rupee more. Time is literally money.',
    takeaway: '💡 Start with ₹500 today — even that matters.'
  },
  {
    icon: '⏰', tag: 'Time Value of Money', title: '₹1 Today > ₹1 Tomorrow',
    body: 'A rupee invested today is worth more than a rupee invested tomorrow because of its potential to earn. Waiting 5 years can slash your corpus by 40%. Every month you wait, your "retirement tax" goes up.',
    takeaway: '💡 The best day to start was yesterday. The 2nd best? Today.'
  },
  {
    icon: '📦', tag: 'SIP Strategy', title: 'Automate It, Forget It, Win',
    body: 'A Systematic Investment Plan (SIP) auto-deducts savings on your payday — before you can spend it. You don\'t need discipline. You need automation. Set it up once and your future self does the rest.',
    takeaway: '💡 Automate ₹1,000/month SIP in a Nifty index fund.'
  },
  {
    icon: '📊', tag: 'Index Funds', title: 'Beat 90% of Investors by Doing Less',
    body: 'Active fund managers rarely beat the market consistently. But index funds (like Nifty 50) simply track the market, charge near-zero fees, and historically return 12–14% CAGR. Less drama, more returns.',
    takeaway: '💡 Invest in Nifty 50 index fund. Low cost, high reward.'
  },
  {
    icon: '🧲', tag: 'FIRE Movement', title: 'Financial Independence, Retire Early',
    body: 'FIRE = Financial Independence, Retire Early. Save 50–70% of income, invest aggressively, retire in your 40s or 50s. Gen Z can be the first generation to retire before their parents — if they start now.',
    takeaway: '💡 Your savings rate matters more than your salary.'
  },
  {
    icon: '🛡️', tag: 'Emergency Fund', title: 'Your Financial Safety Net',
    body: 'Before investing, build 3–6 months of expenses as an emergency fund in a liquid account. This prevents you from withdrawing retirement savings during a crisis. Protect the foundation first.',
    takeaway: '💡 Target ₹1-2 Lakh emergency fund before investing.'
  },
  {
    icon: '📈', tag: 'Step-Up SIP', title: 'The 10% Rule That Triples Your Wealth',
    body: 'Increase your SIP by just 10% every year along with your salary hike. If you invest ₹5,000/month now and step up 10% each year, your corpus can be 3x larger than a flat SIP at the same amount.',
    takeaway: '💡 Set a calendar reminder every January to increase SIP.'
  },
  {
    icon: '🧾', tag: 'Tax Efficiency', title: 'Let the Government Fund Your Retirement',
    body: 'ELSS mutual funds give you 12-15% returns AND ₹1.5L tax deduction under Section 80C. NPS gives additional ₹50K deduction. Use tax savings to invest more — legal wealth hacking.',
    takeaway: '💡 Start an ELSS SIP — save tax, build wealth simultaneously.'
  },
  {
    icon: '💳', tag: 'Lifestyle Inflation', title: 'Your Biggest Retirement Enemy',
    body: 'Lifestyle inflation = spending more as you earn more. Every raise gets consumed by a better phone, more dining, a bigger flat. Keep lifestyle flat for 5 years while investing salary hikes. Game-changing.',
    takeaway: '💡 Live like a student for 5 more years. Retire like a king.'
  },
  {
    icon: '🌍', tag: 'Diversification', title: 'Don\'t Put All Eggs in One Basket',
    body: 'Spread investments across equity (growth), debt (stability), and international funds (currency hedge). When Indian markets fall, US markets may rise. Diversification reduces risk without sacrificing returns.',
    takeaway: '💡 60% equity, 25% debt, 15% international — a solid Gen Z portfolio.'
  },
];

let currentTip = 0;

function initTips() {
  const track = document.getElementById('tips-track');
  const dots  = document.getElementById('tips-dots');

  track.innerHTML = TIPS.map((tip, i) => `
    <div class="tip-card glass-card" id="tip-${i}" role="article" aria-label="Tip ${i+1}">
      <div class="tip-header">
        <div class="tip-icon">${tip.icon}</div>
        <div class="tip-content">
          <div class="tip-tag">${tip.tag}</div>
          <h3 class="tip-title">${tip.title}</h3>
          <p class="tip-body">${tip.body}</p>
        </div>
      </div>
      <div class="tip-footer">
        <span class="tip-takeaway">${tip.takeaway}</span>
        <span class="tip-num">${i+1} / ${TIPS.length}</span>
      </div>
    </div>
  `).join('');

  dots.innerHTML = TIPS.map((_, i) => `
    <div class="tip-dot ${i === 0 ? 'active' : ''}" onclick="goToTip(${i})" role="button" aria-label="Tip ${i+1}" tabindex="0"></div>
  `).join('');

  document.getElementById('tip-next').addEventListener('click', () => goToTip((currentTip + 1) % TIPS.length));
  document.getElementById('tip-prev').addEventListener('click', () => goToTip((currentTip - 1 + TIPS.length) % TIPS.length));

  // Auto-advance every 8 seconds
  setInterval(() => goToTip((currentTip + 1) % TIPS.length), 8000);
}

window.goToTip = function(idx) {
  currentTip = idx;
  document.getElementById('tips-track').style.transform = `translateX(-${idx * 100}%)`;
  document.querySelectorAll('.tip-dot').forEach((dot, i) => dot.classList.toggle('active', i === idx));
};

// ─────────────────────────────────────────
// 12. BEHAVIORAL NUDGES
// ─────────────────────────────────────────
const NUDGES = [
  'Skipping one ₹200 delivery order = ₹2.4 Lakh in 20 years. Think about it.',
  'Your daily coffee habit (₹100/day) = ₹1.2 Crore if invested over 30 years 😲',
  '23-year-old who saves ₹3K/month retires at 50 with ₹2+ Crore. Be that person.',
  'India\'s top 1% started investing before age 25. You still have time. 💪',
  'Every ₹500 SIP you delay = ~₹5,000 less in your retirement corpus.',
  'The equity market doubles roughly every 6-7 years. Are you in? 📈',
  'Your future self is begging you to start today. Don\'t let them down.',
  'SIP ₹5,000/month from age 22 = ₹3.5 Crore by 55. Math is on your side.',
  'Inflation eats 6% of your cash every year. Invest to stay ahead. 🚀',
  'FIRE isn\'t just for tech bros. It\'s a mindset. And it starts today.',
];

let nudgeIdx = 0;

function initNudges() {
  const banner = document.getElementById('nudge-banner');
  const textEl = document.getElementById('nudge-text');
  const closeBtn = document.getElementById('nudge-close');

  closeBtn.addEventListener('click', () => {
    nudgeIdx = (nudgeIdx + 1) % NUDGES.length;
    textEl.style.opacity = '0';
    setTimeout(() => {
      textEl.textContent = NUDGES[nudgeIdx];
      textEl.style.opacity = '1';
    }, 250);
  });

  // Rotate nudge every 15 seconds
  setInterval(() => {
    nudgeIdx = (nudgeIdx + 1) % NUDGES.length;
    textEl.style.transition = 'opacity 0.3s ease';
    textEl.style.opacity = '0';
    setTimeout(() => {
      textEl.textContent = NUDGES[nudgeIdx];
      textEl.style.opacity = '1';
    }, 300);
  }, 15000);
}

// ─────────────────────────────────────────
// 13. FUTURE SELF INTERACTIONS
// ─────────────────────────────────────────
function initFutureSelf() {
  document.getElementById('choose-saver').addEventListener('click', () => {
    earnXP(50, '💪 Smart Saver path chosen! +50 XP');
    document.getElementById('path-saver').style.transform = 'scale(1.02)';
    document.getElementById('path-saver').style.borderColor = 'rgba(16,185,129,0.7)';
    setTimeout(() => document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' }), 800);
  });

  document.getElementById('choose-spender').addEventListener('click', () => {
    showToast('No worries! The calculator will show you the way 🚀', 3000);
    setTimeout(() => document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' }), 600);
  });
}

// ─────────────────────────────────────────
// 14. ACTION PLAN BUTTONS (already inline in HTML via onclick=earnXP)
// Track calc usage
// ─────────────────────────────────────────
function trackCalcUsage() {
  state.calcUsed++;
  checkBadges();
  saveState();
}

// ─────────────────────────────────────────
// 15. BOOT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initHeroMiniChart();
  initHeroCounters();
  initCalculator();
  initAllocation();
  initHabits();
  initTips();
  initNudges();
  initFutureSelf();

  checkStreak();
  updateXPUI();
  checkBadges();

  // Show empty prompt state (no dummy values)
  // Lifestyle and Future Self update only when user clicks Calculate

  // Init new modules
  initVoice();
  initContracts();
  initQuiz();
  initAuth();

  // Do NOT auto-run calculation — let user trigger it manually

  // Override calc button to also track
  const origCalcBtn = document.getElementById('calc-btn');
  origCalcBtn.addEventListener('click', () => {
    state.calcUsed++;
    checkBadges();
    saveState();
  });

  // Keyboard tip navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goToTip((currentTip + 1) % TIPS.length);
    if (e.key === 'ArrowLeft')  goToTip((currentTip - 1 + TIPS.length) % TIPS.length);
  });

  console.log('%cRetireRight 🚀', 'font-size:2rem; font-weight:900; color:#7c3aed;');
  console.log('%cEmpowering Gen Z to retire early.', 'color:#94a3b8');

  // ── Neon flash utility wiring ──
  initNeonFlashes();
});

// ─────────────────────────────────────────
// 16. NEON FLASH WIRING
// ─────────────────────────────────────────
function neonFlash(el, cls = 'neon-flash') {
  if (!el) return;
  el.classList.remove(cls);
  // Force reflow so re-adding the class triggers the animation again
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 650);
}

function initNeonFlashes() {
  // All primary buttons → purple neon burst on click
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', () => neonFlash(btn, 'neon-flash'));
  });

  // All ghost buttons → purple border flash on click
  document.querySelectorAll('.btn-ghost').forEach(btn => {
    btn.addEventListener('click', () => neonFlash(btn, 'neon-flash'));
  });

  // Calc button → also flash all 4 result cards with cyan on calculation
  document.getElementById('calc-btn')?.addEventListener('click', () => {
    setTimeout(() => {
      ['result-corpus','result-invested','result-growth','result-wait'].forEach((id, i) => {
        setTimeout(() => {
          const card = document.getElementById(id);
          const cls  = id === 'result-growth' ? 'neon-flash-green'
                     : id === 'result-wait'   ? 'neon-flash-amber'
                     : 'neon-flash-cyan';
          neonFlash(card, cls);
        }, i * 80);
      });
    }, 300);
  });

  // XP pill → amber flash every time XP is earned (patch earnXP)
  const _origEarnXP = window.earnXP;
  window.earnXP = function(amount, msg) {
    _origEarnXP(amount, msg);
    neonFlash(document.querySelector('.nav-xp'), 'neon-flash-amber');
    neonFlash(document.querySelector('.xp-pill'), 'neon-flash-amber');
    neonFlash(document.querySelector('.gamification-header'), 'neon-flash-purple');
  };

  // Habit cards → green flash on toggle (patch toggleHabit)
  const _origToggle = window.toggleHabit;
  window.toggleHabit = function(idx) {
    _origToggle(idx);
    setTimeout(() => {
      const card = document.getElementById(`habit-${idx}`);
      neonFlash(card, 'neon-flash-green');
    }, 50);
  };

  // Tips arrows → cyan flash already handled by CSS :active,
  // but also reinforce with JS for a stronger burst
  document.getElementById('tip-next')?.addEventListener('click', (e) => {
    neonFlash(e.currentTarget, 'neon-flash-cyan');
  });
  document.getElementById('tip-prev')?.addEventListener('click', (e) => {
    neonFlash(e.currentTarget, 'neon-flash-cyan');
  });

  // Path choice buttons (Future Self section)
  document.getElementById('choose-saver')?.addEventListener('click', () => {
    neonFlash(document.getElementById('path-saver'), 'neon-flash-green');
  });
  document.getElementById('choose-spender')?.addEventListener('click', () => {
    neonFlash(document.getElementById('path-spender'), 'neon-flash');
  });
}
