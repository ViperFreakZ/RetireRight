/* ================================================================
   RetireRight — Voice-Controlled Assistant
   Uses Web Speech API (SpeechRecognition + SpeechSynthesis)
   ================================================================ */

// ─────────────────────────────────────────
// STATE
// ─────────────────────────────────────────
let recognition = null;
let isListening = false;
let micBtn = null;
let transcriptEl = null;
let overlayEl = null;

// ─────────────────────────────────────────
// COMMAND MAP
// ─────────────────────────────────────────
const COMMANDS = [
  {
    keywords: ['calculate', 'calculator', 'retirement', 'run calculator', 'compute'],
    action: () => {
      navigateTo('calculator');
      setTimeout(() => document.getElementById('calc-btn')?.click(), 400);
      speak('Opening the calculator.');
    },
    description: 'Run the retirement calculator',
  },
  {
    keywords: ['corpus', 'how much', 'my money', 'my savings', 'total'],
    action: () => {
      navigateTo('calculator');
      const corpusEl = document.getElementById('corpus-val');
      const val = corpusEl?.textContent || '₹0';
      speak(`Your estimated retirement corpus is ${val}.`);
    },
    description: 'Hear your retirement corpus',
  },
  {
    keywords: ['portfolio', 'invest', 'allocation', 'stocks'],
    action: () => {
      speak('Opening the portfolio allocator.');
      navigateTo('invest');
    },
    description: 'Go to portfolio section',
  },
  {
    keywords: ['habit', 'habits', 'daily', 'track', 'expense'],
    action: () => {
      speak('Here are your daily habits. Keep up the streak!');
      navigateTo('habits');
    },
    description: 'Go to daily habits',
  },
  {
    keywords: ['education', 'tips', 'learn', 'teach', 'finance 101'],
    action: () => {
      speak('Opening the education hub.');
      navigateTo('education');
    },
    description: 'Go to education tips',
  },
  {
    keywords: ['future self', 'future', 'avatar', 'saver', 'spender'],
    action: () => {
      speak('Meet your future self. Choose your path wisely.');
      navigateTo('future-self');
    },
    description: 'Go to future self visualizer',
  },
  {
    keywords: ['lifestyle', 'buy', 'iphone', 'trip', 'coffee'],
    action: () => {
      speak('Let me show you what your corpus can buy.');
      navigateTo('lifestyle');
    },
    description: 'Go to lifestyle simulator',
  },
  {
    keywords: ['contract', 'commitment', 'pledge', 'promise'],
    action: () => {
      speak('Opening the commitment contracts section.');
      navigateTo('commitment');
    },
    description: 'Go to commitment contracts',
  },
  {
    keywords: ['quiz', 'trivia', 'test', 'questionnaire'],
    action: () => {
      speak('Opening the finance quiz. Let\'s test your knowledge!');
      navigateTo('quiz');
    },
    description: 'Go to finance quiz',
  },
  {
    keywords: ['leaderboard', 'board', 'ranking', 'rankings', 'top players'],
    action: () => {
      speak('Opening the leaderboard. Let\'s see who\'s on top!');
      navigateTo('leaderboard');
    },
    description: 'Go to leaderboard',
  },
  {
    keywords: ['community', 'insights', 'statistics', 'compare'],
    action: () => {
      speak('Opening community insights.');
      navigateTo('insights');
    },
    description: 'Go to community insights',
  },
  {
    keywords: ['profile', 'dashboard', 'my profile', 'account'],
    action: () => {
      speak('Opening your profile dashboard.');
      document.getElementById('nav-auth-btn')?.click();
    },
    description: 'Open profile dashboard',
  },
  {
    keywords: ['top', 'home', 'hero', 'start', 'beginning', 'main'],
    action: () => {
      speak('Going back to the home page.');
      navigateTo('all');
    },
    description: 'Go to home page',
  },
  {
    keywords: ['action', 'plan', 'step', 'next step'],
    action: () => {
      speak('Here is your 3 step action plan.');
      navigateTo('action');
    },
    description: 'Go to action plan',
  },
  {
    keywords: ['level', 'xp', 'points', 'score', 'progress'],
    action: () => {
      const xp = document.getElementById('xp-total')?.textContent || '0';
      const level = document.getElementById('level-name')?.textContent || 'unknown';
      speak(`You have ${xp} XP. Your current level is ${level}.`);
    },
    description: 'Hear your XP and level',
  },
  {
    keywords: ['streak', 'days', 'consecutive'],
    action: () => {
      const streak = document.getElementById('streak-count')?.textContent || '0';
      speak(`Your current streak is ${streak} days. Keep it going!`);
    },
    description: 'Hear your streak',
  },
  {
    keywords: ['help', 'commands', 'what can you do', 'options'],
    action: () => {
      speak(
        'You can say: calculator, portfolio, habits, quiz, leaderboard, community, lifestyle, future self, contracts, learn, profile, or home.'
      );
    },
    description: 'List available commands',
  },
];

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function navigateTo(sectionId) {
  // Use page-based navigation from auth.js
  // NAV_SECTIONS list to show/hide
  const NAV_SECTIONS = [
    'hero', 'calculator', 'insights', 'future-self', 'lifestyle',
    'invest', 'habits', 'quiz', 'commitment', 'education', 'leaderboard', 'action'
  ];

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

  const hero = document.getElementById('hero');
  const nudge = document.getElementById('nudge-banner');
  if (sectionId === 'all' || sectionId === 'hero') {
    if (hero) hero.style.display = '';
    if (nudge) nudge.style.display = '';
  } else {
    if (hero) hero.style.display = 'none';
    if (nudge) nudge.style.display = 'none';
  }

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(l => {
    const href = l.getAttribute('href')?.replace('#', '');
    l.classList.toggle('active', href === sectionId);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.05;
  utter.pitch = 1.0;
  utter.volume = 0.9;
  // Prefer a modern-sounding voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('google')
  );
  if (preferred) utter.voice = preferred;
  window.speechSynthesis.speak(utter);
}

function matchCommand(transcript) {
  const lower = transcript.toLowerCase().trim();
  for (const cmd of COMMANDS) {
    for (const kw of cmd.keywords) {
      if (lower.includes(kw)) return cmd;
    }
  }
  return null;
}

// ─────────────────────────────────────────
// UI
// ─────────────────────────────────────────
function showTranscript(text, matched) {
  if (!overlayEl) return;
  transcriptEl.textContent = `"${text}"`;
  overlayEl.classList.add('show');
  overlayEl.querySelector('.voice-status').textContent = matched
    ? '✅ Command recognized'
    : '❌ Command not recognized. Say "help" for options.';
  clearTimeout(overlayEl._timer);
  overlayEl._timer = setTimeout(() => {
    overlayEl.classList.remove('show');
  }, matched ? 3000 : 4500);
}

function setListeningState(listening) {
  isListening = listening;
  if (micBtn) {
    micBtn.classList.toggle('listening', listening);
    micBtn.setAttribute('aria-label', listening ? 'Stop listening' : 'Start voice command');
    micBtn.title = listening ? 'Listening… (click to stop)' : 'Voice commands (click to speak)';
  }
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
export function initVoice() {
  // Check browser support
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.log('[Voice] SpeechRecognition not supported in this browser.');
    return;
  }

  // Inject mic button into navbar
  const navXp = document.getElementById('nav-xp');
  if (!navXp) return;

  micBtn = document.createElement('button');
  micBtn.className = 'voice-mic-btn';
  micBtn.id = 'voice-mic-btn';
  micBtn.innerHTML = '🎤';
  micBtn.title = 'Voice commands (click to speak)';
  micBtn.setAttribute('aria-label', 'Start voice command');
  navXp.parentElement.insertBefore(micBtn, navXp);

  // Inject transcript overlay
  overlayEl = document.createElement('div');
  overlayEl.className = 'voice-overlay';
  overlayEl.id = 'voice-overlay';
  overlayEl.innerHTML = `
    <div class="voice-overlay-inner glass-card">
      <div class="voice-mic-anim">🎤</div>
      <div class="voice-transcript" id="voice-transcript"></div>
      <div class="voice-status"></div>
      <div class="voice-hint">Say "help" for a list of commands</div>
    </div>
  `;
  document.body.appendChild(overlayEl);
  transcriptEl = document.getElementById('voice-transcript');

  // Setup recognition
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const cmd = matchCommand(transcript);
    showTranscript(transcript, !!cmd);
    if (cmd) {
      cmd.action();
    } else {
      speak("I didn't understand that. Try saying help for a list of commands.");
    }
    // Auto-hide overlay after showing result
    clearTimeout(overlayEl._timer);
    overlayEl._timer = setTimeout(() => {
      overlayEl.classList.remove('show');
    }, cmd ? 2500 : 4000);
  };

  recognition.onerror = (event) => {
    console.log('[Voice] Error:', event.error);
    setListeningState(false);
    if (event.error === 'not-allowed') {
      showTranscript('Microphone access denied. Please allow it in your browser settings.', false);
    } else {
      // Hide overlay on error (e.g. no speech detected)
      clearTimeout(overlayEl._timer);
      overlayEl._timer = setTimeout(() => overlayEl.classList.remove('show'), 1500);
    }
  };

  recognition.onend = () => {
    setListeningState(false);
    // Auto-hide overlay if no result was handled (e.g. silence timeout)
    if (overlayEl.classList.contains('show') && !transcriptEl.textContent) {
      clearTimeout(overlayEl._timer);
      overlayEl._timer = setTimeout(() => overlayEl.classList.remove('show'), 800);
    }
  };

  // Toggle listening on mic click
  micBtn.addEventListener('click', () => {
    if (isListening) {
      recognition.stop();
      setListeningState(false);
    } else {
      try {
        recognition.start();
        setListeningState(true);
        overlayEl.classList.add('show');
        overlayEl.querySelector('.voice-status').textContent = '🎙️ Listening…';
        transcriptEl.textContent = '';
        clearTimeout(overlayEl._timer);
        // Safety: auto-hide after 10s if still listening
        overlayEl._timer = setTimeout(() => {
          if (isListening) {
            recognition.stop();
            setListeningState(false);
          }
          overlayEl.classList.remove('show');
        }, 10000);
      } catch (e) {
        console.error('[Voice] Start error:', e);
      }
    }
  });

  // Preload voices
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  console.log('[Voice] Voice assistant initialized.');
}
