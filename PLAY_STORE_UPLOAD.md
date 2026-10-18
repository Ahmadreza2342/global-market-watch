# 📱 راهنمای کامل آپلود در Google Play Store

این راهنما قدم‌به‌قدم برات توضیح می‌ده چطور اپ «دیده‌بان بازار جهانی» رو در Google Play Store منتشر کنی.

---

## 📋 پیش‌نیازها

### ۱. حساب Google Play Developer ($25)
1. به https://play.google.com/console/signup برو
2. با حساب Google وارد شو
3. **۲۵ دلار** با کارت بانکی بین‌المللی پرداخت کن (یک‌بار برای همیشه)
4. اطلاعات حساب رو پر کن (نام، آدرس، شماره تماس)
5. احراز هویت رو تکمیل کن (ممکنه ۲-۳ روز طول بکشه)

### ۲. فایل‌های آماده‌شده (همه در این ریپو هستن ✅)
- 📄 `/public/privacy.html` — صفحه Privacy Policy
- 📄 `/public/about.html` — صفحه About
- 🔐 `/public/.well-known/assetlinks.json` — احراز هویت دامنه
- 🖼 `/public/store/feature-graphic.png` — گرافیک ویژه ۱۰۲۴×۵۰۰
- 🎨 `/public/store/play-icon.png` — آیکون ۵۱۲×۵۱۲
- 📱 `/public/store/screenshot-*.png` — ۳ اسکرین‌شات

---

## 🚀 مرحله ۱: ساخت فایل AAB با PWABuilder

### ۱.۱. آدرس اپ deployed شده
```
https://global-market-watch-ahmadreza13798886-1259.vercel.app
```

### ۱.۲. ساخت AAB
1. به https://www.pwabuilder.com برو
2. در باکس URL، آدرس بالا رو وارد کن
3. روی **Start** بزن
4. صبر کن تا آنالیز اپ تموم بشه (۲-۳ دقیقه)
5. روی **Package For Stores** بزن
6. در منوی باز شده:
   - **Android** رو انتخاب کن
   - **Generate** بزن
7. یه فایل ZIP دانلود می‌شه (شامل AAB، APK، keystore، assetlinks.json)

### ۱.۳. محتویات ZIP
وقتی فایل ZIP رو باز می‌کنی، این فایل‌ها رو می‌بینی:
```
├── app-release-signed.aab       ← برای Play Store ✅
├── app-release-signed.apk       ← برای تست مستقیم در گوشی
├── assetlinks.json              ← کپی کن در public/.well-known/ (ما گذاشتیم)
├── keystore.properties          ← رمز keystore رو نگه‌دار
└── release.keystore              ← کلید امضا (گم نکن!)
```

⚠️ **هشدار:** فایل `release.keystore` رو در جای امن نگه‌دار. اگه گم بشه، نمی‌تونی اپ رو آپدیت کنی!

---

## 🌐 مرحله ۲: احراز هویت دامنه

### ۲.۱. آپدیت assetlinks.json
1. فایل ZIP از PWABuilder رو باز کن
2. فایل `assetlinks.json` رو باز کن
3. SHA256 fingerprint که PWABuilder داده رو کپی کن
4. در ریپو GitHub، `public/.well-known/assetlinks.json` رو آپدیت کن با SHA256 واقعی
5. Push کن تا Vercel آپدیت بشه

### ۲.۲. تست احراز هویت
1. به این URL برو:
   ```
   https://global-market-watch-ahmadreza13798886-1259.vercel.app/.well-known/assetlinks.json
   ```
2. باید JSON معتبر ببینی (نه ارور 404)

### ۲.۳. تست با ابزار Google
1. به https://developers.google.com/digital-asset-links/tools/generator برو
2. URL رو وارد کن
3. باید "✅ No errors found" رو ببینی

---

## 📋 مرحله ۳: ساخت اپ در Play Console

### ۳.۱. ساخت اپ
1. به https://play.google.com/console برو
2. **All apps** → **Create app**
3. فرم رو پر کن:

