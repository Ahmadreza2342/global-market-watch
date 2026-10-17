import { NextRequest, NextResponse } from "next/server";
import { fetchEconomicCalendar } from "@/lib/market";
import { getCached, setCached, todayKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const date = todayKey();
  const cacheKey = "calendar";

  if (!force) {
    const cached = await getCached<{
      events: Awaited<ReturnType<typeof fetchEconomicCalendar>>;
      generatedAt: string;
    }>(date, cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }
  }

  try {
    const events = await fetchEconomicCalendar();
    const payload = { events, generatedAt: new Date().toISOString() };
    await setCached(date, cacheKey, payload);
    return NextResponse.json({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/calendar] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch calendar", detail: String(err) },
      { status: 500 }
    );
  }
}
