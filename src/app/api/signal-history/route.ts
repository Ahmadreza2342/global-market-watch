import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const history = await db.signalHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ history });
}

export async function DELETE() {
  await db.signalHistory.deleteMany({});
  return NextResponse.json({ ok: true });
}
