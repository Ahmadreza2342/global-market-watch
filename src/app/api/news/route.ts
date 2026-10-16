import { NextRequest, NextResponse } from "next/server";
import { fetchDailyNews } from "@/lib/market";
import { getCached, setCached, todayKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const date = todayKey();
  const cacheKey = "daily_brief";

  // News is bundled inside the daily_brief cache to save API calls
  if (!force) {
    const cached = await getCached<{
      news: Awaited<ReturnType<typeof fetchDailyNews>>;
    }>(date, cacheKey);
    if (cached?.news) {
      return NextResponse.json({ news: cached.news, cached: true });
    }
  }

  try {
    const news = await fetchDailyNews();
    await setCached(date, cacheKey, { news });
    return NextResponse.json({ news, cached: false });
  } catch (err) {
    console.error("[/api/news] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch news", detail: String(err) },
      { status: 500 }
    );
  }
}
