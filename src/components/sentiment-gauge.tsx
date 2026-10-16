"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useApp } from "@/components/app-provider";
import { Gauge } from "lucide-react";

interface SentimentGaugeProps {
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  volatility?: "low" | "medium" | "high";
}

export function SentimentGauge({ sentiment, confidence, volatility = "medium" }: SentimentGaugeProps) {
  const { t } = useApp();

  // Map sentiment + confidence to a 0-100 scale where 0 = max bearish, 50 = neutral, 100 = max bullish
  let score: number;
  if (sentiment === "bullish") score = 50 + (confidence / 2);
  else if (sentiment === "bearish") score = 50 - (confidence / 2);
  else score = 50;

  score = Math.max(5, Math.min(95, score));

  // SVG arc
  const angle = (score / 100) * 180 - 90; // -90..90 degrees
  const radius = 80;
  const cx = 100;
  const cy = 100;
  const needleX = cx + radius * Math.cos((angle * Math.PI) / 180);
  const needleY = cy + radius * Math.sin((angle * Math.PI) / 180);

  const label =
    sentiment === "bullish" ? t.gauge.bullish
    : sentiment === "bearish" ? t.gauge.bearish
    : t.gauge.neutral;
  const tone =
    sentiment === "bullish" ? "text-emerald-500"
    : sentiment === "bearish" ? "text-rose-500"
    : "text-muted-foreground";

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">{t.dashboard.sentiment}</CardTitle>
            <CardDescription className="text-xs">{t.dashboard.marketMoversDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-full max-w-[280px] aspect-[2/1]">
            <svg viewBox="0 0 200 110" className="w-full h-full">
              <defs>
                <linearGradient id="sentimentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#a3a3a3" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                stroke="url(#sentimentGrad)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <line
                x1={cx}
                y1={cy}
                x2={needleX}
                y2={needleY}
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={tone}
              />
              <circle cx={cx} cy={cy} r="4" fill="currentColor" className={tone} />
            </svg>
          </div>
          <div className="text-center mt-2">
            <p className={`text-2xl font-bold ${tone}`}>{label}</p>
            <p className="text-xs text-muted-foreground">
              {t.signals.confidence}: {confidence}%
              {" • "}
              {t.dashboard.volatility}: {volatility === "high" ? t.dashboard.high : volatility === "medium" ? t.dashboard.medium : t.dashboard.low}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