| فیلد | مقدار |
|------|-------|
| **App name** | `Global Market Watch` |
| **Default language** | `Persian (fa)` (یا `English` اگه می‌خوای) |
| **App type** | `App` (نه Game) |
| **Pricing** | `Free` |

4. **Create app** بزن

### ۳.۲. تنظیمات اولیه
پس از ساخت اپ، در منوی سمت چپ:

#### Dashboard
- پر کردن Content rating questionnaire (آزمون دسته‌بندی محتوا)
- Set up target audience (مخاطب هدف)

#### Setup → App integrity
- **App signing key** — Google Play App Signing رو فعال کن (توصیه‌شده)
- وقتی فعال بشه، یه فایل AAB آپلود کنی و Google امضا رو انجام می‌ده

#### Setup → Data safety
- فرم Data Safety رو پر کن (راهنما در ادامه)

#### Grow → Store listing
- اطلاعات نمایش اپ در Play Store (راهنما در ادامه)

---

## 🎨 مرحله ۴: پر کردن Store Listing

به **Grow → Store presence → Store listing** برو:

### اطلاعات اصلی

| فیلد | مقدار |
|------|-------|
| **App name** | `Global Market Watch — دیده‌بان بازار جهانی` |
| **Short description** | `تحلیل روزانه‌ی طلا و نفت با هوش مصنوعی — اخبار، شاخص‌ها، سیگنال` |
| **Full description** | (متن زیر رو کپی کن) |

### Full Description (کپی کن)

```
دیده‌بان بازار جهانی — پلتفرم تحلیل روزانه‌ی بازار با هوش مصنوعی

این اپ به شما کمک می‌کند تا با تحلیل هوش مصنوعی، اخبار روزانه و شاخص‌های اقتصادی، تصمیمات بهتری در بازار طلا (XAU/USD) و نفت (WTI/USD) بگیرید.

ویژگی‌ها:
📊 شاخص‌های اقتصادی زنده
- قیمت لحظه‌ای طلا از COMEX
- شاخص دلار (DXY) از NYB
- بازده اوراق قرضه ۱۰ ساله آمریکا
- قیمت نفت خام WTI
- نرخ بهره فدرال، تورم CPI

📰 اخبار روزانه واقعی
- اخبار از Investing.com، Reuters، Bloomberg، CNBC
- دسته‌بندی: فدرال، جنگ، اقتصاد، بحران، سیاسی
- تحلیل تأثیر هر خبر بر طلا (مثبت/منفی/خنثی)

🤖 دستیار AI «آروم»
- با هوش مصنوعی چت کن
- سوال بپرس: «الان طلا رو بخرم؟»
- پاسخ با داده‌ی زنده بازار
- شخصیت: استراتژیست محتاط طلا با ۲۰ سال تجربه

⚡ سیگنال چندتایم‌فریم
- ۱۵ دقیقه و ۱ ساعته برای طلا و نفت
- نقاط ورود، حد سود، حد ضرر
- تحلیل تکنیکال: RSI، MACD، EMA، Bollinger
- ترکیب: تحلیل تکنیکال + اخبار + رفتار تریدرها

🏆 ۱۰ تریدر برتر MQL5
- تریدرهای واقعی با حساب واقعی و ۱+ سال سابقه
- تحلیل رفتار: استراتژی، سطح ریسک، ساعات فعال
- منبع ترکیب سیگنال‌ها

✈️ ارسال خودکار به تلگرام
- سرور هر ساعت اخبار رو تحلیل می‌کنه
- اگه سیگنال قوی (قدرت ≥ ۷۵) پیدا بشه، به تلگرامت می‌فرسته
- حتی وقتی آفلاین هستی!

📈 عملکرد سیگنال‌ها
- نرخ برد (Win Rate)
- نمودار رشد سرمایه (Equity Curve)
- لیست سیگنال‌های اخیر با نتیجه (سود/ضرر/باز)

📱 قابل نصب در گوشی
- PWA — مثل اپ بومی
- کار آفلاین با Service Worker
- نوتیفیکیشن مرورگر
- حالت تاریک/روشن
- دوزبانه (فارسی RTL / انگلیسی LTR)

منابع داده:
- Yahoo Finance برای قیمت‌های زنده
- Investing.com RSS برای اخبار
- Google Gemini AI برای تحلیل
- Telegram Bot API برای نوتیفیکیشن

⚠️ هشدار: این اپ صرفاً برای آموزش و آگاه‌سازی است و پیشنهاد سرمایه‌گذاری نیست. بازارهای مالی پرمخاطره هستند. تصمیم‌گیری مالی بر عهده شماست.

ساخته‌شده با Next.js 16، TypeScript، و هوش مصنوعی Z.ai.
```

