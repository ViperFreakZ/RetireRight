/* ================================================================
   RetireRight — Saving Character Quiz
   Determines user's financial personality and generates a
   personalized corpus plan with recommended calculator settings.
   ================================================================ */

// ─────────────────────────────────────────
// QUIZ DATA
// ─────────────────────────────────────────
const QUIZ_QUESTIONS = [
  {
    question: 'You just got a ₹10,000 bonus. What do you do?',
    emoji: '💰',
    options: [
      { text: 'Invest 100% immediately', score: { saver: 3, balanced: 0, spender: 0 } },
      { text: 'Save 70%, treat yourself 30%', score: { saver: 1, balanced: 3, spender: 0 } },
      { text: 'Buy something nice, save the rest', score: { saver: 0, balanced: 1, spender: 2 } },
      { text: 'Celebrate! You earned it 🎉', score: { saver: 0, balanced: 0, spender: 3 } },
    ],
  },
  {
    question: 'How do you feel about tracking expenses?',
    emoji: '📊',
    options: [
      { text: 'I have a spreadsheet for everything', score: { saver: 3, balanced: 1, spender: 0 } },
      { text: 'I use an app, check weekly', score: { saver: 1, balanced: 3, spender: 0 } },
      { text: 'I roughly know my spending', score: { saver: 0, balanced: 1, spender: 2 } },
      { text: 'I check my balance and hope for the best', score: { saver: 0, balanced: 0, spender: 3 } },
    ],
  },
  {
    question: 'Your friend invites you on an expensive trip. You:',
    emoji: '✈️',
    options: [
      { text: 'Decline — not in my budget', score: { saver: 3, balanced: 0, spender: 0 } },
      { text: 'Go if I can plan it within savings', score: { saver: 1, balanced: 3, spender: 0 } },
      { text: 'Go and cut back next month', score: { saver: 0, balanced: 1, spender: 2 } },
      { text: 'YOLO! Deal with it later', score: { saver: 0, balanced: 0, spender: 3 } },
    ],
  },
  {
    question: 'What does retirement mean to you?',
    emoji: '🏖️',
    options: [
      { text: 'Freedom to never work again by 45', score: { saver: 3, balanced: 1, spender: 0 } },
      { text: 'Comfortable life by 55, no stress', score: { saver: 1, balanced: 3, spender: 0 } },
      { text: 'I\'ll figure it out when I\'m older', score: { saver: 0, balanced: 0, spender: 2 } },
      { text: 'Retirement? I\'m 22!', score: { saver: 0, balanced: 0, spender: 3 } },
    ],
  },
  {
    question: 'New iPhone drops. Your current phone works fine. You:',
    emoji: '📱',
    options: [
      { text: 'My phone is fine, save ₹90K instead', score: { saver: 3, balanced: 0, spender: 0 } },
      { text: 'Wait for a sale, trade in the old one', score: { saver: 1, balanced: 3, spender: 0 } },
      { text: 'Buy it on EMI, it\'s manageable', score: { saver: 0, balanced: 1, spender: 2 } },
      { text: 'Pre-order day one, obviously', score: { saver: 0, balanced: 0, spender: 3 } },
    ],
  },
  {
    question: 'How much of your income do you currently save?',
    emoji: '🏦',
    options: [
      { text: '40%+ — I live below my means', score: { saver: 3, balanced: 1, spender: 0 } },
      { text: '15–30% — I save consistently', score: { saver: 1, balanced: 3, spender: 0 } },
      { text: '5–15% — whatever\'s left over', score: { saver: 0, balanced: 1, spender: 2 } },
      { text: '<5% — money comes, money goes', score: { saver: 0, balanced: 0, spender: 3 } },
    ],
  },
  {
    question: 'Your ideal weekend involves:',
    emoji: '🎮',
    options: [
      { text: 'Free activities: home cooking, walk, books', score: { saver: 3, balanced: 0, spender: 0 } },
      { text: 'Mix of free + one planned outing', score: { saver: 1, balanced: 3, spender: 0 } },
      { text: 'Brunch, shopping, movies — the works', score: { saver: 0, balanced: 0, spender: 2 } },
      { text: 'Club, Zomato, shopping spree!', score: { saver: 0, balanced: 0, spender: 3 } },
    ],
  },
];

