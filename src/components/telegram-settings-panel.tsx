"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/components/app-provider";
import {
  loadTelegramConfig,
  saveTelegramConfig,
  type TelegramConfig,
} from "@/lib/telegram";

export function TelegramSettingsPanel() {
  const { t, lang } = useApp();
  const [config, setConfig] = useState<TelegramConfig>(() => loadTelegramConfig());
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // (handleToggle moved below — see new version)

  const handleSave = async () => {
    setSaving(true);
    saveTelegramConfig(config);
    // Also save to server-side DB for cron-based notifications
    try {
      await fetch("/api/telegram/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: config.botToken,
          chatId: config.chatId,
          enabled: config.enabled,
          threshold: 75,
          label: "My Telegram",
        }),
      });
    } catch (e) {
      console.warn("Failed to save subscriber server-side:", e);
    }
    setTimeout(() => {
      setSaving(false);
      toast.success(t.telegram.saved + (config.enabled ? " ✅ " + (lang === "fa" ? "الان به‌صورت خودکار هم سیگنال می‌گیری" : "Auto-sending enabled") : ""));
    }, 400);
  };

  // When toggling enabled state, also update server
  const handleToggle = async (checked: boolean) => {
    const next = { ...config, enabled: checked };
    setConfig(next);
    saveTelegramConfig(next);
    try {
      await fetch("/api/telegram/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: config.botToken,
          chatId: config.chatId,
          enabled: checked,
          threshold: 75,
          label: "My Telegram",
        }),
      });
    } catch (e) {
      console.warn("Failed to update subscriber:", e);
    }
    if (checked) {
      toast.success(t.telegram.title + " " + t.telegram.connected + " ✈️");
    }
  };

  const handleTest = async () => {
    if (!config.botToken || !config.chatId) {
      toast.error(t.telegram.testFailed + "Bot Token & Chat ID required");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: config.botToken, chatId: config.chatId }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t.telegram.testSuccess);
      } else {
        toast.error(t.telegram.testFailed + (data.message || data.error || "Unknown"));
      }
    } catch (err) {
      toast.error(t.telegram.testFailed + String(err));
    } finally {
      setTesting(false);
    }
  };

  const isConnected = config.enabled && config.botToken && config.chatId;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-blue-500/5 pointer-events-none" />
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${isConnected ? "from-sky-500 to-blue-600" : "from-muted to-muted-foreground/20"} text-white`}>
              <Send className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                {t.telegram.title}
                {isConnected ? (
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-500 border-0">
                    <CheckCircle2 className="h-3 w-3" />
                    {t.telegram.connected}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">{t.telegram.disconnected}</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">{t.telegram.titleDesc}</CardDescription>
            </div>
          </div>
          <Switch checked={config.enabled} onCheckedChange={handleToggle} aria-label="Toggle Telegram" />
        </div>
      </CardHeader>
      <CardContent className="relative space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="tg-token" className="text-xs">
            {t.telegram.botToken}
          </Label>
          <Input
            id="tg-token"
            type="password"
            value={config.botToken}
            onChange={(e) => setConfig((c) => ({ ...c, botToken: e.target.value }))}
            placeholder={t.telegram.botTokenPlaceholder}
            dir="ltr"
            className="text-xs"
            autoComplete="off"
          />
          <p className="text-[10px] text-muted-foreground">{t.telegram.getBotToken}</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tg-chat" className="text-xs">
            {t.telegram.chatId}
          </Label>
          <Input
            id="tg-chat"
            type="text"
            value={config.chatId}
            onChange={(e) => setConfig((c) => ({ ...c, chatId: e.target.value }))}
            placeholder={t.telegram.chatIdPlaceholder}
            dir="ltr"
            className="text-xs"
            autoComplete="off"
          />
          <p className="text-[10px] text-muted-foreground">{t.telegram.getChatId}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving} variant="outline" className="text-xs">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            {t.telegram.save}
          </Button>
          <Button size="sm" onClick={handleTest} disabled={testing || !config.botToken || !config.chatId} className="text-xs">
            {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            {testing ? t.telegram.testing : t.telegram.test}
          </Button>
        </div>

        <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-2.5 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">{t.telegram.enableHint}</p>
        </div>

        {isConnected && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {lang === "fa"
                ? "✅ شما ثبت شدید. سرور هر ساعت اخبار رو تحلیل می‌کنه و در صورت داشتن سیگنال قوی، به تلگرامت می‌فرسته — حتی وقتی آنلاین نیستی."
                : "✅ You're subscribed. Server checks every hour for strong signals and sends them to your Telegram — even when you're offline."}
            </p>
          </div>
        )}

        <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs h-7 w-full justify-between">
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                {t.telegram.helpTitle}
              </span>
              {helpOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1.5 pt-2">
            {[t.telegram.helpStep1, t.telegram.helpStep2, t.telegram.helpStep3, t.telegram.helpStep4, t.telegram.helpStep5].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                <span className="text-sky-500">→</span>
                <span>{step}</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-sky-500 hover:underline"
              >
                @BotFather <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <a
                href="https://t.me/userinfobot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-sky-500 hover:underline"
              >
                @userinfobot <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
