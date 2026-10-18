// Client-side Telegram helper used by the live-alerts widget
// to automatically push strong signals to the user's Telegram chat.

import { toPersianDigits } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
}

const STORAGE_KEY = "gmw_telegram_config";

export function loadTelegramConfig(): TelegramConfig {
  if (typeof window === "undefined") return { enabled: false, botToken: "", chatId: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: false, botToken: "", chatId: "" };
    const parsed = JSON.parse(raw) as Partial<TelegramConfig>;
    return {
      enabled: !!parsed.enabled,
      botToken: parsed.botToken || "",
      chatId: parsed.chatId || "",
    };
  } catch {
    return { enabled: false, botToken: "", chatId: "" };
  }
}

export function saveTelegramConfig(cfg: TelegramConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

export interface SignalAlertData {
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

function formatNumber(value: number | string, lang: Lang): string {
  const num = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString(lang === "fa" ? "fa-IR" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildTelegramMessage(alert: SignalAlertData, lang: Lang): string {
  const dirEmoji = alert.direction === "long" ? "🟢" : alert.direction === "short" ? "🔴" : "⚪";
  const dirLabel =
    alert.direction === "long"
      ? lang === "fa" ? "خرید" : "BUY"
      : alert.direction === "short"
      ? lang === "fa" ? "فروش" : "SELL"
      : lang === "fa" ? "خنثی" : "NEUTRAL";

  const brand = lang === "fa" ? "دیدبان طلا" : "Gold Sentinel";
  const labels = lang === "fa"
    ? { symbol: "نماد", tf: "تایم‌فریم", dir: "جهت", str: "قدرت", entry: "نقطه ورود", tp: "حد سود", sl: "حد ضرر", reason: "دلیل", time: "زمان" }
    : { symbol: "Symbol", tf: "Timeframe", dir: "Direction", str: "Strength", entry: "Entry", tp: "Take Profit", sl: "Stop Loss", reason: "Reason", time: "Time" };

  const time = new Date(alert.triggeredAt).toLocaleString(lang === "fa" ? "fa-IR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });

  return `${dirEmoji} <b>${dirLabel}</b> — ${brand}

<b>${labels.symbol}:</b> ${alert.symbol}
<b>${labels.tf}:</b> ${alert.timeframe.toUpperCase()}
<b>${labels.dir}:</b> ${dirLabel}
<b>${labels.str}:</b> ${lang === "fa" ? toPersianDigits(alert.strength) : alert.strength}/100

<b>${labels.entry}:</b> $${formatNumber(alert.entry, lang)}
<b>${labels.tp}:</b> $${formatNumber(alert.takeProfit, lang)}
<b>${labels.sl}:</b> $${formatNumber(alert.stopLoss, lang)}

<b>${labels.reason}:</b>
${alert.reason}

<b>${labels.time}:</b> ${time}`;
}

export async function sendSignalToTelegram(
  alert: SignalAlertData,
  lang: Lang = "fa"
): Promise<{ ok: boolean; error?: string }> {
  const cfg = loadTelegramConfig();
  if (!cfg.enabled || !cfg.botToken || !cfg.chatId) {
    return { ok: false, error: "Telegram not enabled" };
  }

  const text = buildTelegramMessage(alert, lang);

  try {
    const res = await fetch("/api/telegram/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        botToken: cfg.botToken,
        chatId: cfg.chatId,
        text,
        parseMode: "HTML",
      }),
    });
    const data = await res.json();
    if (data.ok) return { ok: true };
    return { ok: false, error: data.message || data.error || "Telegram send failed" };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ============ SERVER-SIDE: Telegram Bot API direct call ============

export async function sendTelegramMessageDirect(
  botToken: string,
  chatId: string,
  text: string,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<{ ok: boolean; error?: string }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: "true",
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `Telegram API ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json();
    if (data.ok !== true) {
      return { ok: false, error: data?.description || "Unknown Telegram error" };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
