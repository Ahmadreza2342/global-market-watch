"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles, TrendingUp, TrendingDown, Minus, Newspaper } from "lucide-react";
import { useApp } from "@/components/app-provider";
import type { NewsItem } from "@/lib/market";
import { RefreshButton } from "@/components/refresh-button";

interface NewsPanelProps {
  news: NewsItem[];
  loading: boolean;
  cached?: boolean;
  generatedAt?: string;
  onRefresh: () => void;
}

const CATEGORY_LABELS: Record<NewsItem["category"], { fa: string; en: string; color: string }> = {
  fed: { fa: "فدرال رزرو", en: "Federal Reserve", color: "bg-violet-500/15 text-violet-500" },
  war: { fa: "جنگ", en: "War", color: "bg-rose-500/15 text-rose-500" },
  economy: { fa: "اقتصاد", en: "Economy", color: "bg-emerald-500/15 text-emerald-500" },
  crisis: { fa: "بحران", en: "Crisis", color: "bg-amber-500/15 text-amber-500" },
  politics: { fa: "سیاسی", en: "Politics", color: "bg-cyan-500/15 text-cyan-500" },
};

const CATEGORY_LABELS_FA: Record<NewsItem["category"], string> = {
  fed: "فدرال رزرو",
  war: "جنگ",
  economy: "اقتصاد",
  crisis: "بحران",
  politics: "سیاسی",
};

export function NewsPanel({ news, loading, cached, generatedAt, onRefresh }: NewsPanelProps) {
  const { t, lang } = useApp();
  const [filter, setFilter] = useState<NewsItem["category"] | "all">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return news;
    return news.filter((n) => n.category === filter);
  }, [news, filter]);

  const categories: Array<NewsItem["category"] | "all"> = ["all", "fed", "war", "economy", "crisis", "politics"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">{t.news.title}</CardTitle>
              <CardDescription className="text-xs">
                {news.length > 0 ? `${news.length} ${lang === "fa" ? "خبر" : "items"}` : t.common.noData}
              </CardDescription>
            </div>
          </div>
          <RefreshButton loading={loading} cached={cached} onRefresh={onRefresh} generatedAt={generatedAt} />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1 flex-wrap mt-3">
          {categories.map((c) => (
            <Button
              key={c}
              variant={filter === c ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter(c)}
              className="text-[11px] h-7"
            >
              {c === "all" ? t.news.all : lang === "fa" ? CATEGORY_LABELS_FA[c] : CATEGORY_LABELS[c].en}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading && news.length === 0 ? (
          <NewsSkeleton />
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.slice(0, 12).map((item, i) => (
              <NewsItemCard key={i} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t.common.noData}</p>
        )}
      </CardContent>
    </Card>
  );
}

function NewsItemCard({ item }: { item: NewsItem }) {
  const { t, lang } = useApp();
  const cat = CATEGORY_LABELS[item.category];
  const impactColor =
    item.impact === "positive" ? "text-emerald-500"
    : item.impact === "negative" ? "text-rose-500"
    : "text-muted-foreground";
  const impactIcon =
    item.impact === "positive" ? <TrendingUp className="h-3 w-3" />
    : item.impact === "negative" ? <TrendingDown className="h-3 w-3" />
    : <Minus className="h-3 w-3" />;
  const impactLabel =
    item.impact === "positive" ? t.news.positive
    : item.impact === "negative" ? t.news.negative
    : t.news.neutral;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-3 hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge className={`text-[10px] ${cat.color} border-0`}>
          {lang === "fa" ? CATEGORY_LABELS_FA[item.category] : cat.en}
        </Badge>
        <span className={`flex items-center gap-1 text-[10px] font-medium ${impactColor}`}>
          {impactIcon}
          {impactLabel}
        </span>
      </div>
      <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
        {item.title}
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.summary}</p>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-auto">
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          {item.source || new URL(item.url).hostname.replace("www.", "")}
        </span>
        <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100" />
      </div>
    </a>
  );
}

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            <div className="h-4 w-12 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-3 w-full rounded bg-muted animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
          <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}
