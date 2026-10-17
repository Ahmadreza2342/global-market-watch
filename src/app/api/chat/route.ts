import { NextRequest, NextResponse } from "next/server";
import { analyzeJSONWithFallback as _unused } from "@/lib/market";
import { analyzeText, analyzeJSON } from "@/lib/zai";
import { callGemini, isGeminiConfigured } from "@/lib/gemini";
import { AURUM_SYSTEM_PROMPT, AURUM_AVATAR, AURUM_NAME_FA, AURUM_NAME_EN } from "@/lib/aurum";
import { fetchQuote } from "@/lib/yahoo";
import { getCached, todayKey } from "@/lib/cache";

export const runtime = "nodejs";
export const maxDuration = 45;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  lang?: "fa" | "en";
}

// Helper to fetch current market context for Aurum
async function buildMarketContext(): Promise<string> {
  const lines: string[] = [];

  // Current prices
  const quotes = await Promise.all([
    fetchQuote("XAU/USD").catch(() => null),
    fetchQuote("WTI/USD").catch(() => null),
    fetchQuote("DXY").catch(() => null),
    fetchQuote("US10Y").catch(() => null),
  ]);

  const [gold, oil, dxy, treasury] = quotes;
  if (gold) lines.push(`- Gold (XAU/USD): $${gold.price.toFixed(2)} (${gold.changePercent >= 0 ? "+" : ""}${gold.changePercent.toFixed(2)}% today)`);
  if (oil) lines.push(`- Crude Oil (WTI/USD): $${oil.price.toFixed(2)} (${oil.changePercent >= 0 ? "+" : ""}${oil.changePercent.toFixed(2)}% today)`);
  if (dxy) lines.push(`- US Dollar Index (DXY): ${dxy.price.toFixed(2)} (${dxy.changePercent >= 0 ? "+" : ""}${dxy.changePercent.toFixed(2)}% today)`);
  if (treasury) lines.push(`- 10Y Treasury Yield: ${treasury.price.toFixed(2)}%`);

  // Latest cached brief
  try {
    const cached = await getCached<{ brief: { title: string; summary: string; sentiment: string; confidence: number }; news: Array<{ title: string; category: string; impact: string }> }>(todayKey(), "daily_brief");
    if (cached?.brief) {
      lines.push("");
      lines.push(`Today's market brief: "${cached.brief.title}"`);
      lines.push(`Sentiment: ${cached.brief.sentiment} (confidence: ${cached.brief.confidence}%)`);
      if (cached.news && cached.news.length > 0) {
        lines.push("Top news headlines:");
        for (const n of cached.news.slice(0, 5)) {
          lines.push(`  - [${n.category}/${n.impact}] ${n.title}`);
        }
      }
    }
  } catch {
    // ignore
  }

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const lang = (req.nextUrl.searchParams.get("lang") as "fa" | "en") || "fa";
  const body = (await req.json().catch(() => ({}))) as ChatRequestBody;

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "MESSAGES_REQUIRED" }, { status: 400 });
  }

  // Take last 6 messages (memory window)
  const recent = body.messages.slice(-6);

  // Build context: current market data + today's brief
  const marketContext = await buildMarketContext();

  const systemPrompt = `${AURUM_SYSTEM_PROMPT}

CURRENT MARKET CONTEXT (live data, use this when answering):
${marketContext}

USER LANGUAGE: ${lang === "fa" ? "Persian (Farsi) — respond in Persian" : "English"}

When responding:
- Use the live market data above when relevant
- Be concise (2-5 sentences typically)
- If asked about specific price levels, reference the current prices
- If asked "should I buy/sell", give a clear opinion with risk levels
- Always end with: "— ${lang === "fa" ? AURUM_NAME_FA : AURUM_NAME_EN} ${AURUM_AVATAR}"`;

  // Convert to Gemini/Z.AI format
  const llmMessages = [
    { role: "system" as const, content: systemPrompt },
    ...recent.map((m) => ({
      role: m.role === "assistant" ? "assistant" as const : "user" as const,
      content: m.content,
    })),
  ];

  try {
    let response = "";

    // Try Z.AI first (works in sandbox)
    try {
      const zaiText = await analyzeText(systemPrompt, recent.map((m) => `${m.role}: ${m.content}`).join("\n\n"), { temperature: 0.7 });
      if (zaiText) response = zaiText;
    } catch (e) {
      console.error("[chat] Z.AI failed:", e);
    }

    // Fall back to Gemini
    if (!response && isGeminiConfigured()) {
      const geminiText = await callGemini(
        systemPrompt,
        recent.map((m) => `${m.role === "user" ? "User" : "Aurum"}: ${m.content}`).join("\n\n"),
        { temperature: 0.7, maxOutputTokens: 800 }
      );
      response = geminiText;
    }

    if (!response) {
      return NextResponse.json({
        response: lang === "fa"
          ? `${AURUM_AVATAR} متأسفم، الان نمی‌تونم پاسخ بدم. یه چند ثانیه دیگه دوباره امتحان کن.`
          : `${AURUM_AVATAR} Sorry, I couldn't generate a response right now. Please try again in a moment.`,
      });
    }

    return NextResponse.json({
      response,
      aurumName: lang === "fa" ? AURUM_NAME_FA : AURUM_NAME_EN,
      avatar: AURUM_AVATAR,
      marketContext: marketContext.slice(0, 500),
    });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Force dynamic
export const dynamic = "force-dynamic";
