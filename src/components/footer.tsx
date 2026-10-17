"use client";

import { useApp } from "@/components/app-provider";
import { Activity, AlertTriangle } from "lucide-react";

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="mt-auto border-t border-border bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 text-white">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t.brand}</p>
              <p className="text-[10px] text-muted-foreground">{t.footer.copyright}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground max-w-xl">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span className="leading-relaxed">{t.footer.disclaimer}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
