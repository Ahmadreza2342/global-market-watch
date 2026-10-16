"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, Minus, Layers, Gauge, Newspaper, Users, Target, Shield } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { RefreshButton } from "@/components/refresh-button";
import { localizeNumber } from "@/lib/i18n";
import type { MultiTfSignal } from "@/lib/mt5";

interface MultiTfPanelProps {
  signals: MultiTfSignal[];
  loading: boolean;
  cached?: boolean;
  generatedAt?: string;
  onRefresh: () => void;
}

export function MultiTfPanel({ signals, loading, cached, generatedAt, onRefresh }: MultiTfPanelProps) {
  const { t, lang } = useApp();

  // Group by symbol
  const grouped = signals.reduce<Record<string, MultiTfSignal[]>>((acc, s) => {
    if (!acc[s.symbol]) acc[s.symbol] = [];
    acc[s.symbol].push(s);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-700 text-white">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">{t.multiTf.title}</CardTitle>
              <CardDescription className="text-xs">{t.multiTf.titleDesc}</CardDescription>
            </div>
          </div>
          <RefreshButton loading={loading} cached={cached} onRefresh={onRefresh} generatedAt={generatedAt} />
        </div>
      </CardHeader>
      <CardContent>
        {loading && signals.length === 0 ? (
          <MultiTfSkeleton />
        ) : signals.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(grouped).map(([symbol, sigs]) => (
              <div key={symbol}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-md ${symbol === "XAU/USD" ? "bg-amber-500/15 text-amber-500" : "bg-slate-500/15 text-slate-500"}`}>
                    {symbol === "XAU/USD" ? "🥇" : "🛢"}
                  </div>
                  <h3 className="text-sm font-semibold">{symbol === "XAU/USD" ? t.multiTf.gold : t.multiTf.crudeOil}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sigs.map((s) => (
                    <SignalGrid key={s.timeframe} signal={s} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.common.noData}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SignalGrid({ signal }: { signal: MultiTfSignal }) {
  const { t, lang } = useApp();
  const dir = signal.direction;
  const dirLabel = dir === "long" ? t.multiTf.buy : dir === "short" ? t.multiTf.sell : t.multiTf.neutral;
  const dirColor =
    dir === "long" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
    : dir === "short" ? "bg-rose-500/15 text-rose-500 border-rose-500/30"
    : "bg-muted text-muted-foreground border-border";
  const dirIcon =
    dir === "long" ? <ArrowUpRight className="h-4 w-4" /> : dir === "short" ? <ArrowDownRight className="h-4 w-4" /> : <Minus className="h-4 w-4" />;
  const tfLabel = signal.timeframe === "15m" ? t.multiTf["15m"] : signal.timeframe === "1h" ? t.multiTf["1h"] : t.multiTf["1d"];
  const strengthLabel =
    signal.strength >= 85 ? t.multiTf.veryStrong
    : signal.strength >= 70 ? t.multiTf.strong
    : signal.strength >= 50 ? t.multiTf.moderate
    : t.multiTf.weak;
  const strengthColor =
    signal.strength >= 85 ? "text-emerald-500"
    : signal.strength >= 70 ? "text-amber-500"
    : signal.strength >= 50 ? "text-yellow-500"
    : "text-muted-foreground";

  const isStrong = signal.strength >= 75;

  return (
    <div className={`rounded-lg border p-3 space-y-3 ${isStrong ? "border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/30" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{tfLabel}</Badge>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${dirColor}`}>
            {dirIcon}
            <span className="text-xs font-semibold">{dirLabel}</span>
          </div>
        </div>
        <div className="text-end">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.multiTf.strength}</p>
          <p className={`text-base font-bold ${strengthColor}`}>{signal.strength}</p>
        </div>
      </div>

      {/* Strength bar */}
      <div className="relative h-2 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={`absolute inset-y-0 start-0 rounded-full transition-all ${
            dir === "long" ? "bg-emerald-500" : dir === "short" ? "bg-rose-500" : "bg-muted-foreground"
          }`}
          style={{ width: `${signal.strength}%` }}
        />
        {isStrong && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-bold text-white drop-shadow">{strengthLabel}</span>
          </div>
        )}
      </div>

      {/* Price levels */}
      <div className="grid grid-cols-3 gap-2">
        <Cell label={t.signals.entryPoint} value={`$${localizeNumber(signal.entry, lang, 2)}`} icon={<Target className="h-3 w-3" />} tone="text-amber-500" />
        <Cell label={t.signals.takeProfit} value={`$${localizeNumber(signal.takeProfit, lang, 2)}`} icon={<Target className="h-3 w-3" />} tone="text-emerald-500" />
        <Cell label={t.signals.stopLoss} value={`$${localizeNumber(signal.stopLoss, lang, 2)}`} icon={<Shield className="h-3 w-3" />} tone="text-rose-500" />
      </div>

      {/* Bias breakdown */}
      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border">
        <BiasCell label={t.multiTf.technical} score={signal.technical.strength} direction={signal.technical.direction} icon={<Gauge className="h-3 w-3" />} />
        <BiasCell label={t.multiTf.newsBias} score={signal.newsBias.score} direction={signal.newsBias.direction} icon={<Newspaper className="h-3 w-3" />} />
        <BiasCell label={t.multiTf.traderBias} score={signal.traderBias.score} direction={signal.traderBias.direction} icon={<Users className="h-3 w-3" />} />
      </div>

      {/* Reason */}
      <div className="rounded-md bg-muted/30 p-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{t.signals.basis}</p>
        <p className="text-[11px] leading-relaxed line-clamp-3">{signal.reason}</p>
      </div>
    </div>
  );
}

function Cell({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-md bg-muted/30 p-2 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1 mb-0.5">{icon}{label}</p>
      <p className={`text-xs font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function BiasCell({ label, score, direction, icon }: { label: string; score: number; direction: string; icon: React.ReactNode }) {
  const tone = direction === "long" ? "text-emerald-500" : direction === "short" ? "text-rose-500" : "text-muted-foreground";
  const arrow = direction === "long" ? "↑" : direction === "short" ? "↓" : "→";
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1">{icon}{label}</p>
      <p className={`text-sm font-bold ${tone}`}>{arrow} {score}</p>
    </div>
  );
}

function MultiTfSkeleton() {
  return (
    <div className="space-y-4">
      {["XAU/USD", "WTI/USD"].map((sym) => (
        <div key={sym}>
          <div className="h-5 w-32 rounded bg-muted animate-pulse mb-2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="h-48 rounded bg-muted/30 border border-border animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
