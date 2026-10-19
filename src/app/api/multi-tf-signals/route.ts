import { NextRequest } from "next/server";
import { fetchTopTraders, generateMultiTfSignals, type MultiTfSignal } from "@/lib/mt5";
import { getCached, setCached, hourlyKey } from "@/lib/cache";
import { db, ensureDbInitialized } from "@/lib/db";
import { noCacheJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const cacheKey = "multi_tf_signals";
  const hourKey = `${hourlyKey()}-${Math.floor(new Date().getMinutes() / 15)}`; // 15-min cache key

  if (!force) {
    const cached = await getCached<{ signals: MultiTfSignal[]; generatedAt: string }>(hourKey, cacheKey);
    if (cached) return noCacheJson({ ...cached, cached: true });
  }

  try {
    await ensureDbInitialized();
    // Get traders (cached)
    const traderCache = await getCached<{ traders: Awaited<ReturnType<typeof fetchTopTraders>> }>(hourlyKey(), "traders");
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
        }).catch((e) => console.error("[multi-tf] DB write error:", e));
      }
    }

    const payload = { signals, generatedAt: new Date().toISOString() };
    await setCached(hourKey, cacheKey, payload);
    return noCacheJson({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/multi-tf-signals] error:", err);
    return noCacheJson({ error: "Failed to generate signals", detail: String(err) }, 500);
  }
}
