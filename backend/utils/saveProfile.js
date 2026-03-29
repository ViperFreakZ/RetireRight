/**
 * saveProfile.js
 * ──────────────────────────────────────────────────────────────────────────
 * Utility: saveUserInvestmentProfile(data)
 *
 * Accepts calculator + allocation inputs and stores them in the in-memory
 * profile store for future community-insight aggregation.
 *
 * Design contract:
 *  • NEVER throws — all errors are caught and logged silently.
 *  • Completely async / fire-and-forget safe.
 *  • No PII stored — userId is optional anonymous string only.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { addProfile } from './profileStore.js';

/**
 * @typedef {Object} ProfileData
 * @property {string}  [userId]           - Optional anonymous session ID
 * @property {number}  age                - Current age
 * @property {number}  monthlySaving      - Monthly SIP amount (₹)
 * @property {string}  riskLevel          - 'low' | 'moderate' | 'high'
 * @property {{ equity: number, debt: number, crypto: number, cash: number }} investmentSplit
 * @property {number}  startAge           - Age savings started
 * @property {number}  annualReturn       - Expected annual return (%)
 * @property {number}  estimatedCorpus    - Projected corpus (₹)
 * @property {number}  [consistencyScore] - Optional habit/streak score 0-100
 */

/**
 * Persist an anonymised investment profile to the in-memory store.
 * Safe to call without await — errors are swallowed.
 *
 * @param {ProfileData} data
 * @returns {Promise<void>}
 */
export async function saveUserInvestmentProfile(data) {
  try {
    const profile = {
      userId:           data.userId ?? null,
      age:              Number(data.age),
      monthlySaving:    Number(data.monthlySaving),
      riskLevel:        data.riskLevel ?? 'moderate',
      investmentSplit:  {
        equity: Number(data.investmentSplit?.equity  ?? 0),
        debt:   Number(data.investmentSplit?.debt    ?? 0),
        crypto: Number(data.investmentSplit?.crypto  ?? 0),
        cash:   Number(data.investmentSplit?.cash    ?? 0),
      },
      startAge:          Number(data.startAge ?? data.age),
      annualReturn:      Number(data.annualReturn),
      estimatedCorpus:   Number(data.estimatedCorpus),
      consistencyScore:  data.consistencyScore != null ? Number(data.consistencyScore) : null,
    };

    addProfile(profile);
  } catch (err) {
    // Silent — must never affect the calling request
    console.warn('[profileStore] Failed to save profile:', err.message);
  }
}
