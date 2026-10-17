"use client";

import { LiveAlertsWidget } from "@/components/live-alerts-widget";
import { TelegramSettingsPanel } from "@/components/telegram-settings-panel";

interface AlertsContainerProps {
  threshold?: number;
  pollIntervalMs?: number;
}

export function AlertsContainer({ threshold, pollIntervalMs }: AlertsContainerProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <LiveAlertsWidget threshold={threshold} pollIntervalMs={pollIntervalMs} />
      <TelegramSettingsPanel />
    </div>
  );
}
