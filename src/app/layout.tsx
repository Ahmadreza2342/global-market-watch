import type { Metadata } from "next";
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
  title: "دیده‌بان بازار جهانی | Global Market Watch",
  description: "تحلیل روزانه اخبار و شاخص‌های اقتصادی-سیاسی جهان برای طلا (XAU/USD)",
  keywords: ["gold", "XAU/USD", "market analysis", "fed", "dollar index", "treasury yield", "طلا", "تحلیل بازار"],
  authors: [{ name: "Global Market Watch" }],
  openGraph: {
    title: "Global Market Watch",
    description: "Daily analysis of world news and economic indicators affecting gold",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AppProvider>
          {children}
        </AppProvider>
        <Toaster />
        <Sonner position="top-center" richColors />
      </body>
    </html>
  );
}
