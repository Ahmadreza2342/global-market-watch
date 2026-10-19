import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { noCacheJson } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await ensureDbInitialized();
    const history = await db.signalHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return noCacheJson({ history });
  } catch (err) {
    console.error("[/api/signal-history GET] error:", err);
    return noCacheJson({ history: [] });
  }
}

export async function DELETE() {
  try {
    await ensureDbInitialized();
    await db.signalHistory.deleteMany({});
    return noCacheJson({ ok: true });
  } catch (err) {
    console.error("[/api/signal-history DELETE] error:", err);
    return noCacheJson({ ok: false, error: String(err) }, 500);
  }
}
