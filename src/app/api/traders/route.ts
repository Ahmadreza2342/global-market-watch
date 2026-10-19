import { NextRequest } from "next/server";
import { fetchTopTraders } from "@/lib/mt5";
import { getCached, setCached, hourlyKey } from "@/lib/cache";
import { noCacheJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const hourKey = hourlyKey();
  const cacheKey = "traders";

  if (!force) {
    const cached = await getCached<{ traders: Awaited<ReturnType<typeof fetchTopTraders>>; generatedAt: string }>(hourKey, cacheKey);
    if (cached) return noCacheJson({ ...cached, cached: true });
  }

  try {
    const traders = await fetchTopTraders();
    const payload = { traders, generatedAt: new Date().toISOString() };
    await setCached(hourKey, cacheKey, payload);
    return noCacheJson({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/traders] error:", err);
    return noCacheJson({ error: "Failed to fetch traders", detail: String(err) }, 500);
  }
}
