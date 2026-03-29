/**
 * computeInsights.js
 * ──────────────────────────────────────────────────────────────────────────
 * Pure stat engine: aggregates in-memory profiles into community insights
 * and maps them to human-readable, personalised suggestions.
 *
 * No external dependencies. Future-ready for DB replacement.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { getAllProfiles, getProfileCount } from './profileStore.js';

// ── Helpers ──────────────────────────────────────────────────────────────

const avg  = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
const pct  = (part, total) => total ? Math.round((part / total) * 100) : 0;
const round2 = (n) => Math.round(n * 100) / 100;

// Map an age to a Gen-Z friendly cohort label
function ageCohort(age) {
  if (age < 22) return 'Early Starter (<22)';
  if (age < 26) return 'College Graduate (22–25)';
  if (age < 30) return 'First Job (26–29)';
  if (age < 35) return 'Early Career (30–34)';
  return 'Mid Career (35+)';
}

// Derive a risk level from annual return if not explicitly supplied
function inferRisk(annualReturn) {
  if (annualReturn <= 7)  return 'low';
  if (annualReturn <= 12) return 'moderate';
  return 'high';
}

// ── Static Fallback ───────────────────────────────────────────────────────

const STATIC_FALLBACK = {
  sampleSize: 0,
  message: 'Not enough data yet — be the first to contribute! Showing benchmark suggestions.',
  benchmarks: {
    avgMonthlySaving: 5000,
    avgAnnualReturn:  12,
    popularRiskLevel: 'moderate',
  },
  suggestions: [
    {
      type: 'general',
      title: '🚀 Start Early, Retire Comfy',
      body:  'Starting at 22 vs 27 can double your retirement corpus thanks to compounding.',
    },
    {
      type: 'general',
      title: '📈 Step Up Your SIP by 10% Every Year',
      body:  'A 10% annual SIP step-up can grow your corpus by 40% over 20 years.',
    },
    {
      type: 'general',
      title: '⚖️ Diversify: Equity + Debt Mix',
      body:  'A 70/30 equity-to-debt split balances growth and stability for most risk profiles.',
    },
  ],
};

// ── Main Aggregator ───────────────────────────────────────────────────────

/**
 * Compute community statistics and personalised suggestions.
 *
 * @param {object}  [userContext]            - Optional current-user context for personalisation
 * @param {number}  [userContext.age]
 * @param {number}  [userContext.monthlySaving]
 * @param {string}  [userContext.riskLevel]
 * @param {number}  [userContext.annualReturn]
 * @param {number}  [userContext.estimatedCorpus]
 * @returns {object}
 */
