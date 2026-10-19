import { NextRequest } from "next/server";
import { fetchMarketIndicators } from "@/lib/market";
import { getCached, setCached, hourlyKey } from "@/lib/cache";
import { noCacheJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const cacheKey = "indicators";
  const hourKey = hourlyKey(); // changes every hour

  // Use hourly cache key + check TTL (15 min) inside getCached
  // So price is freshened at least every 15 minutes
  if (!force) {
    const cached = await getCached<{
      indicators: Awaited<ReturnType<typeof fetchMarketIndicators>>;
      generatedAt: string;
    }>(hourKey, cacheKey);
    if (cached) {
      return noCacheJson({ ...cached, cached: true });
    }
  }

  try {
    const indicators = await fetchMarketIndicators();
    const payload = { indicators, generatedAt: new Date().toISOString() };
    await setCached(hourKey, cacheKey, payload);
    return noCacheJson({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/indicators] error:", err);
    return noCacheJson(
      { error: "Failed to fetch indicators", detail: String(err) },
      500
    );
  }
}
