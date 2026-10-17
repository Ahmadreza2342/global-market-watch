import { NextRequest, NextResponse } from "next/server";
import { fetchTopTraders } from "@/lib/mt5";
import { getCached, setCached, todayKey } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get("force") === "1";
  const date = todayKey();
  const cacheKey = "traders";

  if (!force) {
    const cached = await getCached<{ traders: Awaited<ReturnType<typeof fetchTopTraders>>; generatedAt: string }>(date, cacheKey);
    if (cached) return NextResponse.json({ ...cached, cached: true });
  }

  try {
    const traders = await fetchTopTraders();
    const payload = { traders, generatedAt: new Date().toISOString() };
    await setCached(date, cacheKey, payload);
    return NextResponse.json({ ...payload, cached: false });
  } catch (err) {
    console.error("[/api/traders] error:", err);
    return NextResponse.json({ error: "Failed to fetch traders", detail: String(err) }, { status: 500 });
  }
}
