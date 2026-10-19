import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { noCacheJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Endpoint for testing notifications — creates a fake strong alert
// (no user authentication required, just a test endpoint)
export async function POST() {
  try {
    await ensureDbInitialized();
    const item = await db.signalHistory.create({
      data: {
        symbol: "XAU/USD",
        timeframe: "1h",
        direction: "long",
        strength: 88,
        entry: "2475.50",
        takeProfit: "2495.00",
        stopLoss: "2465.00",
        source: "composite",
        reason: "TEST ALERT — strong composite signal (RSI oversold + bullish MACD cross + positive news bias + top traders aligned).",
      },
    });
    return noCacheJson({ ok: true, item }, 201);
  } catch (err) {
    console.error("[/api/alerts-test] error:", err);
    return noCacheJson({ ok: false, error: String(err) }, 500);
  }
}
