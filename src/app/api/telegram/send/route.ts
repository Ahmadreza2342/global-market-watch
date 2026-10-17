import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SendBody {
  botToken?: string;
  chatId?: string;
  text?: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as SendBody;
  const { botToken, chatId, text, parseMode } = body;

  if (!botToken || !chatId || !text) {
    return NextResponse.json(
      { ok: false, error: "MISSING_FIELDS", message: "botToken, chatId, and text are required" },
      { status: 400 }
    );
  }

  // Validate token format (basic check)
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(botToken)) {
    return NextResponse.json(
      { ok: false, error: "INVALID_TOKEN", message: "Bot token format looks invalid" },
      { status: 400 }
    );
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload: Record<string, string> = {
      chat_id: chatId,
      text,
      disable_web_page_preview: "true",
    };
    if (parseMode) payload.parse_mode = parseMode;

    const tgRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const tgData = await tgRes.json().catch(() => ({}));

    if (!tgRes.ok || tgData.ok !== true) {
      return NextResponse.json(
        {
          ok: false,
          error: "TELEGRAM_API_ERROR",
          message: tgData?.description || `Telegram API returned ${tgRes.status}`,
          telegramResponse: tgData,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, messageId: tgData.result?.message_id });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "NETWORK_ERROR", message: String(err) },
      { status: 500 }
    );
  }
}
