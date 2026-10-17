import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.globalmarketwatch.app",
  appName: "Global Market Watch",
  webDir: "out", // We'll use Next.js static export
  server: {
    // Use the deployed Vercel URL as the backend for native app
    url: "https://global-market-watch-ahmadreza13798886-1259.vercel.app",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#0a0a0a",
  },
  ios: {
    backgroundColor: "#0a0a0a",
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0a0a0a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
    },
    PushNotifications: {
      visibility: "public",
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config",
      iconColor: "#f59e0b",
      sound: "beep.wav",
    },
  },
};

export default config;
