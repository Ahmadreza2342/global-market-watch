import { NextRequest, NextResponse } from "next/server";
import { fetchDailyNews, generateDailyBrief } from "@/lib/market";
import { getCached, setCached, todayKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const date = todayKey();
  const cacheKey = "daily_brief";

  if (!force) {
    const cached = await getCached<{
      brief: Awaited<ReturnType<typeof generateDailyBrief>>;
      news: Awaited<ReturnType<typeof fetchDailyNews>>;
      generatedAt: string;
    }>(date, cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
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
    await setCached(date, cacheKey, payload);
    return NextResponse.json({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/daily-brief] error:", err);
    return NextResponse.json(
      { error: "Failed to generate daily brief", detail: String(err) },
      { status: 500 }
    );
  }
}
