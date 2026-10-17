import { NextRequest, NextResponse } from "next/server";
import { fetchMarketIndicators, generateDailyBrief, generateTradingSignals, fetchDailyNews } from "@/lib/market";
import { getCached, setCached, todayKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const date = todayKey();
  const cacheKey = "signals";

  if (!force) {
    const cached = await getCached<{
      signals: Awaited<ReturnType<typeof generateTradingSignals>>;
      generatedAt: string;
    }>(date, cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }
  }

  try {
    // Try to reuse cached indicators/brief; otherwise fetch fresh
    const cachedIndicators = await getCached<{ indicators: Awaited<ReturnType<typeof fetchMarketIndicators>> }>(date, "indicators");
    const cachedBrief = await getCached<{ brief: Awaited<ReturnType<typeof generateDailyBrief>> }>(date, "daily_brief");

    let indicators = cachedIndicators?.indicators;
    let brief = cachedBrief?.brief;

    if (!indicators) indicators = await fetchMarketIndicators();
    if (!brief) {
      const news = await fetchDailyNews();
      brief = await generateDailyBrief(news);
    }

    const signals = await generateTradingSignals(indicators, brief);
    const payload = { signals, generatedAt: new Date().toISOString() };
    await setCached(date, cacheKey, payload);
    return NextResponse.json({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/signals] error:", err);
    return NextResponse.json(
      { error: "Failed to generate signals", detail: String(err) },
      { status: 500 }
    );
  }
}
