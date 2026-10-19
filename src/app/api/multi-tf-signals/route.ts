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

    // Get cached prices from indicators (so signals use real price even if Yahoo OHLC fails)
    const indCache = await getCached<{ indicators: { goldPrice?: { value: string }; oilPrice?: { value: string }; } }>(hourlyKey(), "indicators");
    const priceCache: Record<string, number> = {};
    const goldVal = indCache?.indicators?.goldPrice?.value;
    if (goldVal && goldVal !== "—") {
      priceCache["XAU/USD"] = parseFloat(goldVal.replace(/[^0-9.]/g, ""));
    }
    const oilVal = indCache?.indicators?.oilPrice?.value;
    if (oilVal && oilVal !== "—") {
      priceCache["WTI/USD"] = parseFloat(oilVal.replace(/[^0-9.]/g, ""));
    }

    // If WTI price is missing from cache, try fetching it directly
    if (!priceCache["WTI/USD"]) {
      try {
        const { fetchQuote } = await import("@/lib/yahoo");
        const wtiQuote = await fetchQuote("WTI/USD");
        if (wtiQuote && wtiQuote.price > 0) {
          priceCache["WTI/USD"] = wtiQuote.price;
        }
      } catch (e) {
        console.error("[multi-tf] Failed to fetch WTI quote directly:", e);
      }
    }

    // If gold price is also missing, try fetching directly
    if (!priceCache["XAU/USD"]) {
      try {
        const { fetchQuote } = await import("@/lib/yahoo");
        const goldQuote = await fetchQuote("XAU/USD");
        if (goldQuote && goldQuote.price > 0) {
          priceCache["XAU/USD"] = goldQuote.price;
        }
      } catch (e) {
        console.error("[multi-tf] Failed to fetch gold quote directly:", e);
      }
    }

    const signals = await generateMultiTfSignals(traders || [], undefined, priceCache);

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
