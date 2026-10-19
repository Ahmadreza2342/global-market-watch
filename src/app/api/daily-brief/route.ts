import { NextRequest } from "next/server";
import { fetchDailyNews, generateDailyBrief } from "@/lib/market";
import { getCached, setCached, hourlyKey } from "@/lib/cache";
import { noCacheJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const cacheKey = "daily_brief";
  // Hourly cache: news changes ~hourly; also depends on time of day
  const hourKey = hourlyKey();

  if (!force) {
    const cached = await getCached<{
      brief: Awaited<ReturnType<typeof generateDailyBrief>>;
      news: Awaited<ReturnType<typeof fetchDailyNews>>;
      generatedAt: string;
    }>(hourKey, cacheKey);
    if (cached) {
      return noCacheJson({ ...cached, cached: true });
    }
  }

  try {
    const news = await fetchDailyNews();
    const brief = await generateDailyBrief(news);
    const payload = {
      brief,
      news,
      generatedAt: new Date().toISOString(),
    };
    await setCached(hourKey, cacheKey, payload);
    return noCacheJson({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/daily-brief] error:", err);
    return noCacheJson(
      { error: "Failed to generate daily brief", detail: String(err) },
      500
    );
  }
}
