import { NextRequest, NextResponse } from "next/server";
import { fetchMarketIndicators } from "@/lib/market";
import { getCached, setCached, todayKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const date = todayKey();
  const cacheKey = "indicators";

  if (!force) {
    const cached = await getCached<{
      indicators: Awaited<ReturnType<typeof fetchMarketIndicators>>;
      generatedAt: string;
    }>(date, cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }
  }

  try {
    const indicators = await fetchMarketIndicators();
    const payload = { indicators, generatedAt: new Date().toISOString() };
    await setCached(date, cacheKey, payload);
    return NextResponse.json({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/indicators] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch indicators", detail: String(err) },
      { status: 500 }
    );
  }
}
