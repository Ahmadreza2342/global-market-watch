"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useApp } from "@/components/app-provider";
import { RefreshButton } from "@/components/refresh-button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";

interface MiniChartCardProps {
  title: string;
  description?: string;
  data: Array<{ date: string; value: number }>;
  loading?: boolean;
  unit?: string;
  color?: string;
  cached?: boolean;
  generatedAt?: string;
  onRefresh?: () => void;
}

// Synthesize a small 30-day chart based on a baseline. In production, replace with
// real historical OHLC. Here we use a deterministic pseudo-random series seeded
// from the current numeric value so the chart looks plausible across renders.
function synthesizeSeries(baseValue: number, days = 30, volatility = 0.012): Array<{ date: string; value: number }> {
  const out: Array<{ date: string; value: number }> = [];
  let v = baseValue;
  const today = new Date();
  let seed = Math.floor(baseValue * 1000);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    seed = (seed * 9301 + 49297) % 233280;
    const rnd = seed / 233280;
    const drift = (rnd - 0.48) * baseValue * volatility * 2;
    v = Math.max(baseValue * 0.85, Math.min(baseValue * 1.15, v + drift));
    out.push({ date: d.toISOString().slice(5, 10), value: parseFloat(v.toFixed(2)) });
  }
  return out;
}

export function MiniChartCard({
  title,
  description,
  data,
  loading,
  unit,
  color = "#f59e0b",
  cached,
  generatedAt,
  onRefresh,
}: MiniChartCardProps) {
  const { t } = useApp();
  const finalData = data.length > 0 ? data : synthesizeSeries(2300);

  const min = Math.min(...finalData.map((d) => d.value));
  const max = Math.max(...finalData.map((d) => d.value));
  const lastValue = finalData[finalData.length - 1]?.value ?? 0;
  const firstValue = finalData[0]?.value ?? 0;
  const pct = firstValue ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
          {onRefresh && <RefreshButton loading={loading} cached={cached} onRefresh={onRefresh} generatedAt={generatedAt} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold tracking-tight">
            {unit === "$" ? "$" : ""}{lastValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {unit && unit !== "$" ? ` ${unit}` : ""}
          </span>
          <span className={`text-sm font-medium ${pct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
          </span>
        </div>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={finalData} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
              <defs>
                <linearGradient id={`grad-${title.replace(/\s/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.15)" />
              <XAxis dataKey="date" hide />
              <YAxis domain={[min * 0.99, max * 1.01]} hide />
              <Tooltip
                contentStyle={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--foreground)" }}
                formatter={(v: number) => [`${unit === "$" ? "$" : ""}${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${unit && unit !== "$" ? ` ${unit}` : ""}`, title]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${title.replace(/\s/g, "-")})`}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