### App category

| فیلد | مقدار |
|------|-------|
| **App category** | `Finance` |
| **Tags** (up to 5) | `Finance`, `Investing`, `Trading`, `Stock Market`, `News` |

### Graphic assets

| فیلد | فایل | پوشه |
|------|------|------|
| **App icon** | `play-icon.png` (512×512) | `/public/store/` |
| **Feature graphic** | `feature-graphic.png` (1024×500) | `/public/store/` |
| **Phone screenshots** (2-8) | `screenshot-*.png` | `/public/store/` |

### کارهایی که نباید فراموش کنی
- ❌ **Privacy Policy URL**: `https://global-market-watch-ahmadreza13798886-1259.vercel.app/privacy.html`
- ❌ permettre پیدا کردن: https://global-market-watch-ahmadreza13798886-1259.vercel.app/.well-known/assetlinks.json

---

## 🔒 مرحله ۵: فرم Data Safety

به **App content → Data safety** برو و این پاسخ‌ها رو بده:

### ۱. آیا اپ داده‌ای جمع‌آوری می‌کنه؟
**No, we don't collect any data** ✅

### ۲. (اگر yes) جزئیات
اگر Google بازم پرسید:

#### Personal info
- ❌ None

#### Financial info
- ✅ Purchase history (اگه در آینده پرداخت اضافه کردی)
- در حال حاضر: None

#### App activity
- ❌ None (history saved locally, not on server)

#### App info or performance
- ❌ None

#### Device or other IDs
- ❌ None

### Privacy Policy URL
```
https://global-market-watch-ahmadreza13798886-1259.vercel.app/privacy.html
```

---

## 🎯 مرحله ۶: Content Rating

به **App content → Content rating** برو:

### Questionnaire Answers:
1. **Does your app contain violence?** — No
2. **Does your app contain sexual content?** — No
3. **Does your app contain profanity or crude humor?** — No
4. **Does your app contain controlled substances?** — No
5. **Does your app contain gambling?** — No
6. **Does your app allow user-generated content?** — No
7. **Does your app contain scary content?** — No
8. **Does your app contain hate speech?** — No
9. **Does your app contain defamation?** — No
10. **Does your app contain tobacco/alcohol?** — No
11. **Does your app contain ads for these?** — No

نتیجه: **Rated E (Everyone)** یا **PEGI 3**

---

## 👥 مرحله ۷: Target Audience

به **App content → Target audience** برو:

1. **Target audience**: `13 and older` (یا `18 and older` برای امنیت بیشتر)
2. **Could children under 13 be interested?** — `Yes, but app isn't targeted to them`
3. **Does app appeal to children?** — `No`

---

## 🚀 مرحله ۸: آپلود AAB

### ۸.۱. آپلود در Production track
1. به **Production** در منوی سمت چپ برو
2. روی **Create release** بزن
3. در بخش App Bundle:
   - فایل `app-release-signed.aab` رو آپلود کن
4. Release name: `1.0.0`
5. Release notes:
   ```
   Version 1.0.0 — Initial release
   
   Features:
   - Live gold, oil, DXY prices
   - Daily news from Investing.com
   - AI chat assistant (Aurum)
   - Multi-timeframe trading signals
   - Top 10 MQL5 traders
   - Telegram auto-send
   - Signal performance tracking
   - PWA (offline support)
   - Bilingual (Persian/English)
   ```