// ─────────────────────────────────────────
// CHARACTER DEFINITIONS
// ─────────────────────────────────────────
const CHARACTERS = {
  saver: {
    name: 'The FIRE Warrior 🔥',
    emoji: '🔥',
    color: '#10b981',
    description: 'You\'re a natural saver with an iron discipline. The FIRE movement was made for you. You prioritize long-term wealth over short-term gratification.',
    traits: ['Disciplined saver', 'Minimalist lifestyle', 'Goal-driven', 'Delayed gratification expert'],
    plan: {
      monthlySaving: 15000,
      annualReturn: 14,
      retireAge: 45,
      advice: 'You\'re already on the right track! Max out your SIP, explore index funds + ELSS for tax savings. Target FIRE by 45.',
    },
  },
  balanced: {
    name: 'The Smart Balancer ⚖️',
    emoji: '⚖️',
    color: '#7c3aed',
    description: 'You strike the perfect balance between enjoying life now and building wealth. You know when to splurge and when to save.',
    traits: ['Consistent saver', 'Enjoys life responsibly', 'Plans ahead', 'Budget-conscious'],
    plan: {
      monthlySaving: 8000,
      annualReturn: 12,
      retireAge: 55,
      advice: 'Great balance! Start a ₹8K/month SIP, auto-step-up 10% yearly. Mix Nifty 50 index + debt funds for stability.',
    },
  },
  spender: {
    name: 'The Experience Seeker 🌟',
    emoji: '🌟',
    color: '#f59e0b',
    description: 'You love living in the moment! Life\'s too short for spreadsheets, right? But a small shift now can give you the best of both worlds.',
    traits: ['Lives in the moment', 'Social & experience-driven', 'Optimistic', 'High earning potential'],
    plan: {
      monthlySaving: 3000,
      annualReturn: 12,
      retireAge: 60,
      advice: 'Start small with ₹3K/month SIP — you won\'t even miss it. Automate it on payday so it\'s painless. In 5 years, you\'ll thank yourself!',
    },
  },
};

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────
let currentQ = 0;
let scores = { saver: 0, balanced: 0, spender: 0 };
let quizCompleted = false;
const QUIZ_STORAGE_KEY = 'rr_quiz_result';

