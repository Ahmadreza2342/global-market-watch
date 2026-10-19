"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, Check, Clock, AlertCircle } from "lucide-react";
import { useApp } from "@/components/app-provider";

interface RefreshButtonProps {
  loading?: boolean;
  cached?: boolean;
  onRefresh: () => void;
  generatedAt?: string;
}

export function RefreshButton({ loading, cached, onRefresh, generatedAt }: RefreshButtonProps) {
  const { t, lang } = useApp();

  // Compute "X minutes ago"
  let agoText = "";
  let isStale = false;
  if (generatedAt) {
    const ageMs = Date.now() - new Date(generatedAt).getTime();
    const ageMin = Math.floor(ageMs / 60000);
    if (ageMin < 1) agoText = lang === "fa" ? "همین حالا" : "just now";
    else if (ageMin < 60) agoText = lang === "fa" ? `${toPersianDigitsLocal(ageMin)} ${lang === "fa" ? "دقیقه پیش" : "min ago"}` : `${ageMin} min ago`;
    else {
      const ageHr = Math.floor(ageMin / 60);
      agoText = lang === "fa" ? `${toPersianDigitsLocal(ageHr)} ${lang === "fa" ? "ساعت پیش" : "h ago"}` : `${ageHr}h ago`;
    }
    isStale = ageMin > 15; // stale if older than 15 minutes
  }

  return (
    <div className="flex items-center gap-2">
      {generatedAt && (
        <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className={`h-3 w-3 ${isStale ? "text-amber-500" : "text-emerald-500"}`} />
          {agoText}
          {cached ? (
            <span className="flex items-center gap-0.5">
              <Check className="h-3 w-3 text-emerald-500" />
              {lang === "fa" ? "کش" : "cache"}
            </span>
          ) : (
            <span className="text-amber-500">
              {lang === "fa" ? "تازه" : "fresh"}
            </span>
          )}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        disabled={loading}
        className="h-8 w-8"
        aria-label="Refresh"
        title={lang === "fa" ? "به‌روزرسانی داده‌ها" : "Refresh data"}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}

function toPersianDigitsLocal(n: number): string {
  const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/[0-9]/g, (d) => map[Number(d)]);
}

export function LastUpdate({ iso }: { iso?: string }) {
  const { lang } = useApp();
  if (!iso) return null;
  const d = new Date(iso);
  const text = d.toLocaleString(lang === "fa" ? "fa-IR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
  return <span className="text-xs text-muted-foreground">{text}</span>;
}
