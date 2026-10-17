import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { fetchTopTraders, generateMultiTfSignals, type MultiTfSignal } from "@/lib/mt5";
import { sendTelegramMessageDirect, buildTelegramMessage } from "@/lib/telegram";
import { getCached, setCached, todayKey } from "@/lib/cache";

export const runtime = "nodejs";
export const maxDuration = 60;

// Vercel Cron Job — runs hourly via GitHub Actions
// Lightweight version: uses cached daily data (news/brief/indicators/traders)
// Only generates fresh multi-TF signals and checks for strong ones to send

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  const authorized = !cronSecret || authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
  if (!authorized) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const log: string[] = [];
  log.push(`[${startedAt}] Cron started`);

  try {
    await ensureDbInitialized();

    // Step 1: Get cached traders (no fresh fetch)
    log.push("Step 1: Loading traders from cache");
    const cachedTraders = await getCached<{ traders: Awaited<ReturnType<typeof fetchTopTraders>> }>(todayKey(), "traders");
    let traders = cachedTraders?.traders;
    if (!traders) {
      // Fallback: fetch fresh (shouldn't happen during normal operation)
      traders = await fetchTopTraders();
      await setCached(todayKey(), "traders", { traders, generatedAt: startedAt });
    }
    log.push(`  - ${traders.length} traders loaded`);

    // Step 2: Generate fresh multi-TF signals (this is the main work)
    log.push("Step 2: Generating multi-TF signals");
    const signals: MultiTfSignal[] = await generateMultiTfSignals(traders);
    log.push(`  - Generated ${signals.length} signals`);

    // Show what we got
    for (const s of signals) {
      log.push(`    ${s.symbol} ${s.timeframe}: ${s.direction} strength=${s.strength}`);
    }

    // Step 3: Find strong signals (>=70)
    const strongSignals = signals.filter((s) => s.strength >= 70 && s.direction !== "neutral");
    log.push(`Step 3: ${strongSignals.length} strong signals (>=70)`);

    if (strongSignals.length === 0) {
      log.push("✅ No strong signals today");
      return NextResponse.json({
        ok: true,
        startedAt,
        finishedAt: new Date().toISOString(),
        signalsGenerated: signals.length,
        strongSignals: 0,
        signalsSent: 0,
        log,
      });
    }

    // Step 4: Get subscribers
    const subscribers = await db.telegramSubscriber.findMany({
      where: { enabled: true },
    });
    log.push(`Step 4: ${subscribers.length} subscribers`);

    if (subscribers.length === 0) {
      log.push("  No subscribers — exiting");
      return NextResponse.json({
        ok: true,
        startedAt,
        signalsGenerated: signals.length,
        strongSignals: strongSignals.length,
        signalsSent: 0,
        log,
      });
    }

    // Step 5: For each strong signal, dedupe + send
    log.push("Step 5: Processing strong signals");
    let sentCount = 0;
    let duplicateCount = 0;
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    for (const signal of strongSignals) {
      // Deduplication
      const recentDup = await db.signalHistory.findFirst({
        where: {
          symbol: signal.symbol,
          timeframe: signal.timeframe,
          direction: signal.direction,
          strength: { gte: signal.strength - 5 },
          createdAt: { gt: twoHoursAgo },
        },
      });

      if (recentDup) {
        duplicateCount++;
        log.push(`  - SKIPPED duplicate ${signal.symbol} ${signal.timeframe} (sent at ${recentDup.createdAt.toISOString()})`);
        continue;
      }

      // Save to SignalHistory
      const saved = await db.signalHistory.create({
        data: {
          symbol: signal.symbol,
          timeframe: signal.timeframe,
          direction: signal.direction,
          strength: signal.strength,
          entry: String(signal.entry),
          takeProfit: String(signal.takeProfit),
          stopLoss: String(signal.stopLoss),
          source: "composite",
          reason: signal.reason.slice(0, 500),
        },
      });

      // Send to subscribers whose threshold is met
      const matchingSubs = subscribers.filter((s) => signal.strength >= s.threshold);
      if (matchingSubs.length === 0) {
        log.push(`  - ${signal.symbol} ${signal.timeframe} strength=${signal.strength} (no matching subs)`);
        continue;
      }

      const alertData = {
        id: saved.id,
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        direction: signal.direction as "long" | "short",
        strength: signal.strength,
        entry: signal.entry,
        takeProfit: signal.takeProfit,
        stopLoss: signal.stopLoss,
        reason: signal.reason,
        triggeredAt: saved.createdAt.toISOString(),
      };

      const message = buildTelegramMessage(alertData, "fa");
      let successCount = 0;

      for (const sub of matchingSubs) {
        const result = await sendTelegramMessageDirect(sub.botToken, sub.chatId, message, "HTML");
        if (result.ok) {
          successCount++;
          await db.telegramSubscriber.update({
            where: { id: sub.id },
            data: { lastSentAt: new Date() },
          });
        } else {
          log.push(`  - Telegram send failed for ${sub.chatId}: ${result.error}`);
        }
      }

      sentCount++;
      log.push(`  - SENT ${signal.symbol} ${signal.timeframe} strength=${signal.strength} to ${successCount}/${matchingSubs.length} subs`);

      if (successCount > 0) {
        await db.signalHistory.update({
          where: { id: saved.id },
          data: { telegramSent: true, telegramSentAt: new Date() },
        });
      }
    }

    log.push(`✅ Done. Sent ${sentCount}, skipped ${duplicateCount} dupes.`);

    return NextResponse.json({
      ok: true,
      startedAt,
      finishedAt: new Date().toISOString(),
      signalsGenerated: signals.length,
      strongSignals: strongSignals.length,
      signalsSent: sentCount,
      duplicates: duplicateCount,
      subscriberCount: subscribers.length,
      log,
    });
  } catch (err) {
    console.error("[/api/cron/check-signals] error:", err);
    return NextResponse.json(
      { ok: false, startedAt, error: String(err), log },
      { status: 500 }
    );
  }
}
