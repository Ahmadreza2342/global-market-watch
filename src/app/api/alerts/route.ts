import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db, ensureDbInitialized } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDbInitialized();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ alerts: [] }, { status: 200 });
    const alerts = await db.alert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("[/api/alerts GET] error:", err);
    return NextResponse.json({ alerts: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { symbol, condition, threshold, note } = body as {
      symbol?: string;
      condition?: string;
      threshold?: string;
      note?: string;
    };
    if (!symbol || !condition || !threshold) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }
    const alert = await db.alert.create({
      data: {
        userId: user.id,
        symbol,
        condition,
        threshold,
        note: note || null,
      },
    });
    return NextResponse.json({ alert }, { status: 201 });
  } catch (err) {
    console.error("[/api/alerts POST] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });
    await db.alert.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/alerts DELETE] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
