"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle, Activity, Gauge } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { localizeNumber } from "@/lib/i18n";
import type { DailyBrief } from "@/lib/market";
import { RefreshButton } from "@/components/refresh-button";

interface DailyBriefCardProps {
  brief: DailyBrief | null;
  loading: boolean;
  cached?: boolean;
  generatedAt?: string;
  onRefresh: () => void;
}

export function DailyBriefCard({ brief, loading, cached, generatedAt, onRefresh }: DailyBriefCardProps) {
  const { t, lang } = useApp();

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-rose-500/5 pointer-events-none" />
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">{t.dashboard.dailyBrief}</CardTitle>
              <CardDescription className="text-xs">{t.dashboard.dailyBriefDesc}</CardDescription>
            </div>
          </div>
          <RefreshButton loading={loading} cached={cached} onRefresh={onRefresh} generatedAt={generatedAt} />
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {loading && !brief ? (
          <BriefSkeleton />
        ) : brief ? (
          <>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{brief.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{brief.summary}</p>
            </div>

            {brief.keyPoints && brief.keyPoints.length > 0 && (
              <ul className="space-y-1.5">
                {brief.keyPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border">
              <Stat
                label={t.dashboard.sentiment}
                value={
                  brief.sentiment === "bullish" ? t.dashboard.sentimentBullish
                  : brief.sentiment === "bearish" ? t.dashboard.sentimentBearish
                  : t.dashboard.sentimentNeutral
                }
                tone={brief.sentiment === "bullish" ? "up" : brief.sentiment === "bearish" ? "down" : "flat"}
                icon={brief.sentiment === "bullish" ? <TrendingUp className="h-4 w-4" /> : brief.sentiment === "bearish" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              />
              <Stat
                label={t.signals.confidence}
                value={`${localizeNumber(brief.confidence, lang, 0)}%`}
                icon={<Gauge className="h-4 w-4" />}
              />
              <Stat
                label={t.dashboard.volatility}
                value={
                  brief.volatility === "high" ? t.dashboard.high
                  : brief.volatility === "medium" ? t.dashboard.medium
                  : t.dashboard.low
                }
                tone={brief.volatility === "high" ? "down" : brief.volatility === "low" ? "up" : "flat"}
                icon={<Activity className="h-4 w-4" />}
              />
              <Stat
                label={t.dashboard.risk}
                value={
                  brief.riskLevel === "high" ? t.dashboard.high
                  : brief.riskLevel === "medium" ? t.dashboard.medium
                  : t.dashboard.low
                }
                tone={brief.riskLevel === "high" ? "down" : brief.riskLevel === "low" ? "up" : "flat"}
                icon={<AlertTriangle className="h-4 w-4" />}
              />
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">{t.signals.basis}: </span>
              {brief.recommendedAction}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t.common.noData}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: string; tone?: "up" | "down" | "flat"; icon?: React.ReactNode }) {
  const color = tone === "up" ? "text-emerald-500" : tone === "down" ? "text-rose-500" : "text-muted-foreground";
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className={`flex items-center gap-1.5 font-semibold ${color}`}>
        {icon}
        <span className="text-sm">{value}</span>
      </div>
    </div>
  );
}

function BriefSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
      <div className="h-3 w-full rounded bg-muted animate-pulse" />
      <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-4 gap-3 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-2 w-12 rounded bg-muted animate-pulse" />
            <div className="h-4 w-14 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
