"use client";

import { useApp } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, ArrowRight, Activity, Globe, LineChart, Target } from "lucide-react";

interface HeroProps {
  onStart: () => void;
}

export function Hero({ onStart }: HeroProps) {
  const { t, lang } = useApp();
  const Arrow = lang === "fa" ? ArrowLeft : ArrowRight;

  const features = [
    { icon: Globe, title: lang === "fa" ? "اخبار روزانه" : "Daily News", desc: lang === "fa" ? "تحلیل هوش مصنوعی از اخبار فدرال، جنگ، بحران و سیاست" : "AI-powered analysis of Fed, war, crisis & political news" },
    { icon: Activity, title: lang === "fa" ? "شاخص‌های کلیدی" : "Key Indicators", desc: lang === "fa" ? "نرخ بهره، شاخص دلار، تورم، بازده اوراق ۱۰ساله" : "Fed rate, DXY, inflation, 10Y yield" },
    { icon: Target, title: lang === "fa" ? "نقاط ورود/خروج" : "Entry/Exit Points", desc: lang === "fa" ? "سیگنال‌های هوشمند برای XAU/USD با حد سود/ضرر" : "Smart signals for XAU/USD with TP/SL" },
    { icon: LineChart, title: lang === "fa" ? "تقویم اقتصادی" : "Economic Calendar", desc: lang === "fa" ? "رویدادهای هفته آینده آمریکا" : "Upcoming US events this week" },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs mb-4">
            <Sparkles className="h-3 w-3" />
            {t.brand}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight bg-gradient-to-r from-amber-600 via-rose-500 to-amber-600 bg-clip-text text-transparent">
            {t.hero.title}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button onClick={onStart} size="lg" className="w-full sm:w-auto">
              {t.hero.cta}
              <Arrow className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <div key={i} className="rounded-xl border border-border bg-card/50 backdrop-blur p-4 hover:border-amber-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 text-white mb-3">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
