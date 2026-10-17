"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw, Check, Clock } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { localizeNumber, toPersianDigits } from "@/lib/i18n";

interface RefreshButtonProps {
  loading?: boolean;
  cached?: boolean;
  onRefresh: () => void;
  generatedAt?: string;
}

export function RefreshButton({ loading, cached, onRefresh, generatedAt }: RefreshButtonProps) {
  const { t, lang } = useApp();
  return (
    <div className="flex items-center gap-2">
      {generatedAt && (
        <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          {cached ? (
            <span className="flex items-center gap-1">
              <Check className="h-3 w-3 text-emerald-500" />
              {lang === "fa" ? "ذخیره‌شده" : "Cached"}
            </span>
          ) : (
            <span className="text-amber-500">
              {lang === "fa" ? "تازه" : "Fresh"}
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
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
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
