"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Minus, Target, Shield, TrendingUp, AlertTriangle, Compass } from "lucide-react";
import { useApp } from "@/components/app-provider";
import type { TradingSignal } from "@/lib/market";
import { RefreshButton } from "@/components/refresh-button";

interface SignalsPanelProps {
  signals: TradingSignal[];
  loading: boolean;
  cached?: boolean;
  generatedAt?: string;
  onRefresh: () => void;
}

export function SignalsPanel({ signals, loading, cached, generatedAt, onRefresh }: SignalsPanelProps) {
  const { t } = useApp();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">{t.signals.title}</CardTitle>
              <CardDescription className="text-xs">{t.signals.titleDesc}</CardDescription>
            </div>
          </div>
          <RefreshButton loading={loading} cached={cached} onRefresh={onRefresh} generatedAt={generatedAt} />
        </div>
      </CardHeader>
      <CardContent>
        {loading && signals.length === 0 ? (
          <SignalsSkeleton />
        ) : signals.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {signals.map((s, i) => (
                <SignalCard key={i} signal={s} />
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">{t.signals.disclaimer}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t.common.noData}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SignalCard({ signal }: { signal: TradingSignal }) {
  const { t, lang } = useApp();
  const dir = signal.direction;
  const dirLabel = dir === "long" ? t.signals.long : dir === "short" ? t.signals.short : t.signals.neutral;
  const dirColor = dir === "long" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
    : dir === "short" ? "bg-rose-500/15 text-rose-500 border-rose-500/30"
    : "bg-muted text-muted-foreground border-border";
  const dirIcon = dir === "long" ? <ArrowUpRight className="h-4 w-4" /> : dir === "short" ? <ArrowDownRight className="h-4 w-4" /> : <Minus className="h-4 w-4" />;
  const confidenceColor =
    signal.confidence >= 75 ? "text-emerald-500"
    : signal.confidence >= 50 ? "text-amber-500"
    : "text-rose-500";
  const tfLabel = signal.timeframe === "short" ? t.signals.shortTerm : signal.timeframe === "mid" ? t.signals.midTerm : t.signals.longTerm;
  const riskLabel = signal.risk === "high" ? t.dashboard.high : signal.risk === "medium" ? t.dashboard.medium : t.dashboard.low;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${dirColor}`}>
            {dirIcon}
            <span className="text-xs font-semibold">{dirLabel}</span>
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">{signal.symbol}</p>
            <p className="text-[10px] text-muted-foreground">{tfLabel}</p>
          </div>
        </div>
        <div className="text-end">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.signals.confidence}</p>
          <p className={`text-sm font-bold ${confidenceColor}`}>{signal.confidence}%</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SignalStat label={t.signals.entryPoint} value={signal.entry} icon={<Compass className="h-3 w-3" />} tone="text-amber-500" />
        <SignalStat label={t.signals.takeProfit} value={signal.takeProfit} icon={<Target className="h-3 w-3" />} tone="text-emerald-500" />
        <SignalStat label={t.signals.stopLoss} value={signal.stopLoss} icon={<Shield className="h-3 w-3" />} tone="text-rose-500" />
      </div>

      {signal.basis && signal.basis.length > 0 && (
        <div className="rounded-md bg-muted/30 p-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{t.signals.basis}</p>
          <ul className="space-y-1">
            {signal.basis.map((b, i) => (
              <li key={i} className="text-[11px] leading-relaxed flex items-start gap-1.5">
                <TrendingUp className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
        <span>{t.dashboard.risk}: <span className="font-medium text-foreground">{riskLabel}</span></span>
        {signal.validUntil && (
          <span>{t.calendar.actual}: {new Date(signal.validUntil).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", { day: "2-digit", month: "short" })}</span>
        )}
      </div>
    </div>
  );
}

function SignalStat({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-md bg-muted/30 p-2 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1 mb-1">{icon}{label}</p>
      <p className={`text-sm font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function SignalsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-24 rounded bg-muted animate-pulse" />
            <div className="h-8 w-12 rounded bg-muted animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-12 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
