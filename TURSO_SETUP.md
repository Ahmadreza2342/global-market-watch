# 🗄️ راهنمای راه‌اندازی Turso (دیتابیس ابری رایگان)

این راهنما بهت یاد می‌ده چطور یه دیتابیس Turso بسازی و به «دیدبان طلا» (Gold Sentinel) وصل کنی.

---

## 📋 چرا Turso؟

- ✅ **رایگان** — ۹ GB ذخیره‌سازی، ۱ میلیارد read در ماه
- ✅ **پایدار** — داده‌ها بین cold startها از بین نمی‌رن
- ✅ **سریع** — در چندین منطقه‌ی جهانی distributed شده
- ✅ **SQLite-compatible** — کد شما بدون تغییر کار می‌کنه
- ✅ **API-based** — با HTTP قابل دسترسی (نیازی به connection pooling نیست)

با Turso:
- 📨 تلگرام مشترکین شما پایدار می‌شن (cron job واقعاً می‌فرسته)
- 📊 تاریخچه‌ی سیگنال‌ها پایدار می‌شه (backtest کار می‌کنه)
- 💾 cache قیمت‌ها پایدار می‌شه (دیگه «—» کم می‌بینی)

---

## 🚀 مراحل راه‌اندازی (۵ دقیقه)

### قدم ۱: ثبت‌نام در Turso

۱. به https://turso.tech برو
۲. روی **Sign Up** یا **Start Free** بزن
۳. با **GitHub** ثبت‌نام کن (ساده‌ترین راه، بدون رمز عبور)
۴. به داشبورد Turso بری خودکار

> 💡 Turso رایگان هست، نیازی به کارت بانکی نیست.

### قدم ۲: ساخت دیتابیس

۱. در داشبورد Turso، روی **+ New Database** یا **Create Database** بزن
۲. این مقادیر رو وارد کن:
   - **Name**: `gold-sentinel` (یا هر اسمی دوست داری)
   - **Region**: نزدیک‌ترین منطقه به خودت
     - ایران: `Frankfurt (fra1)` یا `Amsterdam (ams1)` بهترین گزینه‌ها
     - اگه از VPN استفاده می‌کنی، منطقه‌ی سرور VPN رو انتخاب کن
   - **Plan**: Free (پیش‌فرض)
۳. **Create** بزن

### قدم ۳: گرفتن Connection URL

۱. روی دیتابیس `gold-sentinel` که ساختی بزن
۲. به تب **Settings** برو (یا روی **Get connection strings** بزن)
۳. بخش **LibSQL URL** رو پیدا کن
۴. کپی کن آدرس رو — شبیه اینه:
   ```
   libsql://gold-sentinel-<your-username>.turso.io
   ```
   این رو در یه جا ذخیره کن (Notepad)

### قدم ۴: ساخت Auth Token

۱. در همون صفحه، به تب **Access Tokens** برو
   (یا از منوی بالا: **Access Tokens**)
۲. روی **Create Token** بزن
۳. این مقادیر رو وارد کن:
   - **Name**: `vercel-prod` (یا هر اسمی)
   - **Database access**: دیتابیس `gold-sentinel` رو انتخاب کن
   - **Expiry**: می‌تونی `Never` یا `1 year` بذاری
۴. **Create** بزن
۵. **Token رو کپی کن** ⚠️ فقط یه بار نشون داده می‌شه!
   - شبیه اینه: `eyJhbGciOi...` (خیلی طولانی)
   - در جای امن ذخیره کن

### قدم ۵: تنظیم در Vercel

حالا باید این URL + Token رو در Vercel تنظیم کنی:

۱. به https://vercel.com/dashboard برو
۲. روی پروژه‌ی **global-market-watch** بزن
۳. تب **Settings** (بالای صفحه)
۴. از منوی سمت چپ: **Environment Variables**
۵. **DATABASE_URL** رو پیدا کن (موجود هست)
۶. سه‌نقطه‌اش (⋮) بزن → **Edit**
۷. در فیلد **Value**، این فرمت رو وارد کن:

   ```
   libsql://gold-sentinel-<your-username>.turso.io?authToken=eyJhbGciOi...
   ```

   ⚠️ **مهم**: باید `?authToken=` به آخر URL اضافه بشه!

   مثال کامل:
   ```
   libsql://gold-sentinel-ahmadreza.turso.io?authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
   ```

۸. هر سه Environment رو تیک بزن: Production, Preview, Development
۹. **Save** بزن

### قدم ۶: Redeploy

۱. به تب **Deployments** برگرد
۲. کنار آخرین deployment، سه‌نقطه (⋮) بزن
۳. **Redeploy** بزن
۴. **Redeploy** بزن ⏳ (۲-۳ دقیقه)

### قدم ۷: بهم بگو! 🚀

وقتی deploy تموم شد، بهم بگو تا:
- `prisma/schema.prisma` رو به `libsql` adapter تغییر بدم
- پکیج `@prisma/adapter-libsql` رو نصب کنم
- کد رو بزن که درست با Turso کار کنه
- تست کنم که همه‌چیز درسته

---

## ✅ خلاصه‌ی چیزی که نیاز داری بهم بدی:

وقتی ثبت‌نام و دیتابیس رو ساختی، فقط **۲ تا چیز** ازت نیاز دارم:

۱. **LibSQL URL** (مثل: `libsql://gold-sentinel-ahmadreza.turso.io`)
۲. **Auth Token** (مثل: `eyJhbGciOi...`)

می‌تونی این ۲ تا رو بهم بدم یا خودت در Vercel Environment Variables تنظیم کنی.

---

## 🆘 مشکلات متداول

### ❌ "Invalid connection string"
**راه‌حل:** مطمئن شو که `?authToken=` به آخر URL اضافه شده باشه.

### ❌ "Authentication failed"
**راه‌حل:** Token رو دوباره از Turso کپی کن (Spaces مهم هستن).

### ❌ "Database not found"
**راه‌حل:** اسم دیتابیس رو در Turso dashboard چک کن.

### ❌ بعد از deploy، ارور "table not found"
**راه‌حل:** بهم بگو تا `db:push` رو اجرا کنم که schema رو بسازه.

---

## 📞 اگر گیر کردی

اگه در هر مرحله گیر کردی، بهم بگو دقیقاً کجا. می‌تونم کمکت کنم:
- اگه تو ثبت‌نام مشکل داری
- اگه URL یا Token رو نمی‌تونی پیدا کنی
- اگه Vercel env var رو نمی‌تونی set کنی

موفق باشی! 🚀
