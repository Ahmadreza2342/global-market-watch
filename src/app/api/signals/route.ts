import { NextRequest } from "next/server";
import { fetchMarketIndicators, generateDailyBrief, generateTradingSignals, fetchDailyNews } from "@/lib/market";
import { getCached, setCached, hourlyKey } from "@/lib/cache";
import { noCacheJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const hourKey = hourlyKey();
  const cacheKey = "signals";

  if (!force) {
    const cached = await getCached<{
      signals: Awaited<ReturnType<typeof generateTradingSignals>>;
      generatedAt: string;
    }>(hourKey, cacheKey);
    if (cached) return noCacheJson({ ...cached, cached: true });
  }

  try {
    // Reuse cached indicators + brief
    const cachedIndicators = await getCached<{ indicators: Awaited<ReturnType<typeof fetchMarketIndicators>> }>(hourKey, "indicators");
    const cachedBrief = await getCached<{ brief: Awaited<ReturnType<typeof generateDailyBrief>> }>(hourKey, "daily_brief");

    let indicators = cachedIndicators?.indicators;
    let brief = cachedBrief?.brief;

    if (!indicators) indicators = await fetchMarketIndicators();
    if (!brief) {
      const news = await fetchDailyNews();
      brief = await generateDailyBrief(news);
    }

    const signals = await generateTradingSignals(indicators, brief);
    const payload = { signals, generatedAt: new Date().toISOString() };
    await setCached(hourKey, cacheKey, payload);
    return noCacheJson({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/signals] error:", err);
    return noCacheJson({ error: "Failed to generate signals", detail: String(err) }, 500);
  }
}
