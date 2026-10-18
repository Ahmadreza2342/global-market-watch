import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { AppProvider } from "@/components/app-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "دیدبان طلا | Gold Sentinel",
  description: "تحلیل روزانه‌ی بازار طلا با هوش مصنوعی — اخبار، شاخص‌های اقتصادی، و سیگنال‌های معاملاتی برای طلا (XAU/USD) و نفت (WTI/USD)",
  keywords: ["gold", "XAU/USD", "WTI", "crude oil", "market analysis", "fed", "dollar index", "treasury yield", "طلا", "نفت", "تحلیل بازار", "متاتریدر", "MetaTrader", "دیدبان طلا"],
  authors: [{ name: "Gold Sentinel" }],
  applicationName: "Gold Sentinel",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gold Sentinel",
    startupImage: ["/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: ["/icon.svg"],
  },
  openGraph: {
    title: "Gold Sentinel — دیدبان طلا",
    description: "Daily AI-powered analysis of gold market — news, indicators, and trading signals for XAU/USD and WTI/USD",
    type: "website",
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "Gold Sentinel" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gold Sentinel — دیدبان طلا",
    description: "Daily AI-powered analysis of gold, crude oil, and economic indicators",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="256x256" href="/icon-256.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Gold Sentinel" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AppProvider>
          {children}
        </AppProvider>
        <Toaster />
        <Sonner position="top-center" richColors />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('[PWA] SW registered:', reg.scope))
                    .catch(err => console.warn('[PWA] SW registration failed:', err));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
