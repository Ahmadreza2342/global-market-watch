"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { useApp } from "@/components/app-provider";
import type { CalendarEvent } from "@/lib/market";
import { RefreshButton } from "@/components/refresh-button";

interface CalendarPanelProps {
  events: CalendarEvent[];
  loading: boolean;
  cached?: boolean;
  generatedAt?: string;
  onRefresh: () => void;
}

export function CalendarPanel({ events, loading, cached, generatedAt, onRefresh }: CalendarPanelProps) {
  const { t, lang } = useApp();

  const importanceColor: Record<CalendarEvent["importance"], string> = {
    high: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    medium: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    low: "bg-muted text-muted-foreground border-border",
  };
  const importanceLabel: Record<CalendarEvent["importance"], string> = {
    high: t.dashboard.high,
    medium: t.dashboard.medium,
    low: t.dashboard.low,
  };

  // Group events by date
  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    const k = e.date;
    if (!acc[k]) acc[k] = [];
    acc[k].push(e);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">{t.calendar.title}</CardTitle>
              <CardDescription className="text-xs">{t.calendar.titleDesc}</CardDescription>
            </div>
          </div>
          <RefreshButton loading={loading} cached={cached} onRefresh={onRefresh} generatedAt={generatedAt} />
        </div>
      </CardHeader>
      <CardContent>
        {loading && events.length === 0 ? (
          <CalendarSkeleton />
        ) : events.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scroll">
            {Object.entries(grouped).map(([date, evs]) => {
              const dateObj = new Date(date + "T00:00:00Z");
              const isToday = new Date().toISOString().slice(0, 10) === date;
              return (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {dateObj.toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", { weekday: "long", day: "numeric", month: "short" })}
                    </span>
                    {isToday && <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border-0">{t.calendar.today}</Badge>}
                  </div>
                  <div className="space-y-1.5">
                    {evs.map((e, i) => (
                      <div key={i} className="rounded-lg border border-border bg-card p-2.5 flex items-start gap-3">
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0 w-16">
                          <Clock className="h-3 w-3" />
                          {e.time}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-tight">{e.event}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                            {e.forecast && <span>{t.calendar.forecast}: <span className="font-medium text-foreground">{e.forecast}</span></span>}
                            {e.previous && <span>{t.calendar.previous}: <span className="font-medium text-foreground">{e.previous}</span></span>}
                            {e.actual && <span className="text-emerald-500">{t.calendar.actual}: <span className="font-semibold">{e.actual}</span></span>}
                          </div>
                        </div>
                        <Badge className={`text-[10px] border ${importanceColor[e.importance]}`}>{importanceLabel[e.importance]}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t.common.noData}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          <div className="space-y-1.5">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-12 rounded border border-border bg-card animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
