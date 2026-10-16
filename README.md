# دیده‌بان بازار جهانی | Global Market Watch

> پلتفرم تحلیل روزانه اخبار و شاخص‌های اقتصادی-سیاسی جهان با تمرکز بر طلا (XAU/USD) و نفت (WTI/USD)

A bilingual (Persian/English) web application for daily analysis of world news, economic indicators, multi-timeframe trading signals, and live alerts with Telegram delivery.

## 🚀 نصب آنلاین (یک کلیک) | One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git?s=https%3A%2F%2Fgithub.com%2FAhmadreza2342%2Fglobal-market-watch)

روی دکمه بالا بزن → با حساب GitHub وارد شو → **Deploy** بزن. تمام!

**تنظیمات لازم هنگام Deploy:**
در بخش **Environment Variables** (در همون صفحه‌ی Import) این متغیر رو اضافه کن:

| Key | Value | Environments |
|-----|-------|--------------|
| `DATABASE_URL` | `file:/tmp/custom.db` | Production, Preview, Development |

⚠️ **اگر پیدا نکردی مهم نیست** — بذار Default بمونه، بعداً از Settings اضافه کن.

## 📱 نصب در گوشی | Install on Phone

این اپ به‌صورت **PWA** (Progressive Web App) ساخته شده و می‌تونی اون رو در گوشی خودت نصب کنی مثل یک اپ بومی.

### روش ۱: دانلود فایل تک‌فایلی (آفلاین) | Method 1: Single-file Offline

اگه می‌خوای بدون سرور ازش استفاده کنی، می‌تونی فایل `standalone.html` رو از این ریپو دانلود کنی:

1. فایل `public/standalone.html` رو از [این لینک](./public/standalone.html) دانلود کن
2. فایل رو در گوشی خودت باز کن (با مرورگر Chrome یا Safari)
3. مراحل Add to Home Screen رو دنبال کن

> ⚠️ **نکته**: نسخه standalone از داده‌های نمونه‌شده استفاده می‌کنه و به‌صورت آفلاین کار می‌کنه. برای دریافت سیگنال‌های زنده، باید از نسخه کامل deployed شده استفاده کنی.

### روش ۲: نسخه کامل Deploy شده | Method 2: Full Deployed Version

برای استفاده از همه قابلیت‌ها (سیگنال‌های زنده، تلگرام، نوتیفیکیشن)، اپ رو deploy کن:

