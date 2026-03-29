# 🚀 RetireRight — Solving Retirement Blindness Among Gen Z

### 🏆 Vashisht Hackathon 3.O — FinTech Track Submission

**📱 Android App (APK):** [Download RetireRight v1.0](https://github.com/ViperFreakZ/RetireRight/releases/tag/retireright-v1.0)  
**🎥 Demo Video:** [Watch on Google Drive](https://drive.google.com/file/d/1So_V4qP8sVe_Zt1obPJAb8kKCmN2i1S1/view?usp=sharing)  
**🌐 Live Web App:** [https://1f684691fe2fc5.lhr.life](https://1f684691fe2fc5.lhr.life)

> *Your future self is watching you. Start now.*

---

## 📌 Problem Statement

**Domain:** FinTech · Gen Z · Behavioural Finance

Students and young professionals (18–28) consistently delay or ignore retirement planning due to:

- **Temporal discounting** — retirement feels too distant to act on
- **Low financial literacy** — jargon like SIP, ELSS, NPS creates mental blocks
- **Lifestyle inflation** — disposable income goes to experiences before savings
- **No relatable tools** — existing calculators are designed for 45-year-olds, not Gen Z

> Waiting just **5 years** to start investing can reduce your retirement corpus by **up to 40%.**

---

## 💡 Solution Overview

**RetireRight** is a gamified, behaviour-driven retirement planning web app that makes saving feel immediately rewarding — not a distant sacrifice.

It bridges the gap between *knowing* you should save and *actually doing it* — using psychology, gamification, and visual storytelling.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧮 **Retirement Calculator** | Slider-driven compound interest engine. Shows corpus, total invested, interest earned, and cost of delay in real time |
| 📈 **Start Now vs. Wait Chart** | Visual Chart.js area chart comparing "Start Today" vs. "Wait 5 Years" — makes the cost of delay undeniable |
| 🪞 **Future Self Visualizer** | Two side-by-side avatars — *Smart Saver* vs. *Impulse Spender* — showing your lifestyle at retirement age |
| ☕ **Lifestyle Simulator** | Translates your corpus into relatable units: international trips, iPhones, years of rent, dinner dates |
| 📊 **Portfolio Allocator** | Interactive sliders for Equity / Bonds / Crypto / Cash → live donut chart + risk meter |
| 🎮 **Gamification Engine** | XP points, 7 levels (Savings Seedling → RetireRight Legend), 8 unlockable badges, daily streak counter |
| ✅ **Daily Habit Tracker** | 5 financial micro-habits. Check in daily for XP. Streak resets if you miss a day |
| 💡 **Behavioural Nudge Engine** | Rotating loss-framed nudges (e.g. *"Skipping one ₹200 delivery = ₹2.4 Lakh in 20 years"*) |
| 📚 **Education Hub** | 10 interactive tip cards covering SIP, FIRE, index funds, tax efficiency, diversification, and more |
| 🎯 **3-Step Action Plan** | Actionable next steps: open a fund account, automate SIP, step up 10% yearly — each earns XP |

---

## 🧠 Novelties & Innovation

### 1. 🪞 Future Self Avatar (Emotional Visualization)
Shows *you* at retirement age in two scenarios. Research (Hershfield et al., Stanford) shows future self avatars increase savings contribution by ~30%. Bridges the psychological gap between now and retirement.

### 2. ☕ Lifestyle-Denominated Wealth Translation
Your ₹3.5 Crore corpus = *"2,000 international trips OR 11 years rent-free."* Expresses wealth in Gen Z's language — not abstract numbers.

### 3. 💡 Real-Time Behavioural Nudges (Loss Framing)
Loss-framed nudges are 2× more effective than gain-framing (Kahneman). Rotating messages reframe micro-spending as long-term loss — passively nudging behaviour throughout the session.

### 4. 🎮 Gamified Financial Identity System
XP and levels build a *financial identity* ("I'm a FIRE Seeker") — not just tool usage. Identity-based motivation is the most durable driver of long-term behaviour change.

### 5. ⏳ "Cost of Delay" as Primary Metric
Most tools show what you'll *gain*. RetireRight foregrounds what you *lose by waiting* — a dedicated dynamic metric leveraging loss aversion.

### 6. ✅ Daily Micro-Habit Tracker + Streak
Applies Duolingo's "don't break the chain" mechanic to financial habits. Converts abstract long-term goals into daily 2-minute check-ins.

---

## 🗂️ Project Structure

```
e/
├── index.html              # Full single-page app shell
├── styles.css              # Premium dark-mode design system (glassmorphism, animations)
├── app.js                  # Core logic: calculator, charts, gamification, habits, tips
├── retireright_report.html # Printable PDF report (open in browser → Ctrl+P → Save as PDF)
└── README.md               # This file
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (semantic) |
| Styling | Vanilla CSS (custom properties, glassmorphism, animations) |
| Logic | Vanilla JavaScript (ES6+, modules pattern) |
| Charts | [Chart.js 4.4](https://www.chartjs.org/) |
| Fonts | Google Fonts — Outfit + Inter |
| Persistence | `localStorage` (XP, badges, streaks, habits) |
| No build step | Opens directly in any modern browser |

---

## 🚀 How to Run

1. Open the `e/` folder
2. Double-click **`index.html`**
3. That's it — no server, no install, no login required

---

## 📄 Report / PDF

Open **`retireright_report.html`** in your browser, then press `Ctrl + P` → **Save as PDF**.

Covers: Problem statement · Solution overview · Novelties · Competitive landscape · Implementation plan · Roadmap · Risk analysis

---

## 📅 Roadmap

| Phase | Timeline | Milestone |
|---|---|---|
| 1 | Weeks 1–2 | MVP: Calculator + Design System ✅ |
| 2 | Weeks 3–4 | Gamification + Daily Habits ✅ |
| 3 | Weeks 5–6 | Future Self + Lifestyle Simulator ✅ |
| 4 | Weeks 7–10 | React migration + Firebase auth + push notifications |
| 5 | Weeks 11–16 | Broker API integration (Zerodha/Groww) + social leaderboards |

---

## ⚠️ Disclaimer

RetireRight is built for **educational and hackathon purposes only.**
It does not constitute financial advice. Consult a SEBI-registered investment advisor for personalised guidance.

---

*Empowering Gen Z to retire early, live fully. 🌏*
