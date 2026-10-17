"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Activity, Clock, Award } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { RefreshButton } from "@/components/refresh-button";
import type { TopTrader } from "@/lib/mt5";
import { localizeNumber } from "@/lib/i18n";

interface TradersPanelProps {
  traders: TopTrader[];
  loading: boolean;
  cached?: boolean;
  generatedAt?: string;
  onRefresh: () => void;
}

export function TradersPanel({ traders, loading, cached, generatedAt, onRefresh }: TradersPanelProps) {
  const { t, lang } = useApp();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500 to-amber-700 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">{t.traders.title}</CardTitle>
              <CardDescription className="text-xs">{t.traders.titleDesc}</CardDescription>
            </div>
          </div>
          <RefreshButton loading={loading} cached={cached} onRefresh={onRefresh} generatedAt={generatedAt} />
        </div>
      </CardHeader>
      <CardContent>
        {loading && traders.length === 0 ? (
          <TradersSkeleton />
        ) : traders.length > 0 ? (
          <>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 mb-3 flex items-start gap-2">
              <Award className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">{t.traders.copyHint}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {traders.map((tr) => (
                <TraderCard key={tr.rank} trader={tr} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t.common.noData}</p>
        )}
      </CardContent>
    </Card>
  );
}

function TraderCard({ trader }: { trader: TopTrader }) {
  const { t, lang } = useApp();
  const riskColor =
    trader.riskLevel === "aggressive" ? "bg-rose-500/15 text-rose-500 border-rose-500/30"
    : trader.riskLevel === "conservative" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
    : "bg-amber-500/15 text-amber-500 border-amber-500/30";
  const riskLabel =
    trader.riskLevel === "aggressive" ? t.traders.aggressive
    : trader.riskLevel === "conservative" ? t.traders.conservative
    : t.traders.moderate;
  const stratLabel =
    trader.strategy === "scalper" ? t.traders.scalper
    : trader.strategy === "dayTrader" ? t.traders.dayTrader
    : trader.strategy === "swingTrader" ? t.traders.swingTrader
    : t.traders.trendFollower;

  const gainPositive = trader.gainPct > 0;
  const winRateColor = trader.winRatePct >= 70 ? "text-emerald-500" : trader.winRatePct >= 55 ? "text-amber-500" : "text-rose-500";

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3 hover:border-amber-500/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-amber-700 text-white text-xs font-bold">
            {trader.rank}
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{trader.name}</p>
            <p className="text-[10px] text-muted-foreground">{trader.broker}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border-0">{t.traders.real}</Badge>
          <Badge className={`text-[10px] border ${riskColor}`}>{riskLabel}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label={t.traders.gain} value={`${gainPositive ? "+" : ""}${localizeNumber(trader.gainPct, lang, 1)}%`} tone="text-emerald-500" />
        <Stat label={t.traders.monthly} value={`${gainPositive ? "+" : ""}${localizeNumber(trader.monthlyPct, lang, 1)}%`} tone="text-emerald-500" />
        <Stat label={t.traders.drawdown} value={`${localizeNumber(trader.drawdownPct, lang, 1)}%`} tone="text-rose-500" />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border">
        <Stat label={t.traders.winRate} value={`${localizeNumber(trader.winRatePct, lang, 0)}%`} tone={winRateColor} />
        <Stat label={t.traders.trades} value={localizeNumber(trader.trades, lang, 0)} />
        <Stat label={t.traders.daysActive} value={localizeNumber(trader.daysActive, lang, 0)} />
      </div>

      <div className="space-y-1.5 pt-2 border-t border-border">
        <Row label={t.traders.strategy} value={stratLabel} icon={<Activity className="h-3 w-3" />} />
        <Row label={t.traders.activeHours} value={trader.activeHours} icon={<Clock className="h-3 w-3" />} />
        <Row label={t.traders.avgHoldTime} value={trader.avgHoldTime} icon={<TrendingUp className="h-3 w-3" />} />
      </div>

      <div className="flex flex-wrap gap-1">
        {trader.instruments.map((ins) => (
          <Badge key={ins} variant="outline" className="text-[10px]">{ins}</Badge>
        ))}
      </div>

      <div className="rounded-md bg-muted/30 p-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{t.traders.behavior}</p>
        <p className="text-[11px] leading-relaxed">{trader.behavior}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold ${tone || ""}`}>{value}</p>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground flex items-center gap-1">{icon}{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function TradersSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="space-y-1">
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                <div className="h-2 w-16 rounded bg-muted animate-pulse" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-10 rounded bg-muted/30 animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
