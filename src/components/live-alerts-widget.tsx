"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Volume2, VolumeX, Trash2, AlertTriangle, BellRing, TestTube2 } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { toast } from "sonner";
import { localizeNumber, toPersianDigits } from "@/lib/i18n";
import { sendSignalToTelegram, loadTelegramConfig } from "@/lib/telegram";

interface TriggeredAlert {
  id: string;
  symbol: string;
  timeframe: string;
  direction: "long" | "short" | "neutral";
  strength: number;
  entry: number | string;
  takeProfit: number | string;
  stopLoss: number | string;
  reason: string;
  triggeredAt: string;
}

interface LiveAlertsWidgetProps {
  pollIntervalMs?: number;
  threshold?: number;
}

export function LiveAlertsWidget({ pollIntervalMs = 60000, threshold = 75 }: LiveAlertsWidgetProps) {
  const { t, lang } = useApp();
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("gmw_alerts_enabled") === "1";
  });
  const [soundOn, setSoundOn] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("gmw_alerts_sound") !== "0";
  });
  const [history, setHistory] = useState<TriggeredAlert[]>([]);
  const seenRef = useRef<Set<string>>(new Set());

  // Request notification permission
  useEffect(() => {
    if (!enabled) return;
    if (typeof Notification === "undefined") {
      toast.info(t.liveAlerts.notificationsDenied);
      return;
    }
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        if (p !== "granted") {
          toast.warning(t.liveAlerts.notificationsDenied);
          setEnabled(false);
          localStorage.setItem("gmw_alerts_enabled", "0");
        } else {
          toast.success(t.liveAlerts.notificationsEnabled);
        }
      });
    }
  }, [enabled, t.liveAlerts.notificationsDenied, t.liveAlerts.notificationsEnabled]);

  const playBeep = useCallback(() => {
    if (!soundOn) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1320, ctx.currentTime);
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.5);
      }, 550);
    } catch (e) {
      // ignore
    }
  }, [soundOn]);

  const showAlert = useCallback(async (alert: TriggeredAlert) => {
    const title = alert.direction === "long" ? `🟢 ${t.liveAlerts.strongBuySignal}` : alert.direction === "short" ? `🔴 ${t.liveAlerts.strongSellSignal}` : t.liveAlerts.newSignal;
    const body = `${alert.symbol} ${alert.timeframe.toUpperCase()} — ${t.liveAlerts.strengthLabel}: ${alert.strength}\n${t.signals.entryPoint}: ${alert.entry}\n${t.signals.takeProfit}: ${alert.takeProfit}\n${t.signals.stopLoss}: ${alert.stopLoss}`;
    // Browser notification
    if (enabled && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          tag: alert.id,
          icon: "/logo.svg",
        });
      } catch (e) {
        // ignore
      }
    }
    // In-app toast
    toast(title, {
      description: body,
      duration: 8000,
      action: {
        label: t.common.view,
        onClick: () => {},
      },
    });
    // Beep
    playBeep();

    // Telegram auto-send (no UI feedback — fire-and-forget, but log on error)
    try {
      const cfg = loadTelegramConfig();
      if (cfg.enabled && cfg.botToken && cfg.chatId) {
        const result = await sendSignalToTelegram(alert, lang);
        if (!result.ok && result.error) {
          console.warn("[Telegram] send failed:", result.error);
        } else if (result.ok) {
          // Subtle toast confirming Telegram delivery
          toast.success(`✈️ ${t.telegram.title}`, {
            description: `${alert.symbol} ${alert.timeframe.toUpperCase()} → ${cfg.chatId}`,
            duration: 3000,
          });
        }
      }
    } catch (e) {
      // ignore
    }
  }, [enabled, lang, playBeep, t.common.view, t.liveAlerts.newSignal, t.liveAlerts.strongBuySignal, t.liveAlerts.strongSellSignal, t.liveAlerts.strengthLabel, t.signals.entryPoint, t.signals.takeProfit, t.signals.stopLoss, t.telegram.title]);

  // Poll for new strong signals
  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const r = await fetch("/api/signal-history");
        const d = await r.json();
        if (!d.history) return;
        const items: TriggeredAlert[] = d.history;
        // Find new items we haven't seen
        const newItems = items.filter((it) => !seenRef.current.has(it.id));
        // Add all to seen
        for (const it of items) seenRef.current.add(it.id);
        // Update history state
        setHistory(items.slice(0, 50));
        // Trigger alerts for genuinely new items
        if (enabled) {
          for (const it of newItems) {
            if (it.strength >= threshold) showAlert(it);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    poll();
    const id = setInterval(poll, pollIntervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [enabled, threshold, pollIntervalMs, showAlert]);

  const toggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("gmw_alerts_enabled", next ? "1" : "0");
    if (next && Notification.permission !== "granted" && typeof Notification !== "undefined") {
      Notification.requestPermission();
    }
  };

  const testAlert = async () => {
    try {
      const r = await fetch("/api/alerts-test", { method: "POST" });
      if (r.ok) {
        // Trigger local alert immediately for feedback
        const fake: TriggeredAlert = {
          id: `test-${Date.now()}`,
          symbol: "XAU/USD",
          timeframe: "1h",
          direction: "long",
          strength: 88,
          entry: "2475.50",
          takeProfit: "2495.00",
          stopLoss: "2465.00",
          reason: t.liveAlerts.testMessage,
          triggeredAt: new Date().toISOString(),
        };
        showAlert(fake);
        // Refresh history
        setTimeout(async () => {
          const r2 = await fetch("/api/signal-history");
          const d2 = await r2.json();
          if (d2.history) setHistory(d2.history.slice(0, 50));
        }, 800);
      }
    } catch (e) {
      toast.error("Test failed");
    }
  };

  const clearHistory = async () => {
    try {
      await fetch("/api/signal-history", { method: "DELETE" });
      setHistory([]);
      toast.success(t.liveAlerts.clearHistory);
    } catch (e) {
      // ignore
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-amber-500/5 pointer-events-none" />
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${enabled ? "from-rose-500 to-amber-600" : "from-muted to-muted-foreground/20"} text-white`}>
              {enabled ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">{t.liveAlerts.title}</CardTitle>
              <CardDescription className="text-xs">{t.liveAlerts.titleDesc}</CardDescription>
            </div>
          </div>
          <Badge variant={enabled ? "default" : "secondary"} className="text-[10px]">
            {enabled ? `${t.liveAlerts.threshold}: ${threshold}` : t.common.close}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-3">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant={enabled ? "default" : "outline"} onClick={toggleEnabled} className="text-xs">
            {enabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
            {enabled ? t.liveAlerts.disableNotifications : t.liveAlerts.enableNotifications}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { const n = !soundOn; setSoundOn(n); localStorage.setItem("gmw_alerts_sound", n ? "1" : "0"); }} className="text-xs">
            {soundOn ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            {soundOn ? t.liveAlerts.soundOn : t.liveAlerts.soundOff}
          </Button>
          <Button size="sm" variant="outline" onClick={testAlert} className="text-xs">
            <TestTube2 className="h-3 w-3" />
            {t.liveAlerts.testAlert}
          </Button>
        </div>

        {/* History */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide">{t.liveAlerts.history}</h4>
            {history.length > 0 && (
              <Button size="sm" variant="ghost" onClick={clearHistory} className="text-[10px] h-7">
                <Trash2 className="h-3 w-3" />
                {t.liveAlerts.clearHistory}
              </Button>
            )}
          </div>
          {history.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll pr-1">
              {history.map((a) => (
                <AlertItem key={a.id} alert={a} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
              <AlertTriangle className="h-6 w-6 mb-1 opacity-50" />
              {t.liveAlerts.noAlerts}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertItem({ alert }: { alert: TriggeredAlert }) {
  const { t, lang } = useApp();
  const dirColor = alert.direction === "long" ? "text-emerald-500" : alert.direction === "short" ? "text-rose-500" : "text-muted-foreground";
  const dirIcon = alert.direction === "long" ? "🟢" : alert.direction === "short" ? "🔴" : "⚪";

  return (
    <div className="rounded-md border border-border bg-card p-2.5 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{dirIcon}</span>
          <span className="text-xs font-semibold">{alert.symbol}</span>
          <Badge variant="outline" className="text-[10px]">{alert.timeframe}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {new Date(alert.triggeredAt).toLocaleString(lang === "fa" ? "fa-IR" : "en-US", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "short",
            })}
          </span>
          <Badge className={`text-[10px] ${alert.strength >= 85 ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"} border-0`}>
            {lang === "fa" ? toPersianDigits(alert.strength) : alert.strength}
          </Badge>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{alert.reason}</p>
      <div className="flex items-center justify-between text-[10px]">
        <span><span className="text-muted-foreground">{t.signals.entryPoint}:</span> <span className="font-medium text-foreground">{localizeNumber(alert.entry, lang, 2)}</span></span>
        <span><span className="text-muted-foreground">{t.signals.takeProfit}:</span> <span className={`font-medium ${dirColor}`}>{localizeNumber(alert.takeProfit, lang, 2)}</span></span>
        <span><span className="text-muted-foreground">{t.signals.stopLoss}:</span> <span className="font-medium text-rose-500">{localizeNumber(alert.stopLoss, lang, 2)}</span></span>
      </div>
    </div>
  );
}
