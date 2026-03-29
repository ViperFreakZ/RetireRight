/**
 * profileStore.js
 * ──────────────────────────────────────────────────────────────────────────
 * Lightweight in-memory store for anonymised user investment profiles.
 * Supports future community-insight queries without any external database.
 *
 * Rules:
 *  • Max 1 000 records (FIFO eviction) — keeps memory footprint tiny.
 *  • No PII — only behavioural / financial pattern data.
 *  • Pure ESM, zero dependencies.
 * ──────────────────────────────────────────────────────────────────────────
 */

const MAX_RECORDS = 1000;

/** @type {Array<import('./saveProfile.js').ProfileData>} */
const store = [];

/**
 * Add one anonymised profile to the in-memory store.
 * Silently drops the oldest entry when the store is full.
 *
 * @param {import('./saveProfile.js').ProfileData} profile
 */
export function addProfile(profile) {
  if (store.length >= MAX_RECORDS) {
    store.shift(); // FIFO eviction
  }
  store.push({ ...profile, createdAt: new Date().toISOString() });
}

/**
 * Return a readonly snapshot of all stored profiles.
 * @returns {ReadonlyArray<import('./saveProfile.js').ProfileData>}
 */
export function getAllProfiles() {
  return store;
}

/**
 * Return the current number of stored profiles.
 * @returns {number}
 */
export function getProfileCount() {
  return store.length;
}