// ─────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────
function renderQuestion() {
  const container = document.getElementById('quiz-content');
  if (!container) return;

  const q = QUIZ_QUESTIONS[currentQ];
  const progress = ((currentQ) / QUIZ_QUESTIONS.length) * 100;

  container.innerHTML = `
    <div class="quiz-progress-bar">
      <div class="quiz-progress-fill" style="width:${progress}%"></div>
    </div>
    <div class="quiz-counter">Question ${currentQ + 1} of ${QUIZ_QUESTIONS.length}</div>
    <div class="quiz-question-card glass-card">
      <div class="quiz-q-emoji">${q.emoji}</div>
      <h3 class="quiz-q-text">${q.question}</h3>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" data-idx="${i}" onclick="window._quizAnswer(${i})">
            <span class="quiz-opt-letter">${String.fromCharCode(65 + i)}</span>
            <span class="quiz-opt-text">${opt.text}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderResult() {
  const container = document.getElementById('quiz-content');
  if (!container) return;

  const charType = getCharacterType();
  const char = CHARACTERS[charType];
  const plan = char.plan;

  // Save result
  localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ type: charType, scores, timestamp: Date.now() }));
  quizCompleted = true;

  container.innerHTML = `
    <div class="quiz-result">
      <div class="quiz-result-header glass-card">
        <div class="quiz-result-emoji">${char.emoji}</div>
        <h3 class="quiz-result-name">${char.name}</h3>
        <p class="quiz-result-desc">${char.description}</p>
        <div class="quiz-traits">
          ${char.traits.map(t => `<span class="quiz-trait">${t}</span>`).join('')}
        </div>
      </div>

      <div class="quiz-plan glass-card">
        <h3>📋 Your Personalized Corpus Plan</h3>
        <div class="quiz-plan-grid">
          <div class="quiz-plan-item">
            <div class="quiz-plan-val">₹${plan.monthlySaving.toLocaleString('en-IN')}</div>
            <div class="quiz-plan-label">Recommended Monthly SIP</div>
          </div>
          <div class="quiz-plan-item">
            <div class="quiz-plan-val">${plan.annualReturn}%</div>
            <div class="quiz-plan-label">Expected Annual Return</div>
          </div>
          <div class="quiz-plan-item">
            <div class="quiz-plan-val">Age ${plan.retireAge}</div>
            <div class="quiz-plan-label">Target Retirement</div>
          </div>
        </div>
        <p class="quiz-plan-advice">💡 ${plan.advice}</p>
        <div class="quiz-plan-actions">
          <button class="btn-primary" id="quiz-apply-plan" onclick="window._quizApplyPlan()">
            🎯 Apply This Plan to Calculator
          </button>
          <button class="btn-ghost" id="quiz-retake" onclick="window._quizRetake()">
            🔄 Retake Quiz
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderSavedResult() {
  const saved = localStorage.getItem(QUIZ_STORAGE_KEY);
  if (!saved) return false;

  try {
    const data = JSON.parse(saved);
    scores = data.scores;
    quizCompleted = true;
    renderResult();
    return true;
  } catch {
    return false;
  }
}

function renderStartScreen() {
  const container = document.getElementById('quiz-content');
  if (!container) return;

  container.innerHTML = `
    <div class="quiz-start glass-card">
      <div class="quiz-start-emoji">🧠</div>
      <h3>Discover Your Saving Character</h3>
      <p>Answer 7 quick questions about your spending habits. We'll reveal your financial personality and create a personalized retirement plan just for you.</p>
      <div class="quiz-start-badges">
        <span class="quiz-badge-preview">🔥 FIRE Warrior</span>
        <span class="quiz-badge-preview">⚖️ Smart Balancer</span>
        <span class="quiz-badge-preview">🌟 Experience Seeker</span>
      </div>
      <button class="btn-primary" onclick="window._quizStart()">
        🎮 Take the Quiz (+50 XP)
      </button>
    </div>
  `;
}

// ─────────────────────────────────────────
// LOGIC
// ─────────────────────────────────────────
function getCharacterType() {
  if (scores.saver >= scores.balanced && scores.saver >= scores.spender) return 'saver';
  if (scores.balanced >= scores.saver && scores.balanced >= scores.spender) return 'balanced';
  return 'spender';
}

function answerQuestion(optIdx) {
  const q = QUIZ_QUESTIONS[currentQ];
  const s = q.options[optIdx].score;
  scores.saver += s.saver;
  scores.balanced += s.balanced;
  scores.spender += s.spender;

  currentQ++;

  if (currentQ >= QUIZ_QUESTIONS.length) {
    renderResult();
    // Award XP for completing quiz
    if (typeof window.earnXP === 'function') {
      window.earnXP(50, '🧠 Saving Character quiz complete! +50 XP');
    }
  } else {
    renderQuestion();
  }
}

function applyPlan() {
  const charType = getCharacterType();
  const plan = CHARACTERS[charType].plan;

  // Set calculator slider values
  const monthlySlider = document.getElementById('monthly-saving');
  const returnSlider = document.getElementById('annual-return');
  const retireSlider = document.getElementById('retire-age');

  if (monthlySlider) {
    monthlySlider.value = plan.monthlySaving;
    document.getElementById('monthly-saving-val').textContent = `₹${plan.monthlySaving.toLocaleString('en-IN')}`;
    monthlySlider.dispatchEvent(new Event('input'));
  }
  if (returnSlider) {
    returnSlider.value = plan.annualReturn;
    document.getElementById('annual-return-val').textContent = `${plan.annualReturn}%`;
    returnSlider.dispatchEvent(new Event('input'));
  }
  if (retireSlider) {
    retireSlider.value = plan.retireAge;
    document.getElementById('retire-age-val').textContent = plan.retireAge;
    retireSlider.dispatchEvent(new Event('input'));
  }

  // Scroll to calculator and auto-run
  setTimeout(() => {
    document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('calc-btn')?.click();
    }, 600);
  }, 300);

  if (typeof window.showToast === 'function') {
    window.showToast('🎯 Plan applied! Calculator updated with your personalized settings.', 4000);
  }
}

function retakeQuiz() {
  currentQ = 0;
  scores = { saver: 0, balanced: 0, spender: 0 };
  quizCompleted = false;
  localStorage.removeItem(QUIZ_STORAGE_KEY);
  renderQuestion();
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
export function initQuiz() {
  // Wire global handlers
  window._quizAnswer = answerQuestion;
  window._quizApplyPlan = applyPlan;
  window._quizRetake = retakeQuiz;
  window._quizStart = () => {
    currentQ = 0;
    scores = { saver: 0, balanced: 0, spender: 0 };
    renderQuestion();
  };

  // Show saved result or start screen
  if (!renderSavedResult()) {
    renderStartScreen();
  }

  console.log('[Quiz] Saving Character quiz initialized.');
}
