/**
 * authRoutes.js — signup, login, sync game state, leaderboard
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { createUser, verifyUser, updateUser, getLeaderboard } from '../utils/userStore.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'retireright-secret-key-2026';

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
    if (username.length < 3 || username.length > 20) return res.status(400).json({ error: 'Username must be 3-20 characters' });
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return res.status(400).json({ error: 'Username: letters, numbers, underscores only' });
    if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

    const user = await createUser(username, password);
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.message === 'Username already taken') return res.status(409).json({ error: err.message });
    console.error('[signup]', err.message);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const user = await verifyUser(username, password);
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Sync game state (protected)
router.post('/sync', authenticate, (req, res) => {
  try {
    const { xp, level, streak, badgesUnlocked, habitsCompleted, calcUsed } = req.body;
    const updated = updateUser(req.user.id, { xp, level, streak, badgesUnlocked, habitsCompleted, calcUsed });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ user: updated });
  } catch (err) {
    console.error('[sync]', err.message);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Leaderboard (public)
router.get('/leaderboard', (_req, res) => {
  try {
    res.json({ leaderboard: getLeaderboard(20) });
  } catch (err) {
    console.error('[leaderboard]', err.message);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

export default router;
