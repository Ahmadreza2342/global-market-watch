import { NextRequest } from "next/server";
import { fetchEconomicCalendar } from "@/lib/market";
import { getCached, setCached, hourlyKey } from "@/lib/cache";
import { noCacheJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const hourKey = hourlyKey();
  const cacheKey = "calendar";

  if (!force) {
    const cached = await getCached<{
      events: Awaited<ReturnType<typeof fetchEconomicCalendar>>;
      generatedAt: string;
    }>(hourKey, cacheKey);
    if (cached) return noCacheJson({ ...cached, cached: true });
  }

  try {
    const events = await fetchEconomicCalendar();
    const payload = { events, generatedAt: new Date().toISOString() };
    await setCached(hourKey, cacheKey, payload);
    return noCacheJson({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/calendar] error:", err);
    return noCacheJson({ error: "Failed to fetch calendar", detail: String(err) }, 500);
  }
}
