"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart3, Percent, Coins, Building2, Activity, Crown } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { localizeNumber } from "@/lib/i18n";
import type { IndicatorRow, MarketIndicators } from "@/lib/market";
import { RefreshButton } from "@/components/refresh-button";

interface IndicatorsPanelProps {
  data: MarketIndicators | null;
  loading: boolean;
  cached?: boolean;
  generatedAt?: string;
  onRefresh: () => void;
}

const ICONS: Record<string, React.ReactNode> = {
  interestRate: <Percent className="h-4 w-4" />,
  dxy: <DollarSign className="h-4 w-4" />,
  inflation: <Activity className="h-4 w-4" />,
  treasury10y: <BarChart3 className="h-4 w-4" />,
  goldPrice: <Crown className="h-4 w-4" />,
  centralBank: <Building2 className="h-4 w-4" />,
  economicStats: <Coins className="h-4 w-4" />,
};

export function IndicatorsPanel({ data, loading, cached, generatedAt, onRefresh }: IndicatorsPanelProps) {
  const { t, lang } = useApp();

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg">{t.indicators.title}</CardTitle>
            <CardDescription className="text-xs">{t.indicators.titleDesc}</CardDescription>
          </div>
          <RefreshButton loading={loading} cached={cached} onRefresh={onRefresh} generatedAt={generatedAt} />
        </div>
      </CardHeader>
      <CardContent>
        {data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <IndicatorCard label={t.indicators.goldPrice} desc={t.indicators.goldPriceDesc} row={data.goldPrice} icon={ICONS.goldPrice} highlight />
            <IndicatorCard label={t.indicators.dxy} desc={t.indicators.dxyDesc} row={data.dxy} icon={ICONS.dxy} />
            <IndicatorCard label={t.indicators.treasury10y} desc={t.indicators.treasury10yDesc} row={data.treasury10y} icon={ICONS.treasury10y} highlight />
            <IndicatorCard label={t.indicators.interestRate} desc={t.indicators.interestRateDesc} row={data.interestRate} icon={ICONS.interestRate} />
            <IndicatorCard label={t.indicators.inflation} desc={t.indicators.inflationDesc} row={data.inflation} icon={ICONS.inflation} />
            <IndicatorCard label={t.indicators.centralBank} desc={t.indicators.centralBankDesc} row={data.centralBank} icon={ICONS.centralBank} />
            <IndicatorCard label={t.indicators.economicStats} desc={t.indicators.economicStatsDesc} row={data.economicStats} icon={ICONS.economicStats} />
            <IndicatorCard label={t.dashboard.marketMovers} desc={data.trendNote} row={{
              label: t.dashboard.marketMovers,
              value: data.trend === "up" ? "↑ Bullish" : data.trend === "down" ? "↓ Bearish" : "→ Neutral",
              change: data.trend,
              changeType: data.trend === "up" ? "up" : data.trend === "down" ? "down" : "flat",
              updatedAt: new Date().toISOString(),
            }} icon={ICONS.economicStats} wide />
          </div>
        ) : loading ? (
          <IndicatorsSkeleton />
        ) : (
          <p className="text-sm text-muted-foreground">{t.common.noData}</p>
        )}
      </CardContent>
    </Card>
  );
}

function IndicatorCard({
  label,
  desc,
  row,
  icon,
  highlight,
  wide,
}: {
  label: string;
  desc: string;
  row: IndicatorRow;
  icon?: React.ReactNode;
  highlight?: boolean;
  wide?: boolean;
}) {
  const { t, lang } = useApp();
  const tone = row.changeType === "up" ? "text-emerald-500" : row.changeType === "down" ? "text-rose-500" : "text-muted-foreground";
  const arrow = row.changeType === "up" ? <TrendingUp className="h-3 w-3" /> : row.changeType === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />;

  return (
    <div className={`relative rounded-lg border ${highlight ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-card"} p-3 ${wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${highlight ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground"}`}>
            {icon}
          </div>
          <div>
            <p className="text-xs font-medium leading-tight">{label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{desc}</p>
          </div>
        </div>
        <Badge variant={row.changeType === "up" ? "default" : row.changeType === "down" ? "destructive" : "secondary"} className="text-[10px] gap-1">
          {arrow}
          {row.change || "—"}
        </Badge>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold tracking-tight">{row.value}</span>
        {row.unit && <span className="text-xs text-muted-foreground">{row.unit}</span>}
      </div>
      {(row.previous || row.forecast) && (
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
          {row.previous && <span>{t.indicators.previous}: <span className="font-medium text-foreground">{row.previous}</span></span>}
          {row.forecast && <span>{t.indicators.forecast}: <span className="font-medium text-foreground">{row.forecast}</span></span>}
        </div>
      )}
      {row.note && <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">{row.note}</p>}
    </div>
  );
}

function IndicatorsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-muted animate-pulse" />
            <div className="space-y-1 flex-1">
              <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
              <div className="h-2 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-16 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}
