"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, TrendingDown, Activity, RefreshCw, Award, Target } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { RefreshButton } from "@/components/refresh-button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface PerformanceStats {
  totalSent: number;
  evaluated: number;
  wins: number;
  losses: number;
  stillOpen: number;
  winRate: number;
  totalROI: number;
}

interface RecentSignal {
  id: string;
  symbol: string;
  timeframe: string;
  direction: string;
  strength: number;
  entry: string;
  takeProfit: string;
  stopLoss: string;
  createdAt: string;
  outcome: string | null;
  currentPrice: string | null;
  evaluatedAt: string | null;
}

export function PerformancePanel() {
  const { t, lang } = useApp();
  const [stats, setStats] = useState<PerformanceStats>({
    totalSent: 0, evaluated: 0, wins: 0, losses: 0, stillOpen: 0, winRate: 0, totalROI: 0,
  });
  const [signals, setSignals] = useState<RecentSignal[]>([]);
  const [equityCurve, setEquityCurve] = useState<Array<{ date: string; roi: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const fetchPerf = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/performance");
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
        setSignals(data.recentSignals || []);
        setEquityCurve(data.equityCurve || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const evaluateSignals = async () => {
    setEvaluating(true);
    try {
      await fetch("/api/backtest-eval");
      await fetchPerf();
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    fetchPerf();
  }, [fetchPerf]);

  const winRateColor = stats.winRate >= 70 ? "text-emerald-500" : stats.winRate >= 50 ? "text-amber-500" : "text-rose-500";
  const roiColor = stats.totalROI >= 0 ? "text-emerald-500" : "text-rose-500";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-pink-600 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">
                {lang === "fa" ? "عملکرد سیگنال‌ها" : "Signal Performance"}
              </CardTitle>
              <CardDescription className="text-xs">
                {lang === "fa" ? "آمار دقت و سود سیگنال‌های ارسالی" : "Track accuracy & ROI of past signals"}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={evaluateSignals}
              disabled={evaluating}
              className="text-xs h-8"
              title={lang === "fa" ? "ارزیابی سیگنال‌های قبلی" : "Evaluate past signals"}
            >
              <RefreshCw className={`h-3 w-3 ${evaluating ? "animate-spin" : ""}`} />
              {lang === "fa" ? "ارزیابی" : "Evaluate"}
            </Button>
            <RefreshButton loading={loading} onRefresh={fetchPerf} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox
            label={lang === "fa" ? "نرخ برد" : "Win Rate"}
            value={`${stats.winRate}%`}
            sub={`${stats.wins}/${stats.wins + stats.losses}`}
            color={winRateColor}
            icon={<Award className="h-4 w-4" />}
          />
          <StatBox
            label={lang === "fa" ? "کل سود" : "Total ROI"}
            value={`${stats.totalROI >= 0 ? "+" : ""}${stats.totalROI}%`}
            sub={lang === "fa" ? "افتر کسر ۱٪ ریسک" : "After 1% risk"}
            color={roiColor}
            icon={stats.totalROI >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          />
          <StatBox
            label={lang === "fa" ? "کل سیگنال‌ها" : "Total Signals"}
            value={String(stats.totalSent)}
            sub={lang === "fa" ? "ارسال‌شده" : "sent"}
            color="text-sky-500"
            icon={<Target className="h-4 w-4" />}
          />
          <StatBox
            label={lang === "fa" ? "ارزیابی‌شده" : "Evaluated"}
            value={String(stats.evaluated)}
            sub={`${stats.stillOpen} ${lang === "fa" ? "باز" : "open"}`}
            color="text-violet-500"
            icon={<Activity className="h-4 w-4" />}
          />
        </div>

        {/* Equity curve */}
        {equityCurve.length > 1 && (
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2">
              {lang === "fa" ? "منحنی رشد سرمایه" : "Equity Curve"}
            </p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v}%`, lang === "fa" ? "سود" : "ROI"]}
                  />
                  <ReferenceLine y={0} stroke="rgba(120,120,120,0.3)" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="roi"
                    stroke={stats.totalROI >= 0 ? "#10b981" : "#e11d48"}
                    strokeWidth={2}
                    isAnimationActive
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent signals */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2">
            {lang === "fa" ? "سیگنال‌های اخیر" : "Recent Signals"}
          </p>
          {signals.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              {lang === "fa" ? "هنوز سیگنالی ارسال نشده" : "No signals sent yet"}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scroll pr-1">
              {signals.map((s) => (
                <SignalRow key={s.id} signal={s} lang={lang} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className={`flex items-center gap-1 ${color}`}>
        {icon}
        <p className="text-[10px] uppercase tracking-wide">{label}</p>
      </div>
      <p className={`text-xl font-bold ${color} mt-1`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function SignalRow({ signal, lang }: { signal: RecentSignal; lang: "fa" | "en" }) {
  const outcomeColors: Record<string, string> = {
    win: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    loss: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    open: "bg-muted text-muted-foreground border-border",
    null: "bg-muted text-muted-foreground border-border",
  };
  const outcomeLabel: Record<string, string> = {
    win: lang === "fa" ? "سود" : "Win",
    loss: lang === "fa" ? "ضرر" : "Loss",
    open: lang === "fa" ? "باز" : "Open",
    null: lang === "fa" ? "—" : "—",
  };
  const outcome = signal.outcome || "null";
  const dirColor = signal.direction === "long" ? "text-emerald-500" : "text-rose-500";
  const dirIcon = signal.direction === "long" ? "🟢" : signal.direction === "short" ? "🔴" : "⚪";

  return (
    <div className="rounded-md border border-border bg-card p-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs">{dirIcon}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">
            {signal.symbol} <span className="text-muted-foreground">{signal.timeframe.toUpperCase()}</span>
          </p>
          <p className={`text-[10px] ${dirColor}`}>
            {signal.direction === "long" ? (lang === "fa" ? "خرید" : "Long") : signal.direction === "short" ? (lang === "fa" ? "فروش" : "Short") : (lang === "fa" ? "خنثی" : "Neutral")}
            {" • "}
            {lang === "fa" ? "ورود" : "Entry"}: {signal.entry}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {signal.currentPrice && (
          <span className="text-[10px] text-muted-foreground">
            {lang === "fa" ? "قیمت فعلی" : "now"}: {signal.currentPrice.slice(0, 7)}
          </span>
        )}
        <Badge className={`text-[10px] border ${outcomeColors[outcome] || outcomeColors.null}`}>
          {outcomeLabel[outcome]}
        </Badge>
      </div>
    </div>
  );
}
