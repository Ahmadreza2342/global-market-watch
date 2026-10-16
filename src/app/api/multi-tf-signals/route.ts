import { NextRequest, NextResponse } from "next/server";
import { fetchTopTraders, generateMultiTfSignals, type MultiTfSignal } from "@/lib/mt5";
import { getCached, setCached, todayKey } from "@/lib/cache";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const hourKey = `${todayKey()}-${new Date().getHours()}`;
  const cacheKey = "multi_tf_signals";

  if (!force) {
    const cached = await getCached<{ signals: MultiTfSignal[]; generatedAt: string }>(hourKey, cacheKey);
    if (cached) return NextResponse.json({ ...cached, cached: true });
  }

  try {
    // Get traders (cached)
    const traderCache = await getCached<{ traders: Awaited<ReturnType<typeof fetchTopTraders>> }>(todayKey(), "traders");
    let traders = traderCache?.traders;
    if (!traders) traders = await fetchTopTraders();

    const signals = await generateMultiTfSignals(traders || []);

    // Persist strong signals to SignalHistory
    for (const s of signals) {
      if (s.strength >= 75 && s.direction !== "neutral") {
        await db.signalHistory.create({
          data: {
            symbol: s.symbol,
            timeframe: s.timeframe,
            direction: s.direction,
            strength: s.strength,
            entry: String(s.entry),
            takeProfit: String(s.takeProfit),
            stopLoss: String(s.stopLoss),
            source: "composite",
            reason: s.reason.slice(0, 500),
          },
        }).catch(() => {}); // ignore DB errors
      }
    }

    const payload = { signals, generatedAt: new Date().toISOString() };
    await setCached(hourKey, cacheKey, payload);
    return NextResponse.json({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/multi-tf-signals] error:", err);
    return NextResponse.json({ error: "Failed to generate signals", detail: String(err) }, { status: 500 });
  }
}