6. **Save** بزن
7. **Review release** بزن
8. **Start rollout to Production** بزن

### ۸.۲. تست اول (Internal Testing)
**پیشنهاد:** قبل از Production، Internal Testing بساز:
1. به **Testing → Internal testing** برو
2. Create release
3. AAB رو آپلود کن
4. لیست ایمیل تسترها رو اضافه کن (۲ کاربر اول رایگان هستن)
5. Release رو publish کن
6. لینک دعوت رو دریافت کن و تست کن

---

## ⏳ مرحله ۹: انتظار برای Review

- ⏱ معمولا ۱-۳ روز طول می‌کشه
- ممکنه تا ۷ روز هم بکشه
- اپل status رو در Dashboard می‌بینی

اگه رد شد (Reject):
- دلیل رو در Dashboard می‌بینی
- اصلاح کن و دوباره submit کن

اگه تایید شد:
- 🎉 اپ در Play Store publish می‌شه
- URL: `https://play.google.com/store/apps/details?id=com.globalmarketwatch.app`

---

## 🔄 بعد از انتشار

### آپدیت‌های بعدی:
1. کد رو در GitHub عوض کن
2. Vercel خودکار deploy می‌کنه
3. AAB جدید رو از PWABuilder بگیر
4. در Play Console → Production → Create new release
5. AAB جدید رو آپلود کن

### پاسخ به نظرات کاربران:
- در Play Console → User feedback → Reviews
- به نظرات پاسخ بده
- برای رفع مشکلات، نسخه جدید Release کن

### آمار نصب:
- Play Console → Statistics
- تعداد نصب، uninstall، crash reports

---

## 🆘 مشکلات متداول

### ❌ "Your app uses permissions that aren't required"
**راه‌حل:** مطمئن شو که AndroidManifest.xml فقط این permission‌ها رو داره:
- INTERNET (لازم)
- ACCESS_NETWORK_STATE (لازم)
- POST_NOTIFICATIONS (لازم برای push)

### ❌ "Privacy policy URL not accessible"
**راه‌حل:** 
- چک کن URL در مرورگر باز می‌شه
- باید HTTPS باشه (Vercel هست)
- باید HTML کامل برگردونه (نه 404)

### ❌ "Asset links file not found"
**راه‌حل:**
- چک کن https://global-market-watch-ahmadreza13798886-1259.vercel.app/.well-known/assetlinks.json در دسترسه
- SHA256 fingerprint رو از PWABuilder بگیر و در فایل آپدیت کن

### ❌ "App Bundle not signed"
**راه‌حل:** 
- مطمئن شو فایل `app-release-signed.aab` از PWABuilder استفاده می‌کنی
- نه فایل debug

### ❌ "WebView error"
**راه‌حل:**
- مطمئن شو URL Vercel به‌درستی در capacitor.config.ts (اگه از روش ۱ استفاده می‌کنی) تنظیم شده
- یا در تنظیمات PWABuilder هنگام build URL رو درست وارد کن

---

## ✅ Checklist نهایی

قبل از submit:
- [ ] حساب Google Play Developer فعال ($25 پرداخت شده)
- [ ] AAB از PWABuilder ساخته شده
- [ ] SHA256 fingerprint در assetlinks.json آپدیت شده
- [ ] Privacy Policy URL در دسترسه (https://.../privacy.html)
- [ ] Store Listing پر شده (آیکون، screenshots، description)
- [ ] Content Rating questionnaire تکمیل شده
- [ ] Target Audience تنظیم شده
- [ ] Data Safety form پر شده
- [ ] AAB آپلود شده
- [ ] Release notes نوشته شده

---

## 📞 پشتیبانی

اگه در هر مرحله گیر کردی:
1. GitHub Issues: https://github.com/Ahmadreza2342/global-market-watch/issues
2. Play Console Help: https://support.google.com/googleplay/android-developer
3. PWABuilder docs: https://docs.pwabuilder.com

موفق باشی! 🚀
