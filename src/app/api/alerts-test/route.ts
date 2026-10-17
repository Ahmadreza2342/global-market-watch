import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";

export const runtime = "nodejs";

// Endpoint for testing notifications - creates a fake strong alert
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
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    console.error("[/api/alerts-test] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
