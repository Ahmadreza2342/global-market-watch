import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";

export const runtime = "nodejs";

// POST: Save/update subscriber
export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const body = await req.json().catch(() => ({}));
    const { botToken, chatId, label, enabled, threshold } = body as {
      botToken?: string;
      chatId?: string;
      label?: string;
      enabled?: boolean;
      threshold?: number;
    };

    if (!botToken || !chatId) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    // Find existing subscriber by botToken+chatId
    const existing = await db.telegramSubscriber.findFirst({
      where: { botToken, chatId },
    });

    let subscriber;
    if (existing) {
      subscriber = await db.telegramSubscriber.update({
        where: { id: existing.id },
        data: {
          enabled: enabled ?? true,
          threshold: threshold ?? existing.threshold ?? 75,
          label: label ?? existing.label,
          updatedAt: new Date(),
        },
      });
    } else {
      subscriber = await db.telegramSubscriber.create({
        data: {
          botToken,
          chatId,
          label: label || null,
          enabled: enabled ?? true,
          threshold: threshold ?? 75,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ ok: true, id: subscriber.id, enabled: subscriber.enabled });
  } catch (err) {
    console.error("[/api/telegram/subscribe POST] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE: Remove subscriber
export async function DELETE(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const botToken = req.nextUrl.searchParams.get("botToken");
    const chatId = req.nextUrl.searchParams.get("chatId");
    if (!botToken || !chatId) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    await db.telegramSubscriber.deleteMany({
      where: { botToken, chatId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/telegram/subscribe DELETE] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET: List subscribers (admin/debug)
export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
    const adminToken = req.nextUrl.searchParams.get("adminToken");
    if (adminToken !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const subscribers = await db.telegramSubscriber.findMany({
      where: { enabled: true },
    });
    // Mask tokens for safety
    const masked = subscribers.map((s) => ({
      id: s.id,
      chatId: s.chatId,
      label: s.label,
      enabled: s.enabled,
      threshold: s.threshold,
      botTokenMasked: s.botToken.slice(0, 10) + "..." + s.botToken.slice(-4),
      lastSentAt: s.lastSentAt,
    }));
    return NextResponse.json({ subscribers: masked });
  } catch (err) {
    console.error("[/api/telegram/subscribe GET] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
