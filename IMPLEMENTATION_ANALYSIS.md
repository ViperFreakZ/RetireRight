# 📋 RetireRight — Complete Implementation Analysis

> **Project Alias:** FutureLoop RPG v1.1  
> **Domain:** FinTech · Gen Z · Behavioural Finance · Gamification  
> **Generated:** 2026-03-29

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Frontend Implementation](#5-frontend-implementation)
   - 5.1 [HTML — Page Shell & Sections](#51-html--page-shell--sections)
   - 5.2 [CSS — Design System](#52-css--design-system)
   - 5.3 [JavaScript — Core Modules](#53-javascript--core-modules)
6. [Backend Implementation](#6-backend-implementation)
7. [Data Flow & State Management](#7-data-flow--state-management)
8. [Gamification Engine Deep-Dive](#8-gamification-engine-deep-dive)
9. [Behavioural Psychology Integration](#9-behavioural-psychology-integration)
10. [DevOps & Tooling](#10-devops--tooling)
11. [Security & Privacy Considerations](#11-security--privacy-considerations)
12. [Limitations & Technical Debt](#12-limitations--technical-debt)
13. [Future Roadmap](#13-future-roadmap)

---

## 1. Executive Summary

**RetireRight** is a gamified, behaviour-driven retirement planning web application designed to make saving feel immediately rewarding for Gen Z users (18–28). It bridges the gap between *knowing* you should save and *actually doing it* by leveraging psychology, gamification, and visual storytelling.

The project is structured as a **monorepo** with two decoupled services:

| Service | Description | Port |
|---------|-------------|------|
| **Frontend** | Vite-powered SPA with Chart.js visualizations | `5173` |
| **Backend** | Express.js REST API for server-side calculations & future expansion | `3000` |

**Key metrics of the codebase:**

| Metric | Value |
|--------|-------|
| Total source files | ~10 (`app.js`, `styles.css`, `index.html`, `server.js`, `api.js`, configs) |
| JS logic (frontend) | **918 lines** across 16 modules |
| CSS | **~1,100+ rules** with custom properties, glassmorphism, animations |
| HTML sections | **10 major sections** (Hero → Action Plan) |
| API endpoints | **3** (`/health`, `/calculate`, `/tips`) |
| Charts | **3** (Hero mini-chart, Compound interest comparison, Portfolio donut) |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                        │
│                                                          │
│  index.html ─── Vite Dev Server (port 5173) ──► HMR     │
│      │                                                   │
│      ├── app.js (16 modules)                             │
│      │     ├── Chart.js (auto-import)                    │
│      │     └── styles.css (imported via JS)              │
│      │                                                   │
│      └── localStorage                                    │
│           ├── rr_state  (XP, level, streak, badges)      │
│           ├── rr_habits (today's completed habits)       │
│           └── rr_habit_date (date tracking)              │
│                                                          │
├──────────────────── /api proxy ──────────────────────────┤
│                                                          │
│  Express Backend (port 3000)                             │
│      ├── GET  /api/health      → status check            │
│      ├── POST /api/calculate   → compound interest calc  │
│      └── GET  /api/tips        → financial tips          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Communication Pattern

- **Vite dev server** proxies all `/api/*` requests to the Express backend via `vite.config.js`:
  ```js
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  }
  ```
- Currently the frontend performs **all calculations client-side** — the backend `/api/calculate` endpoint is a **ready-to-use duplicate** for when the app needs server-side validation (e.g., multi-user leaderboards).

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Structure** | HTML5 (semantic) | — | SPA shell with ARIA attributes |
| **Styling** | Vanilla CSS | — | Custom properties, glassmorphism, keyframe animations |
| **Logic** | Vanilla JavaScript (ES6+) | ES Modules | All app logic, no framework dependency |
| **Charts** | Chart.js | 4.4.0 | Line charts, area charts, doughnut chart |
| **Fonts** | Google Fonts | — | Outfit (headings) + Inter (body) |
| **Bundler** | Vite | 6.2.0 | Dev server with HMR, build toolchain |
| **Backend Runtime** | Node.js + Express | 5.1.0 | REST API server |
| **Dev Auto-reload** | Nodemon | 3.1.9 | Backend hot-reloading |
| **Env Management** | dotenv | 16.4.7 | `.env` file loading |
| **CORS** | cors | 2.8.5 | Cross-origin request handling |
| **Persistence** | `localStorage` | — | XP, badges, streaks, daily habits |

---

## 4. Project Structure

```
VH/                              ← Monorepo root
├── .gitignore                    ← Ignores node_modules, dist, .env, IDE files
├── README.md                     ← User-facing project documentation
├── implementation_plan.md        ← Product vision & novelty doc
├── retireright_report.html       ← Printable PDF report (Ctrl+P → Save as PDF)
├── start.bat                     ← One-click startup script (Windows)
│
├── frontend/                     ← Vite SPA
│   ├── package.json              ← chart.js, vite dependencies
│   ├── vite.config.js            ← Dev server config, /api proxy
│   ├── index.html                ← 431-line SPA shell (10 sections)
│   ├── public/                   ← Static assets (currently empty)
│   └── src/
│       ├── app.js                ← 918-line main logic file (16 modules)
│       └── styles.css            ← ~44KB premium dark-mode design system
│
└── backend/                      ← Express API
    ├── package.json              ← express, cors, dotenv, nodemon
    ├── .env / .env.example       ← PORT=3000, NODE_ENV=development
    ├── server.js                 ← Express app setup (35 lines)
    ├── routes/
    │   └── api.js                ← 3 endpoints: health, calculate, tips
    ├── controllers/              ← Scaffolded (empty, .gitkeep)
    ├── middleware/                ← Scaffolded (empty, .gitkeep)
    └── models/                   ← Scaffolded (empty, .gitkeep)
```

---

## 5. Frontend Implementation

### 5.1 HTML — Page Shell & Sections

The `index.html` (431 lines) is a single-page application divided into **10 semantic sections**:

| # | Section ID | Name | Description |
|---|-----------|------|-------------|
| 0 | `particles-bg` | Particle Background | Decorative animated background layer |
| 1 | `navbar` | Navbar | Logo, 6 nav links, live XP counter |
| 2 | `hero` | Hero | Headline, 3 animated stat counters, CTA buttons, mini growth chart |
| 3 | `nudge-banner` | Nudge Banner | Rotating loss-framed behavioural nudge with dismiss button |
| 4 | `calculator` | Retirement Calculator | 4 slider inputs + 4 result cards + compound chart |
| 5 | `future-self` | Future Self Visualizer | Smart Saver vs. Impulse Spender avatar comparison |
| 6 | `lifestyle` | Lifestyle Simulator | Corpus → relatable lifestyle items (8 cards) |
| 7 | `invest` | Portfolio Allocator | 4 asset sliders + donut chart + risk meter |
| 8 | `habits` | Daily Habits & Gamification | XP bar, level, streak, 5 habit checkboxes, 8 badge slots |
| 9 | `education` | Education Hub | 10 tip cards in a carousel with auto-advance |
| 10 | `action` | 3-Step Action Plan | 3 actionable steps with XP rewards |

**SEO implementation:**
- Descriptive `<title>` tag
- `<meta name="description">` with keyword-rich content
- Semantic `<section>`, `<header>`, `<footer>`, `<nav>` elements
- ARIA labels on interactive elements (`role="navigation"`, `aria-label`, `aria-live="polite"`)
- Single `<h1>` with proper heading hierarchy

### 5.2 CSS — Design System

The `styles.css` (~44KB) implements a premium dark-mode design system:

**Core Design Tokens (CSS Custom Properties):**
- Color palette: Purple primary (`#7c3aed`), Cyan accent (`#06b6d4`), Amber (`#f59e0b`), Green (`#10b981`), Red error
- Gradients: `--gradient-main`, `--gradient-green`, `--gradient-warm`, `--gradient-danger`
- Typography: Outfit (headings, 300-900 weight), Inter (body, 300-600 weight)
- Glass effect: `backdrop-filter: blur()` with rgba overlays

**Visual Effects:**
- Glassmorphism on all `.glass-card` elements
- Smooth scroll reveal animations (`@keyframes revealUp`)
- Neon flash utility classes: `neon-flash`, `neon-flash-cyan`, `neon-flash-green`, `neon-flash-amber`, `neon-flash-purple`
- Navbar scroll effect (transparent → solid on scroll)
- Gradient text effect on headings
- Custom-styled range sliders with dynamic fill color
- Risk meter with colour-coded fill
- Responsive breakpoints for mobile/tablet

### 5.3 JavaScript — Core Modules

The `app.js` file (918 lines) is organized as **16 numbered modules**, all within a single ES Module file:

---

#### Module 0: Utility Functions

| Function | Purpose |
|----------|---------|
| `fmt(n)` | Formats numbers to ₹ with Cr/L/K suffixes (Indian notation) |
| `fmtRaw(n)` | Raw ₹ formatting with locale separators |
| `showToast(msg, duration)` | Displays toast notification for XP/badge events |

---

#### Module 1: Scroll Reveal

Uses `IntersectionObserver` to add `.visible` class when elements enter viewport (threshold: 0.1, rootMargin: -40px).

**Observed elements:** `.section-inner > *`, `.glass-card`, `.action-step`

---

#### Module 2: Navbar Scroll Effect

Adds `.scrolled` class to navbar when `window.scrollY > 60`, toggling transparent ↔ solid background. Uses passive event listener for performance.

---

#### Module 3: Hero Mini Chart

Renders a small Chart.js line chart in the hero section:
- **Calculation:** ₹1,000/month SIP at 12% annual return for 30 years
- **Visualization:** Gradient fill area chart (purple → transparent)
- **Result displayed:** "= ₹3.5 Crore"

---

#### Module 4: Animated Counters

Animates hero stat numbers from 0 to target using `requestAnimationFrame`:
- ₹1 Crore potential corpus
- 37 years of growth
- 12% average return

Uses cubic easing: `1 - Math.pow(1 - progress, 3)` for smooth deceleration.

---

#### Module 5: Retirement Calculator Engine

**Core formula:** Future Value of Annuity (SIP)

```
FV = PMT × [((1 + r)^n - 1) / r] × (1 + r)
```

Where:
- `PMT` = monthly savings
- `r` = annual return / 100 / 12 (monthly rate)
- `n` = years × 12 (total months)

**Inputs (4 interactive sliders):**

| Input | Range | Default | Step |
|-------|-------|---------|------|
| Current Age | 18–40 | 22 | 1 |
| Retirement Age | 40–65 | 55 | 1 |
| Monthly Savings | ₹500–₹50,000 | ₹5,000 | ₹500 |
| Annual Return | 5%–20% | 12% | 0.5% |

**Outputs (4 result cards + chart):**
1. 🏆 Retirement Corpus — total accumulated wealth
2. 💸 Total Invested — principal (monthly × months)
3. 📈 Pure Interest Earned — corpus minus invested
4. ⏳ Cost of Waiting 5 Years — corpus now vs. corpus with 5 years less

**Side effects:** Updates Future Self corpus display, Lifestyle Simulator, draws compound chart, awards 30 XP.

---

#### Module 6: Compound Interest Chart

Chart.js line chart comparing two scenarios:
- **Start Now** — solid purple area chart
- **Wait 5 Years** — dashed cyan line (first 5 years = 0, then starts)

Styled with glassmorphism tooltip, dark grid, `fmt()` Y-axis labels.

---

#### Module 7: Lifestyle Simulator

Converts the calculated corpus into **8 relatable lifestyle units**:

| Emoji | Item | Cost Basis | Unit |
|-------|------|-----------|------|
| ☕ | Chai/Coffee per day | ₹50/day | years of daily chai |
| ✈️ | International trips | ₹1,50,000 | vacations |
| 🏠 | Monthly rent | ₹25,000/month | years rent-free |
| 🍕 | Dinner dates | ₹1,500 | dinner dates |
| 📱 | iPhones | ₹90,000 | flagship iPhones |
| 🚗 | Maruti cars | ₹9,00,000 | brand-new cars |
| 🎓 | College degrees | ₹5,00,000 | full degrees |
| 🏋️ | Gym memberships | ₹12,000/year | years of gym |

Default corpus on load: ₹1,00,00,000 (₹1 Cr).

---

#### Module 8: Investment Allocation Donut

**4 asset class sliders:**

| Asset | Color | Default | Max |
|-------|-------|---------|-----|
| Equity/Stocks | `#7c3aed` (purple) | 60% | 100% |
| Debt/Bonds | `#06b6d4` (cyan) | 25% | 100% |
| Crypto | `#f59e0b` (amber) | 10% | 30% |
| Cash/Emergency | `#10b981` (green) | 5% | 30% |

**Risk Meter formula:**
```
riskScore = min((equity × 0.7 + crypto × 1.5) / 100, 1)
```

| Risk Score | Label | Color |
|-----------|-------|-------|
| < 0.3 | Conservative | Green |
| 0.3–0.6 | Moderate | Amber |
| 0.6–0.8 | Aggressive | Amber/Warm |
| ≥ 0.8 | Very High Risk 🚨 | Red |

Total allocation validation: shows green (= 100%), amber (< 100%), red (> 100%).

---

#### Module 9: Gamification Engine

**XP & Levelling System:**

| Level | Name | XP Threshold |
|-------|------|-------------|
| 1 | Savings Seedling | 0 |
| 2 | Budget Ninja | 100 |
| 3 | SIP Starter | 250 |
| 4 | Compound Chaser | 500 |
| 5 | Wealth Builder | 900 |
| 6 | FIRE Seeker | 1,500 |
| 7 | RetireRight Legend | 2,500 |

**8 Unlockable Badges:**

| Emoji | Badge | Requirement | Type |
|-------|-------|------------|------|
| 🏁 | First Step | Earn 10 XP | `xp` |
| 🔥 | On Fire | 3-day streak | `streak` |
| 🧮 | Math Whiz | Use calculator | `calc` |
| 💎 | Diamond Hands | Earn 500 XP | `xp` |
| 🌙 | FIRE Mode | Earn 1000 XP | `xp` |
| 🏆 | Legend | Reach Level 5 | `level` |
| ✅ | Habit Hero | Complete all habits | `habits` |
| 🚀 | To the Moon | Earn 2500 XP | `xp` |

**State persistence:** `localStorage` key `rr_state` stores:
```json
{
  "xp": 0,
  "level": 0,
  "streak": 0,
  "lastDate": null,
  "habitsCompleted": 0,
  "calcUsed": 0,
  "badgesUnlocked": []
}
```

---

#### Module 10: Daily Habits

**5 micro-habits with XP rewards:**

| Emoji | Habit | XP |
|-------|-------|-----|
| 💸 | Track all expenses | +20 |
| 📉 | Skip one impulse buy | +25 |
| 🧠 | Read a finance tip | +15 |
| 📊 | Check your SIP | +30 |
| 🎯 | Set a savings goal | +20 |

**Mechanics:**
- Habits reset daily (tracked by `rr_habit_date` in localStorage)
- Once checked, a habit is locked for the day (no un-checking)
- Completing all 5 triggers a celebratory toast
- Keyboard accessible (Enter/Space to toggle)

---

#### Module 11: Education Tips Carousel

**10 financial literacy tips** with auto-advance every 8 seconds:

1. Compound Interest
2. Time Value of Money
3. SIP Strategy
4. Index Funds
5. FIRE Movement
6. Emergency Fund
7. Step-Up SIP
8. Tax Efficiency
9. Lifestyle Inflation
10. Diversification

Each tip has: icon, category tag, title, body text, and actionable takeaway. Navigation via arrow buttons, dot indicators, or keyboard (←/→ arrows).

---

#### Module 12: Behavioural Nudges

**10 rotating loss-framed nudge messages** displayed in a persistent banner:
- Auto-rotates every 15 seconds with fade transition
- Dismissible (clicking ✕ shows the next nudge)
- Uses `aria-live="polite"` for screen reader accessibility

Example nudges:
- *"Skipping one ₹200 delivery order = ₹2.4 Lakh in 20 years."*
- *"Your daily coffee habit (₹100/day) = ₹1.2 Crore if invested over 30 years"*

---

#### Module 13: Future Self Interactions

Two CTA buttons:
- **"I'm choosing Smart Saver"** → Awards 50 XP, highlights saver card, scrolls to calculator
- **"I need help starting"** → Shows encouragement toast, scrolls to calculator

---

#### Module 14: Action Plan Buttons

Three action steps with inline `onclick` handlers that award XP:
1. Open a Mutual Fund Account → +50 XP
2. Automate Your SIP → +75 XP
3. Increase SIP by 10% Yearly → +100 XP

---

#### Module 15: Boot Sequence

`DOMContentLoaded` handler initializes all modules in order:

```
initReveal() → initHeroMiniChart() → initHeroCounters() → initCalculator()
→ initAllocation() → initHabits() → initTips() → initNudges()
→ initFutureSelf() → checkStreak() → updateXPUI() → checkBadges()
→ updateLifestyle(10,000,000) → runCalculation() + trackCalcUsage()
→ initNeonFlashes()
```

---

#### Module 16: Neon Flash Wiring

Post-boot utility that patches existing handlers to add visual neon feedback:

| Trigger | Flash Effect | Class |
|---------|-------------|-------|
| Any `.btn-primary` click | Purple burst | `neon-flash` |
| Calculator submit | Staggered card flashes (cyan/green/amber) | `neon-flash-*` |
| XP earning | Amber flash on nav XP + XP pill + gamification header | `neon-flash-amber` |
| Habit toggle | Green flash on habit card | `neon-flash-green` |
| Tip navigation arrows | Cyan flash | `neon-flash-cyan` |
| Future Self path choice | Green (saver) / Purple (spender) flash | varies |

Uses **monkey-patching** of `window.earnXP` and `window.toggleHabit` to inject flash effects.

---

## 6. Backend Implementation

### Server Setup (`server.js` — 35 lines)

```
Express app
├── Middleware
│   ├── cors()                    ← Allow all origins
│   ├── express.json()            ← Parse JSON bodies
│   └── express.urlencoded()      ← Parse URL-encoded bodies
│
├── Routes
│   └── /api → apiRouter (routes/api.js)
│
├── 404 Handler                   ← JSON { error: 'Not Found' }
└── Error Handler                 ← JSON { error: 'Internal Server Error' }
```

Uses ES Module syntax (`"type": "module"` in package.json).

### API Endpoints (`routes/api.js` — 55 lines)

| Method | Path | Description | Input |
|--------|------|-------------|-------|
| `GET` | `/api/health` | Health check | — |
| `POST` | `/api/calculate` | Server-side corpus calculation | `{ currentAge, retireAge, monthlySaving, annualReturn }` |
| `GET` | `/api/tips` | Returns 3 placeholder tips | — |

The `/api/calculate` endpoint mirrors the frontend `calcFV()` function and returns:
```json
{
  "corpus": 35291730.12,
  "invested": 1980000,
  "growth": 33311730.12,
  "waitCost": 18452100.45,
  "years": 33
}
```

### Scaffolded Directories

| Directory | Status | Purpose |
|-----------|--------|---------|
| `controllers/` | Empty (`.gitkeep`) | Future controller logic (MVC pattern) |
| `middleware/` | Empty (`.gitkeep`) | Future auth, validation, rate limiting |
| `models/` | Empty (`.gitkeep`) | Future database models (MongoDB/Prisma) |

---

## 7. Data Flow & State Management

### Client-Side Data Flow

```
User adjusts slider
    │
    ├── Input event → Update slider display value
    │               → Update slider gradient fill
    │
    └── Click "Calculate"
            │
            ├── calcFV() → Compute corpus, invested, growth, waitCost
            │
            ├── animateResultVal() → Smooth counter animation for 4 result cards
            │
            ├── drawCompoundChart() → Destroy + recreate compound Chart.js instance
            │
            ├── updateLifestyle() → Regenerate 8 lifestyle cards
            │
            ├── Update Future Self corpus label
            │
            └── earnXP(30) → Update XP state → Check badges → Save to localStorage
```

### Persistence Model

All state is stored in the browser's `localStorage`:

| Key | Type | Content |
|-----|------|---------|
| `rr_state` | JSON | XP, level, streak, lastDate, habitsCompleted, calcUsed, badgesUnlocked |
| `rr_habits` | JSON Array | Indices of today's completed habits |
| `rr_habit_date` | String | Today's date string (for reset detection) |

**Streak Logic:**
- If `lastDate === today` → no change
- If `lastDate === yesterday` → streak + 1
- If `lastDate === null` (first visit) → streak = 1
- Otherwise → streak resets to 1

---

## 8. Gamification Engine Deep-Dive

### XP Sources

| Action | XP Earned |
|--------|----------|
| Run calculator | +30 |
| Choose "Smart Saver" path | +50 |
| Complete daily habit (varies) | +15 to +30 |
| Open Mutual Fund Account | +50 |
| Automate SIP | +75 |
| Step-up SIP | +100 |

### Progression Curve

| XP | Level | Name | Cumulative Actions Needed (approx.) |
|----|-------|------|-------------------------------------|
| 0 | 1 | Savings Seedling | — |
| 100 | 2 | Budget Ninja | ~3 calculator uses + 1 habit |
| 250 | 3 | SIP Starter | ~5 days of habits |
| 500 | 4 | Compound Chaser | ~2 weeks of engagement |
| 900 | 5 | Wealth Builder | ~1 month |
| 1500 | 6 | FIRE Seeker | ~2 months |
| 2500 | 7 | RetireRight Legend | ~3-4 months (or action plan completion) |

### Badge System

Badges are checked on **every XP-earning event**. Once unlocked, they persist permanently. The `checkBadges()` function iterates all 8 badges and checks type-specific thresholds against current state.

---

## 9. Behavioural Psychology Integration

The application intentionally leverages several proven behavioural science principles:

| Principle | Implementation | Research Basis |
|-----------|---------------|----------------|
| **Loss Aversion** | "Cost of Waiting 5 Years" as primary metric + loss-framed nudges | Kahneman & Tversky (1979) |
| **Future Self Continuity** | Side-by-side avatar comparison (Smart Saver vs. Impulse Spender) | Hershfield et al. (Stanford, 2011) |
| **Temporal Discounting** | Lifestyle Simulator translates abstract corpus into tangible items | Behavioural economics |
| **Identity-Based Motivation** | RPG levels create financial identity ("I'm a FIRE Seeker") | Clear (2018), Atomic Habits |
| **Streak Mechanics** | "Don't break the chain" daily habit tracker | Duolingo-style engagement loops |
| **Social Proof** | Nudge messages reference peer behaviour ("India's top 1% started before 25") | Cialdini (1984) |
| **Anchoring** | Default values (₹5,000/month, 12% return) set aspirational anchors | Tversky & Kahneman (1974) |
| **Endowed Progress** | XP bar starts partially filled after first calculation | Nunes & Dreze (2006) |

---

## 10. DevOps & Tooling

### Unified Startup (`start.bat`)

The `start.bat` (118 lines) implements a 6-step boot sequence:

```
[1/6] Check Node.js installation
[2/6] Check npm installation
[3/6] Install frontend dependencies (if missing)
[4/6] Install backend dependencies (if missing)
[5/6] Start Backend (Express) on port 3000 (new terminal window)
[6/6] Start Frontend (Vite) on port 5173 (new terminal window)
```

**Features:**
- Auto-skips `npm install` if `node_modules/` exists
- Copies `.env.example` → `.env` if missing
- Launches backend and frontend in **separate terminal windows** (color-coded)
- 3-second delay between backend and frontend start

### Development Scripts

| Package | Script | Command |
|---------|--------|---------|
| Frontend | `dev` | `vite` (HMR dev server) |
| Frontend | `build` | `vite build` (production bundle to `dist/`) |
| Frontend | `preview` | `vite preview` (preview production build) |
| Backend | `dev` | `nodemon server.js` (auto-restart on changes) |
| Backend | `start` | `node server.js` (production) |

### Git Configuration

`.gitignore` properly excludes:
- `node_modules/` (both frontend and backend)
- `frontend/dist/` (build output)
- `backend/.env` (secrets)
- OS files (`.DS_Store`, `Thumbs.db`)
- IDE configs (`.vscode/`, `.idea/`)
- Log files (`*.log`)

---

## 11. Security & Privacy Considerations

| Aspect | Current Status | Notes |
|--------|---------------|-------|
| Authentication | ❌ None | No login required (hackathon design) |
| Data storage | Client-only (`localStorage`) | No PII sent to server |
| CORS | Open (`cors()` with no restrictions) | Acceptable for dev, needs restriction for prod |
| Input validation | ✅ Backend validates required fields | Returns 400 on missing params |
| HTTPS | ❌ Not configured | Vite dev server is HTTP only |
| Rate limiting | ❌ Not implemented | Middleware directory scaffolded for future use |
| XSS | ⚠️ Template literals inject content into DOM | Low risk (no user-generated content) |

---

## 12. Limitations & Technical Debt

| Item | Description | Severity |
|------|-------------|----------|
| **Single JS file** | All 918 lines in one `app.js`; should be split into modules | Medium |
| **No unit tests** | Zero test coverage | High |
| **No error boundaries** | Chart.js failures could break the page | Medium |
| **Inline `onclick`** | Action plan buttons use inline handlers | Low |
| **Monkey-patching** | Module 16 patches `earnXP` and `toggleHabit` via `window` | Medium |
| **Charts not responsive** | Some charts use fixed `width/height` attributes | Low |
| **No data export** | Users can't export their progress or calculations | Low |
| **Backend underutilized** | 2 of 3 endpoints are placeholders; frontend does all math | Low |
| **No service worker** | No offline support or PWA capability | Medium |
| **localStorage limits** | ~5MB cap; no migration strategy if schema changes | Low |

---

## 13. Future Roadmap

### Phase 1: Immediate Improvements (v1.2)
- [ ] Split `app.js` into separate ES module files per feature
- [ ] Add unit tests for `calcFV()` and gamification logic
- [ ] Move calculation logic to backend exclusively (single source of truth)
- [ ] Add responsive breakpoints for mobile-first experience

### Phase 2: Full-Stack Features (v2.0)
- [ ] Firebase/Supabase authentication (social login)
- [ ] MongoDB/PostgreSQL for persistent user profiles
- [ ] Group Circles: Create/join friend circles with shared goals
- [ ] Social leaderboards (ranked by consistency, not wealth)
- [ ] Push notifications for streak reminders

### Phase 3: Advanced Features (v3.0)
- [ ] UPI/Bank API integration for real spending data
- [ ] AI-driven personalized learning paths
- [ ] Face-aging "Future Self" video generation
- [ ] Broker API integration (Zerodha/Groww) for automated SIP
- [ ] React Native mobile app
- [ ] Multi-currency support

---

> **RetireRight** — *Because your future self is counting on you today.* 🚀
