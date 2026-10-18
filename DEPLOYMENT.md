# راهنمای کامل Deployment | Complete Deployment Guide

این راهنما برای deploy کردن اپ «دیدبان طلا» روی Vercel (رایگان) است.

## 🚀 روش ۱: دکمه یک‌کلیک (ساده‌ترین)

۱. روی این دکمه بزن:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git?s=https%3A%2F%2Fgithub.com%2FAhmadreza2342%2Fglobal-market-watch)

۲. با حساب GitHub خودت وارد شو.

۳. اگر خواستی ریپو رو fork کنی، بزن (optional).

۴. در صفحه‌ی Configure Project:
   - Framework Preset: Next.js (خودکار تشخیص داده می‌شه)
   - Root Directory: `./` (default)
   - Build Command: `bun run db:generate && next build` (از vercel.json خونده می‌شه)
   - Install Command: `bun install --frozen-lockfile` (از vercel.json خونده می‌شه)

۵. به پایین صفحه اسکرول کن → بخش **Environment Variables**

۶. این متغیر رو اضافه کن:
   - **Key**: `DATABASE_URL`
   - **Value**: `file:/tmp/custom.db`
   - همه‌ی Environment ها رو تیک بزن (Production, Preview, Development)

۷. **Deploy** بزن ⏳ (۲-۵ دقیقه طول می‌کشه)

۸. URL اپ deployed شده رو می‌گیری، مثل:
   `https://global-market-watch-xxxxx.vercel.app`

---

## 🛠 روش ۲: Vercel CLI (برای کاربران پیشرفته)

اگر Vercel CLI رو نصب داری:

```bash
# نصب Vercel CLI (اگه نداری)
npm install -g vercel

# Clone ریپو
git clone https://github.com/Ahmadreza2342/global-market-watch.git
cd global-market-watch

# نصب dependencies
bun install

# Login
vercel login

# Deploy به production
vercel --prod

# هنگام prompt اولین بار:
# - Set up and deploy? Y
# - Which scope? (account خودت رو انتخاب کن)
# - Link to existing project? N
# - Project name? global-market-watch
# - Directory? ./
# - Override settings? N
```

---

## 📱 نصب در گوشی (بعد از Deploy)

وقتی URL اپ deployed شده رو داری، برای نصب در گوشی:

### اندروید (Chrome)
1. URL رو در Chrome باز کن
2. منوی سه‌نقطه (⋮) بالا-راست → **Add to Home screen**
3. **Add** بزن

### آیفون (Safari)
1. URL رو در **Safari** باز کن (نه Chrome)
2. دکمه **Share** (مربع با فلش) پایین → **Add to Home Screen**
3. **Add** بزن

---

## 🔧 تنظیم تلگرام (بعد از Deploy)

وقتی اپ deployed شد:

1. در تلگرام با **@BotFather** صحبت کن و `/newbot` بزن
2. نام ربات رو انتخاب کن و **Bot Token** رو کپی کن
3. با **@userinfobot** چت کن و **Chat ID** خودت رو بگیر
4. ربات خودت رو باز کن و `/start` بزن (تا بتونه بهت پیام بفرسته)
5. در اپ deployed شده:
   - بخش «تلگرام» (کنار هشدارهای زنده) رو باز کن
   - Bot Token و Chat ID رو وارد کن
   - **Save Settings** بزن
   - سوییچ تلگرام رو روشن کن
   - **Test Send** بزن تا یه پیام تست در تلگرامت بیاد

بعد از این، هر سیگنال قوی (قدرت ≥ 75) به‌صورت خودکار به تلگرامت ارسال می‌شه.

---

## ⚠️ نکته درباره SQLite در Vercel

Vercel یه پلتفرم Serverless هست و فایل‌ها در `/tmp` موقت هستن. این یعنی:

- **دیتابیس SQLite در `/tmp/custom.db` در هر cold start از نو ساخته می‌شه**
- تاریخچه‌ی هشدارها و cache ممکنه بین درخواست‌ها پاک بشه
- اما **سایر قابلیت‌ها کار می‌کنن**: تحلیل اخبار، شاخص‌ها، سیگنال‌ها، تلگرام

برای production واقعی با data persistence:

### گزینه A: Turso (رایگان، SQLite-compatible)
1. به https://turso.tech برو و ثبت‌نام کن
2. یه database بساز: `turso db create market-watch`
3. URL دیتابیس رو بگیر: `turso db show market-watch --url`
4. Token بساز: `turso auth token`
5. در Vercel، env var `DATABASE_URL` رو با Turso URL جایگزین کن
6. در `prisma/schema.prisma` datasource provider رو از `sqlite` به `libsql` تغییر بده
7. `bun run db:push` رو اجرا کن

### گزینه B: Vercel Postgres (رایگان)
1. در Vercel dashboard → Storage → **Create Database** → Postgres
2. به پروژه‌ی خودت متصلش کن
3. env var `DATABASE_URL` به‌صورت خودکار set می‌شه
4. در `prisma/schema.prisma` datasource provider رو از `sqlite` به `postgresql` تغییر بده
5. `bun run db:push` رو اجرا کن

---

## ❓ مشکلات متداول

### Q: Build fail می‌شه — Error: `prisma generate` not found
**A:** مطمئن شو که `postinstall` script در `package.json` هست (ما اضافه‌اش کردیم).

### Q: API ها 500 error می‌دن
**A:** احتمالاً `DATABASE_URL` ست نشده. به Settings → Environment Variables برو و اضافه کن.

### Q: داده‌های cache نمونن
**A:** این طبیعیه در Vercel با SQLite. برای persistence، به Turso/Postgres منتقل شو (راهنمای بالا).

### Q: تلگرام کار نمی‌کنه
**A:** مطمئن شو که ربات رو `/start` زدی. اگه نه، ربات رو باز کن و `/start` بزن.

---

## 📞 پشتیبانی

اگر مشکلی داشتی:
1. به https://github.com/Ahmadreza2342/global-market-watch/issues برو
2. Issue جدید باز کن و مشکل رو توضیح بده
