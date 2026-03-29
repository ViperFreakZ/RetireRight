import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import apiRouter from './routes/api.js';
import authRouter from './routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ──
app.use('/api', apiRouter);
app.use('/api/auth', authRouter);

// ── Serve Frontend Static Build (Production) ──
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));

// ── SPA Catch-All: serve index.html for all non-API routes ──
app.use((req, res, next) => {
  // Skip API routes — let the 404 handler take care of those
  if (req.path.startsWith('/api')) {
    return next();
  }
  // Only handle GET requests for SPA fallback
  if (req.method !== 'GET') {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── 404 Handler (API only) ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ── Error Handler ──
app.use((err, _req, res, _next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ── Start ──
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 RetireRight running at http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
    console.log(`   Frontend:     http://localhost:${PORT}\n`);
  });
}

export default app;