export function computeInsights(userContext = {}) {
  const profiles = getAllProfiles();
  const count    = getProfileCount();

  if (count < 3) {
    // Not enough data — return static fallback with any user-specific tip
    const fallback = { ...STATIC_FALLBACK };
    if (userContext.age && userContext.age < 25) {
      fallback.suggestions = [
        {
          type: 'personalised',
          title: '🎯 You\'re Ahead of the Curve!',
          body:  'Most Gen Z-ers start saving after 27. You\'re already building a head start.',
        },
        ...fallback.suggestions,
      ];
    }
    return fallback;
  }

  // ── Aggregate Stats ───────────────────────────────────────────────────

  const ages          = profiles.map(p => p.age);
  const savings       = profiles.map(p => p.monthlySaving);
  const returns       = profiles.map(p => p.annualReturn);
  const corpuses      = profiles.map(p => p.estimatedCorpus);

  const avgAge         = round2(avg(ages));
  const avgSaving      = round2(avg(savings));
  const avgReturn      = round2(avg(returns));
  const avgCorpus      = round2(avg(corpuses));

  // Risk distribution
  const riskCounts = { low: 0, moderate: 0, high: 0 };
  profiles.forEach(p => {
    const r = p.riskLevel || inferRisk(p.annualReturn);
    if (riskCounts[r] !== undefined) riskCounts[r]++;
  });
  const popularRisk = Object.entries(riskCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Age cohort distribution
  const cohortCounts = {};
  ages.forEach(age => {
    const label = ageCohort(age);
    cohortCounts[label] = (cohortCounts[label] ?? 0) + 1;
  });

  // Avg allocation splits
  const avgSplit = {
    equity: round2(avg(profiles.map(p => p.investmentSplit?.equity ?? 0))),
    debt:   round2(avg(profiles.map(p => p.investmentSplit?.debt   ?? 0))),
    crypto: round2(avg(profiles.map(p => p.investmentSplit?.crypto ?? 0))),
    cash:   round2(avg(profiles.map(p => p.investmentSplit?.cash   ?? 0))),
  };

  // ── Suggestions Engine ────────────────────────────────────────────────

  const suggestions = [];

  // 1. Savings comparison
  if (userContext.monthlySaving != null) {
    const userSaving = Number(userContext.monthlySaving);
    if (userSaving < avgSaving * 0.8) {
      suggestions.push({
        type: 'personalised',
        title: '💡 Boost Your Monthly SIP',
        body:  `Community average is ₹${avgSaving.toLocaleString('en-IN')} / month. ` +
               `You're saving ₹${userSaving.toLocaleString('en-IN')} — a small increase can compound significantly.`,
      });
    } else if (userSaving >= avgSaving * 1.2) {
      suggestions.push({
        type: 'personalised',
        title: '🏆 Super Saver Alert!',
        body:  `You're saving more than 80% of your peers (avg ₹${avgSaving.toLocaleString('en-IN')}). Keep it up!`,
      });
    }
  }

  // 2. Age-based nudge
  if (userContext.age != null) {
    const userAge = Number(userContext.age);
    if (userAge < avgAge - 2) {
      suggestions.push({
        type: 'personalised',
        title: '⏰ Early Bird Advantage',
        body:  `You're starting ${Math.round(avgAge - userAge)} years earlier than the average user (${avgAge} yrs). ` +
               `That compounding edge is massive — don't let it slip!`,
      });
    } else if (userAge > avgAge + 2) {
      suggestions.push({
        type: 'personalised',
        title: '🔥 Late Start? Compensate with Higher SIP',
        body:  `You're starting a bit later than peers. Increasing your monthly SIP or return rate can close the gap.`,
      });
    }
  }

  // 3. Risk level suggestion
  if (userContext.riskLevel) {
    if (userContext.riskLevel === 'low' && riskCounts.high > riskCounts.low) {
      suggestions.push({
        type: 'community',
        title: '📊 Most Peers Embrace More Risk',
        body:  `${pct(riskCounts.high, count)}% of your peers choose high-risk portfolios for higher long-term returns. ` +
               `Consider a moderate allocation to equity to grow faster.`,
      });
    } else if (userContext.riskLevel === 'high' && popularRisk === 'moderate') {
      suggestions.push({
        type: 'community',
        title: '⚖️ Balance Your Portfolio',
        body:  `The community favourite is a moderate risk profile. Adding some debt/cash can cushion market dips.`,
      });
    }
  }

  // 4. Allocation tips
  if (avgSplit.crypto > 20) {
    suggestions.push({
      type: 'community',
      title: '⚠️ Community Crypto Trend',
      body:  `On average, users allocate ${avgSplit.crypto}% to crypto. While opportunistic, keep it under 10–15% to manage volatility.`,
    });
  }

  if (avgSplit.cash > 20) {
    suggestions.push({
      type: 'community',
      title: '🏦 Idle Cash Is a Missed Opportunity',
      body:  `Community data shows ${avgSplit.cash}% in cash on average. Move excess cash into debt funds or liquid funds to earn better returns.`,
    });
  }

  // 5. Universal tips (always included)
  suggestions.push(
    {
      type: 'general',
      title: '📈 Step Up Your SIP by 10% Every Year',
      body:  'A 10% annual SIP step-up can grow your corpus by up to 40% over 20 years.',
    },
    {
      type: 'general',
      title: '🔄 Rebalance Every 6 Months',
      body:  'Market swings drift your allocation. Rebalancing keeps your risk in check and locks in gains.',
    },
  );

  // ── Build Response ────────────────────────────────────────────────────

  return {
    sampleSize: count,
    communityStats: {
      avgAge,
      avgMonthlySaving: avgSaving,
      avgAnnualReturn:  avgReturn,
      avgEstimatedCorpus: avgCorpus,
      popularRiskLevel: popularRisk,
      riskDistribution: {
        low:      pct(riskCounts.low,      count),
        moderate: pct(riskCounts.moderate, count),
        high:     pct(riskCounts.high,     count),
      },
      avgInvestmentSplit: avgSplit,
      ageCohorts: Object.fromEntries(
        Object.entries(cohortCounts).map(([k, v]) => [k, pct(v, count)])
      ),
    },
    suggestions,
  };
}
