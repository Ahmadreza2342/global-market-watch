import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbInitialized();
    const history = await db.signalHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ history });
  } catch (err) {
    console.error("[/api/signal-history GET] error:", err);
    return NextResponse.json({ history: [] });
  }
}

export async function DELETE() {
  try {
    await ensureDbInitialized();
    await db.signalHistory.deleteMany({});
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/signal-history DELETE] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
