import { Router } from 'express';
import { saveUserInvestmentProfile } from '../utils/saveProfile.js';
import { computeInsights }          from '../utils/computeInsights.js';

const router = Router();

// ── Health Check ──
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'FutureLoop RPG API',
    timestamp: new Date().toISOString(),
  });
});

// ── Placeholder: Server-side Calculation ──
router.post('/calculate', (req, res) => {
  const { currentAge, retireAge, monthlySaving, annualReturn } = req.body;

  if (!currentAge || !retireAge || !monthlySaving || !annualReturn) {
    return res.status(400).json({ error: 'Missing required fields: currentAge, retireAge, monthlySaving, annualReturn' });
  }

  const years = Math.max(retireAge - currentAge, 1);
  const r = annualReturn / 100 / 12;
  const n = years * 12;
  const corpus = r === 0
    ? monthlySaving * n
    : monthlySaving * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);

  const invested = monthlySaving * years * 12;
  const growth = corpus - invested;

  // Cost of waiting 5 years
  const yearsLate = Math.max(years - 5, 1);
  const nLate = yearsLate * 12;
  const corpusLate = r === 0
    ? monthlySaving * nLate
    : monthlySaving * ((Math.pow(1 + r, nLate) - 1) / r) * (1 + r);
  const waitCost = corpus - corpusLate;

  res.json({ corpus, invested, growth, waitCost, years });
});

// ── Placeholder: Tips ──
router.get('/tips', (_req, res) => {
  res.json({
    tips: [
      { id: 1, title: 'Start a SIP today', category: 'Getting Started' },
      { id: 2, title: 'Automate your savings', category: 'Automation' },
      { id: 3, title: 'Step up SIP by 10% yearly', category: 'Growth' },
    ],
  });
});

// ── POST /api/insights — save anonymous profile → get community insights ──
router.post('/insights', async (req, res) => {
  try {
    const {
      age, monthlySaving, riskLevel, annualReturn, estimatedCorpus,
      startAge, investmentSplit, consistencyScore,
    } = req.body;

    if (!age || !monthlySaving || !annualReturn || !estimatedCorpus) {
      return res.status(400).json({ error: 'Missing required fields: age, monthlySaving, annualReturn, estimatedCorpus' });
    }

    // Fire-and-forget: save profile to in-memory store (no await needed)
    saveUserInvestmentProfile({
      age, monthlySaving, riskLevel, annualReturn, estimatedCorpus,
      startAge: startAge ?? age,
      investmentSplit: investmentSplit ?? { equity: 60, debt: 25, crypto: 10, cash: 5 },
      consistencyScore: consistencyScore ?? null,
    });

    // Compute insights with this user's context for personalised suggestions
    const insights = computeInsights({ age, monthlySaving, riskLevel, annualReturn, estimatedCorpus });

    res.json(insights);
  } catch (err) {
    console.error('[POST /api/insights]', err.message);
    res.status(500).json({ error: 'Failed to compute insights' });
  }
});

// ── GET /api/insights — read-only community stats (no profile saved) ──
router.get('/insights', (_req, res) => {
  try {
    const insights = computeInsights();
    res.json(insights);
  } catch (err) {
    console.error('[GET /api/insights]', err.message);
    res.status(500).json({ error: 'Failed to compute insights' });
  }
});

export default router;

