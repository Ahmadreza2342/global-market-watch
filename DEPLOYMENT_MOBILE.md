# 📱 راهنمای ساخت APK اندروید | Android APK Build Guide

این راهنما برای ساخت فایل APK اندروید از اپ «دیدبان طلا» است.

## روش ۱: استفاده از Capacitor (توصیه‌شده)

Capacitor یه wrapper هست که اپ وب شما رو به یه اپ بومی اندروید تبدیل می‌کنه.

### پیش‌نیازها

1. **Node.js 18+** و **npm**
2. **Android Studio** (دریافت از https://developer.android.com/studio)
3. **Java JDK 17** (با Android Studio نصب می‌شه)
4. **Capacitor CLI**: `npm install -g @capacitor/cli`

### مراحل build

```bash
# ۱. کلون ریپو
git clone https://github.com/Ahmadreza2342/global-market-watch.git
cd global-market-watch

# ۲. نصب dependencies
npm install

# ۳. نصب Capacitor packages
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/splash-screen @capacitor/push-notifications @capacitor/local-notifications

# ۴. Initialize Android platform
npx cap add android

# ۵. فایل capacitor.config.ts رو بررسی کن (همون که در ریپو هست)

# ۶. Sync web assets (اپ از URL آپلود شده استفاده می‌کنه — نیازی به build نیست)
npx cap sync android

# ۷. باز کردن در Android Studio
npx cap open android

# ۸. در Android Studio:
#    - Build → Build Bundle / APK → Build APK
#    - یا از منوی بالا: Build > Build APK(s)
#    - فایل APK در: android/app/build/outputs/apk/debug/app-debug.apk
```

### نصب در گوشی

```bash
# کپی APK به گوشی
adb install android/app/build/outputs/apk/debug/app-debug.apk

# یا:
# ۱. فایل APK رو به گوشی منتقل کن
# ۲. در گوشی، فایل رو باز کن
# ۳. اگه "Install unknown apps" خواست، اجازه بده
```

### ساخت APK امضا‌شده (Release)

```bash
# تولید keystore (یک بار)
keytool -genkey -v -keystore release.keystore -alias gmw -keyalg RSA -keysize 2048 -validity 10000

# تنظیم در build.gradle (android/app/build.gradle):
# android {
#   signingConfigs {
#     release {
#       storeFile file('release.keystore')
#       storePassword 'your_password'
#       keyAlias 'gmw'
#       keyPassword 'your_password'
#     }
#   }
#   buildTypes {
#     release {
#       signingConfig signingConfigs.release
#     }
#   }
# }

# build release APK
./gradlew assembleRelease
```

APK در: `android/app/build/outputs/apk/release/app-release.apk`

---

## روش ۲: PWABuilder (ساده‌تر، بدون نیاز به Android Studio)

1. اپ deployed شده در https://global-market-watch-ahmadreza13798886-1259.vercel.app رو باز کن
2. به https://www.pwabuilder.com برو
3. URL رو وارد کن
4. روی **Build My PWA** بزن
5. **Android** رو انتخاب کن
6. فایل ZIP دانلود می‌شه — داخلش APK هست
7. APK رو به گوشی منتقل کن و نصب کن

---

## روش ۳: ساخت iOS App (نیاز به Mac)

```bash
# نیازمند Mac با Xcode
npm install @capacitor/ios
npx cap add ios
npx cap sync ios
npx cap open ios

# در Xcode:
# ۱. Apple Developer Account لازم دارید ($99/سال)
# ۲. Build → Run
# ۳. برای توزیع: Archive → Distribute App
```

---

## 🔔 قابلیت‌های native

این اپ از Capacitor plugins زیر استفاده می‌کنه:

### ۱. Splash Screen
- تصویر قرمز/طلایی هنگام باز شدن اپ
- مدت: ۱.۵ ثانیه

### ۲. Push Notifications (FCM)
- برای دریافت نوتیفیکیشن حتی وقتی اپ بسته است
- نیاز به Firebase Cloud Messaging setup

### ۳. Local Notifications
- هشدار صدا دار
- آیکون در نوار اعلان

### ۴. Network
- اپ از Vercel deployment به‌عنوان backend استفاده می‌کنه
- cache offline برای دیتای استاتیک

---

## 🎯 آیکون اپ

آیکون‌های پیش‌فرض در `public/` هستند:
- `icon-192.png` — آیکون ۱۹۲×۱۹۲
- `icon-512.png` — آیکون ۵۱۲×۵۱۲

برای استفاده در Capacitor:
```bash
# نصب asset generator
npm install -g @capacitor/assets

# تولید آیکون‌های اندروید
npx capacitor-assets generate --android
```

این دستور:
- `android/app/src/main/res/mipmap-*/ic_launcher.png` رو تولید می‌کنه
- splash screen رو هم می‌سازه

---

## ⚠️ نکات مهم

### ۱. Backend URL
- اپ از URL: `https://global-market-watch-ahmadreza13798886-1259.vercel.app` استفاده می‌کنه
- اگه URL عوض شد، `capacitor.config.ts` رو هم آپدیت کن

### ۲. HTTPS لازم است
- Android 9+ فقط HTTPS رو قبول می‌کنه
- URL Vercel HTTPS داره ✅

### ۳. Push Notifications
- نیاز به Firebase پروژه داره
- توکن‌های FCM رو در دیتابیس ذخیره کن
- سرور می‌تونه به جای/علاوه بر تلگرام، push notification بفرسته

### ۴. App Bundle (کوچک‌تر)
- به جای APK، می‌تونی App Bundle (.aab) بسازی
- فایل کوچک‌تر (نزدیک به نصف)
- قابل آپلود در Google Play Store

```bash
./gradlew bundleRelease
# خروجی: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 📋 خلاصه Commands

```bash
# نصب کامل
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap sync android

# باز کردن در Android Studio
npx cap open android

# Build APK از خط فرمان
cd android
./gradlew assembleDebug    # APK debug (تست)
./gradlew assembleRelease  # APK release (نصب‌شدنی)

# Sync کد وب جدید
npx cap copy android
npx cap sync android
```

---

## 🚀 به Google Play Store

۱. **ثبت‌نام کنسول توسعه‌دهنده**: $25 یک‌بار (https://play.google.com/console)
۲. **ساخت App Bundle** (AAB)
۳. آپلود در Play Console
۴. **انتشار به Beta testing** اول
۵. سپس انتشار به‌عنوان production

اگه سوالی داشتی، در https://github.com/Ahmadreza2342/global-market-watch/issues بپرس.
