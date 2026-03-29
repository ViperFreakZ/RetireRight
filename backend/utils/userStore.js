/**
 * userStore.js
 * ──────────────────────────────────────────────────────────────────────────
 * JSON-file based user store. No database required.
 * Reads/writes users to backend/data/users.json.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = join(__dirname, '..', 'data');
const FILE_PATH = join(DATA_DIR, 'users.json');
const MAX_USERS = 500;

// Ensure data dir exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// ── Helpers ──

function readStore() {
  try {
    if (!existsSync(FILE_PATH)) return [];
    return JSON.parse(readFileSync(FILE_PATH, 'utf-8'));
  } catch { return []; }
}

function writeStore(users) {
  writeFileSync(FILE_PATH, JSON.stringify(users, null, 2), 'utf-8');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Public API ──

export async function createUser(username, password) {
  const users = readStore();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Username already taken');
  }

  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: generateId(),
    username,
    password: hash,
    xp: 0, level: 0, streak: 0,
    badgesUnlocked: [],
    habitsCompleted: 0,
    calcUsed: 0,
    createdAt: new Date().toISOString(),
  };

  if (users.length >= MAX_USERS) users.shift();
  users.push(user);
  writeStore(users);

  const { password: _, ...safe } = user;
  return safe;
}

export async function verifyUser(username, password) {
  const users = readStore();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  const { password: _, ...safe } = user;
  return safe;
}

export function findById(id) {
  const users = readStore();
  const user = users.find(u => u.id === id);
  if (!user) return null;
  const { password: _, ...safe } = user;
  return safe;
}

export function updateUser(id, data) {
  const users = readStore();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  ['xp','level','streak','badgesUnlocked','habitsCompleted','calcUsed'].forEach(k => {
    if (data[k] !== undefined) users[idx][k] = data[k];
  });
  writeStore(users);
  const { password: _, ...safe } = users[idx];
  return safe;
}

export function getLeaderboard(limit = 20) {
  return readStore()
    .map(({ password, ...safe }) => safe)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit)
    .map((u, i) => ({
      rank: i + 1,
      username: u.username,
      xp: u.xp,
      level: u.level,
      badgesCount: u.badgesUnlocked?.length ?? 0,
    }));
}
