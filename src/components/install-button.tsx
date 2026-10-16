"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Download, X, Smartphone, Apple, Chrome, Share, Plus } from "lucide-react";
import { useApp } from "@/components/app-provider";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "gmw_pwa_dismissed";

export function InstallButton() {
  const { t, lang } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    // Detect if app is already installed
    const checkInstalled = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS-specific
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
    };
    checkInstalled();

    // Dismissed before?
    const dismissed = localStorage.getItem(STORAGE_KEY) === "1";

    // Capture beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      if (dismissed) return;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // No native prompt — show manual guide
      setShowGuide(true);
    }
  };

  if (isInstalled) return null;

  // Detect platform for custom icon
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  const PlatformIcon = isIOS ? Apple : isAndroid ? Smartphone : Chrome;

  return (
    <>
      <Button
        size="sm"
        variant="default"
        onClick={handleInstallClick}
        className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white text-xs gap-1"
      >
        <Download className="h-3.5 w-3.5" />
        {lang === "fa" ? "نصب اپ" : "Install App"}
      </Button>

      {/* Desktop dialog */}
      <Dialog open={showGuide && !isSheetOpen} onOpenChange={(o) => {
        setShowGuide(o);
        if (!o) setIsSheetOpen(true);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlatformIcon className="h-5 w-5 text-amber-500" />
              {lang === "fa" ? "نصب اپ در گوشی" : "Install on Phone"}
            </DialogTitle>
            <DialogDescription>
              {lang === "fa"
                ? "برای نصب اپ دیده‌بان بازار جهانی در گوشی خود، مراحل زیر را دنبال کنید:"
                : "To install Global Market Watch on your phone, follow these steps:"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {isIOS ? (
              <IOSSteps lang={lang} />
            ) : isAndroid ? (
              <AndroidSteps lang={lang} />
            ) : (
              <DesktopSteps lang={lang} />
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, "1");
                setShowGuide(false);
              }}
            >
              {lang === "fa" ? "دیگر نشان نده" : "Don't show again"}
            </Button>
            <Button size="sm" onClick={() => setShowGuide(false)}>
              {lang === "fa" ? "متوجه شدم" : "Got it"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile bottom sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <PlatformIcon className="h-5 w-5 text-amber-500" />
              {lang === "fa" ? "نصب اپ در گوشی" : "Install on Phone"}
            </SheetTitle>
            <SheetDescription>
              {lang === "fa"
                ? "برای دسترسی سریع و آفلاین، اپ رو در گوشی نصب کنید"
                : "Get quick access and offline use by installing the app"}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {isIOS ? (
              <IOSSteps lang={lang} />
            ) : isAndroid ? (
              <AndroidSteps lang={lang} />
            ) : (
              <AndroidSteps lang={lang} />
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4"
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, "1");
                setIsSheetOpen(false);
              }}
            >
              {lang === "fa" ? "دیگر نشان نده" : "Don't show again"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function IOSSteps({ lang }: { lang: "fa" | "en" }) {
  return (
    <div className="space-y-3">
      <Step number={1} lang={lang}>
        {lang === "fa"
          ? "در گوشی خود با Safari به آدرس اپ بروید"
          : "Open the app URL in Safari on your iPhone/iPad"}
      </Step>
      <Step number={2} lang={lang}>
        {lang === "fa" ? (
          <>
            روی دکمه <strong>Share</strong> (آیکون مربع با فلش رو به بالا) در پایین صفحه بزنید
          </>
        ) : (
          <>
            Tap the <strong>Share</strong> button (square with up arrow) at the bottom
          </>
        )}
        <Share className="inline-block h-3.5 w-3.5 mx-1" />
      </Step>
      <Step number={3} lang={lang}>
        {lang === "fa"
          ? "از منوی باز شده، گزینه «Add to Home Screen» را انتخاب کنید"
          : 'From the menu, select "Add to Home Screen"'}
        <Plus className="inline-block h-3.5 w-3.5 mx-1" />
      </Step>
      <Step number={4} lang={lang}>
        {lang === "fa"
          ? "روی Add بزنید — آیکون اپ در صفحه اصلی گوشی ظاهر می‌شود"
          : "Tap Add — the app icon will appear on your home screen"}
      </Step>
      <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-2 text-[11px] text-amber-600 dark:text-amber-400">
        {lang === "fa"
          ? "💡 نکته: فقط در Safari می‌توانید اپ را Add to Home Screen کنید."
          : "💡 Tip: Add to Home Screen only works in Safari on iOS."}
      </div>
    </div>
  );
}

function AndroidSteps({ lang }: { lang: "fa" | "en" }) {
  return (
    <div className="space-y-3">
      <Step number={1} lang={lang}>
        {lang === "fa"
          ? "در گوشی خود با Chrome به آدرس اپ بروید"
          : "Open the app URL in Chrome on your Android phone"}
      </Step>
      <Step number={2} lang={lang}>
        {lang === "fa"
          ? "روی منوی سه‌نقطه (⋮) در گوشه بالا-راست بزنید"
          : "Tap the three-dot menu (⋮) in the top-right corner"}
      </Step>
      <Step number={3} lang={lang}>
        {lang === "fa"
          ? "گزینه «Add to Home screen» یا «Install app» را انتخاب کنید"
          : 'Select "Add to Home screen" or "Install app"'}
      </Step>
      <Step number={4} lang={lang}>
        {lang === "fa"
          ? "روی Add یا Install بزنید — اپ در صفحه اصلی و drawer اپ‌ها ظاهر می‌شود"
          : "Tap Add or Install — the app appears on your home screen and app drawer"}
      </Step>
      <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-2 text-[11px] text-amber-600 dark:text-amber-400">
        {lang === "fa"
          ? "💡 نکته: در برخی گوشی‌ها، یک بنر «Install app» به‌صورت خودکار در بالای صفحه ظاهر می‌شود."
          : "💡 Tip: On some phones, an 'Install app' banner appears automatically at the top."}
      </div>
    </div>
  );
}

function DesktopSteps({ lang }: { lang: "fa" | "en" }) {
  return (
    <div className="space-y-3">
      <Step number={1} lang={lang}>
        {lang === "fa"
          ? "در نوار آدرس مرورگر، آیکون نصب (⊕ یا ⬇) را ببینید"
          : "Look for the install icon (⊕ or ⬇) in the browser address bar"}
      </Step>
      <Step number={2} lang={lang}>
        {lang === "fa"
          ? "روی آیکون بزنید و Install را انتخاب کنید"
          : "Click it and select Install"}
      </Step>
      <Step number={3} lang={lang}>
        {lang === "fa"
          ? "اپ در یک پنجره جداگانه بدون نوار آدرس باز می‌شود"
          : "The app opens in a standalone window without browser chrome"}
      </Step>
      <div className="rounded-md bg-sky-500/10 border border-sky-500/30 p-2 text-[11px] text-sky-600 dark:text-sky-400">
        {lang === "fa"
          ? "📱 برای نصب در گوشی، صفحه را در گوشی باز کنید و راهنمای iOS/Android را دنبال کنید."
          : "📱 To install on your phone, open the URL on your phone and follow iOS/Android steps."}
      </div>
    </div>
  );
}

function Step({
  number,
  children,
  lang,
}: {
  number: number;
  children: React.ReactNode;
  lang: "fa" | "en";
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-white text-xs font-bold">
        {lang === "fa" ? ["۱", "۲", "۳", "۴"][number - 1] : number}
      </div>
      <div className="text-sm leading-relaxed pt-0.5">{children}</div>
    </div>
  );
}