1. Fork یا clone این ریپو
2. به [Vercel](https://vercel.com) یا [Netlify](https://netlify.com) برو (هر دو رایگان هستن)
3. ریپو رو connect کن و deploy کن
4. URL اپ deployed شده رو در گوشی باز کن
5. مراحل Add to Home Screen رو دنبال کن

### نصب در گوشی | Install on Phone

#### 📱 اندروید (Chrome)
1. آدرس اپ رو در Chrome باز کن
2. روی منوی سه‌نقطه (⋮) بالا-راست بزن
3. **Add to Home screen** یا **Install app** رو انتخاب کن
4. روی **Add** یا **Install** بزن
5. آیکون اپ در صفحه اصلی گوشی ظاهر می‌شه

#### 🍎 آیفون/آیپد (Safari)
1. آدرس اپ رو در **Safari** باز کن (نه Chrome)
2. روی دکمه **Share** (مربع با فلش رو به بالا) در پایین بزن
3. **Add to Home Screen** رو انتخاب کن
4. روی **Add** بزن
5. آیکون اپ در صفحه اصلی ظاهر می‌شه

> 💡 **نکته آیفون**: فقط در Safari می‌تونی اپ رو Add to Home Screen کنی.

## ✨ Features

### 📊 Market Intelligence
- **Daily AI Brief** — AI-generated macro strategist brief with sentiment (bullish/bearish/neutral), volatility, and risk levels
- **7 Economic Indicators** — Fed funds rate, DXY, CPI inflation, 10Y Treasury yield, gold price, central bank activity, US economic stats
- **Daily News** — 5 categories (Fed, war, economy, crisis, politics) with AI-classified impact on gold
- **US Economic Calendar** — Upcoming high-impact events

### 🎯 Multi-Timeframe Signals (MetaTrader 5-style)
- **Symbols:** XAU/USD (gold), WTI/USD (crude oil)
- **Timeframes:** 15-minute and 1-hour
- **Composite Signal Strength (0-100):**
  - 50% Technical (RSI, MACD, EMA cross, Bollinger Bands, Trend)
  - 25% News bias (LLM-extracted from live web search)
  - 25% Top trader behavior (aggregated from top 10 MQL5 traders)
- **Entry/Take-Profit/Stop-Loss levels** calculated via ATR

### 🏆 Top 10 MQL5 Traders
- Identifies top 10 MetaTrader 5 signal providers
- Filter: 1+ year track record with real (non-demo) accounts
- Per-trader analysis: gain, monthly, drawdown, win rate, strategy type (scalper/day/swing/trend), risk level, active hours, average hold time, instruments, behavioral insight

### 🔔 Live Alert System
When a strong signal (strength ≥ 75) is detected, the app simultaneously:
1. Fires a browser notification (Notification API)
2. Plays a 2-tone beep (880Hz + 1320Hz via Web Audio API)
3. Shows an in-app toast
4. **Sends the full signal to your Telegram chat** (auto-send)

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York)
- **Database:** Prisma ORM + SQLite
- **AI:** z-ai-web-dev-sdk (web search + chat completions for analysis)
- **Charts:** Recharts
- **Auth:** Session-cookie based (sha256 password hashing)
- **Real-time:** Polling every 45 seconds for new strong signals

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── daily-brief/        # AI-generated daily macro brief
│   │   ├── indicators/         # 7 economic indicators
│   │   ├── signals/            # Daily trading signals
│   │   ├── multi-tf-signals/   # 15m + 1h signals for XAU/USD & WTI/USD
│   │   ├── calendar/           # US economic calendar
│   │   ├── traders/            # Top 10 MQL5 traders
│   │   ├── signal-history/     # Triggered alert history (DB)
│   │   ├── alerts-test/        # Test alert endpoint
│   │   ├── telegram/           # Telegram bot proxy + test
│   │   └── auth/               # login, register, logout, me
│   ├── layout.tsx
│   ├── page.tsx                 # Main dashboard
│   └── globals.css
├── components/
│   ├── header.tsx
│   ├── hero.tsx
│   ├── footer.tsx
│   ├── daily-brief-card.tsx
│   ├── sentiment-gauge.tsx
│   ├── indicators-panel.tsx
│   ├── news-panel.tsx
│   ├── signals-panel.tsx
│   ├── calendar-panel.tsx
│   ├── mini-chart-card.tsx
│   ├── traders-panel.tsx
│   ├── multi-tf-panel.tsx
│   ├── live-alerts-widget.tsx
│   ├── telegram-settings-panel.tsx
│   ├── alerts-container.tsx
│   └── auth-dialog.tsx
└── lib/
    ├── i18n.ts                 # Bilingual dictionary (fa/en)
    ├── zai.ts                  # ZAI SDK wrapper (web search + LLM)
    ├── market.ts               # News + indicators + signals + calendar
    ├── mt5.ts                  # Top traders + multi-tf signals
    ├── indicators.ts           # RSI, MACD, EMA, Bollinger, ATR
    ├── telegram.ts             # Telegram bot client
    ├── auth.ts                 # Session-based auth
    ├── cache.ts                # DB-backed daily cache
    └── db.ts                   # Prisma client
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ or Bun
- A Z.ai account for the SDK (or your own LLM/web search provider)

### Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd <project-name>

# Install dependencies
bun install   # or npm install

# Set up environment
cp .env.example .env  # create one with DATABASE_URL="file:./db/custom.db"

# Push database schema
bun run db:push

# Start dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app defaults to Persian (RTL) with dark theme.

### Setting up Telegram (optional but recommended)

1. Open Telegram → search **@BotFather** → send `/newbot`
2. Pick a name → copy the **Bot Token**
3. Search **@userinfobot** → get your **Chat ID**
4. Open your bot and send `/start` (so it can message you)
5. In the app → open the "Live Alerts" section → "Telegram" panel:
   - Paste Bot Token + Chat ID
   - Click "Save Settings"
   - Toggle Telegram on
   - Click "Test Send" to verify

## ⚠️ Important Disclaimers

- **Educational purposes only** — not investment advice
- **MT5 integration**: For real-time MT5 data, deploy on a Windows server with the MetaTrader 5 terminal running and install the `MetaTrader5` Python package. This project uses synthesized price data for demonstration.
- **API rate limits**: Z.ai SDK has rate limits; daily cache (SQLite-backed) ensures graceful degradation.

## 📝 License

MIT — feel free to fork, modify, and use.

## 🤝 Acknowledgments

- Built with [Z.ai](https://chat.z.ai) — AI-powered development
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [lucide-react](https://lucide.dev/)
