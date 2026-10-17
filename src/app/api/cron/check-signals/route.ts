import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { fetchTopTraders, generateMultiTfSignals } from "@/lib/mt5";
import { fetchDailyNews, generateDailyBrief, fetchMarketIndicators, generateTradingSignals } from "@/lib/market";
import { sendTelegramMessageDirect, buildTelegramMessage } from "@/lib/telegram";
import { getCached, setCached, todayKey } from "@/lib/cache";

export const runtime = "nodejs";
export const maxDuration = 60;

// Vercel Cron Job — runs hourly
// 1. Fetch fresh news from RSS + (Z.AI web search if available)
// 2. Fetch Yahoo Finance prices
// 3. Generate multi-TF signals
// 4. For any signal with strength >= subscriber's threshold:
//    - Save to SignalHistory (if not duplicate)
//    - Send to all matching Telegram subscribers

export async function GET(req: NextRequest) {
  // Verify authorization (Vercel Cron sends ?secret=... or uses Authorization header)
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  const authorized = !cronSecret || authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
  if (!authorized) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const log: string[] = [];
  log.push(`[${startedAt}] Cron job started`);

  try {
    await ensureDbInitialized();

    // Step 1: Fetch fresh news + daily brief (cached for 1 hour)
    log.push("Step 1: Fetching daily news + brief");
    let brief;
    let news;
    const cachedBrief = await getCached<{ brief: typeof brief; news: typeof news }>(todayKey(), "daily_brief");
    if (cachedBrief) {
      brief = cachedBrief.brief;
      news = cachedBrief.news;
      log.push(`  - Using cached brief (${news?.length || 0} news items)`);
    } else {
      news = await fetchDailyNews();
      brief = await generateDailyBrief(news);
      await setCached(todayKey(), "daily_brief", { brief, news, generatedAt: startedAt });
      log.push(`  - Fetched fresh brief: "${brief?.title}" (${news.length} news items)`);
    }

    // Step 2: Fetch market indicators (cached)
    log.push("Step 2: Fetching market indicators");
    let indicators;
    const cachedInd = await getCached<{ indicators: typeof indicators }>(todayKey(), "indicators");
    if (cachedInd) {
      indicators = cachedInd.indicators;
      log.push(`  - Using cached indicators`);
    } else {
      indicators = await fetchMarketIndicators();
      await setCached(todayKey(), "indicators", { indicators, generatedAt: startedAt });
      log.push(`  - Fetched fresh indicators (gold: ${indicators?.goldPrice?.value})`);
    }

    // Step 3: Fetch top traders (cached)
    let traders;
    const cachedTraders = await getCached<{ traders: typeof traders }>(todayKey(), "traders");
    if (cachedTraders) {
      traders = cachedTraders.traders;
      log.push("Step 3: Using cached traders");
    } else {
      traders = await fetchTopTraders();
      await setCached(todayKey(), "traders", { traders, generatedAt: startedAt });
      log.push(`Step 3: Fetched ${traders.length} traders`);
    }

    // Step 4: Generate multi-TF signals (force fresh)
    log.push("Step 4: Generating multi-TF signals");
    const signals = await generateMultiTfSignals(traders || []);
    const strongSignals = signals.filter((s) => s.strength >= 70 && s.direction !== "neutral");
    log.push(`  - Generated ${signals.length} signals, ${strongSignals.length} strong (>=70)`);

    // Step 5: For each strong signal, check duplicates & send to Telegram subscribers
    log.push("Step 5: Processing strong signals + sending to Telegram");

    // Get all enabled subscribers
    const subscribers = await db.telegramSubscriber.findMany({
      where: { enabled: true },
    });
    log.push(`  - ${subscribers.length} Telegram subscribers`);

    let sentCount = 0;
    let duplicateCount = 0;

    for (const signal of strongSignals) {
      // Deduplication: skip if a similar signal was sent in last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
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
        log.push(`  - SKIPPED duplicate ${signal.symbol} ${signal.timeframe} ${signal.direction} (already sent at ${recentDup.createdAt.toISOString()})`);
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
        log.push(`  - ${signal.symbol} ${signal.timeframe} strength=${signal.strength} (no matching subscribers)`);
        continue;
      }

      // Build the alert payload
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
          // Update lastSentAt
          await db.telegramSubscriber.update({
            where: { id: sub.id },
            data: { lastSentAt: new Date() },
          });
        } else {
          log.push(`  - Telegram send failed for ${sub.chatId}: ${result.error}`);
        }
      }

      sentCount++;
      log.push(`  - SENT ${signal.symbol} ${signal.timeframe} strength=${signal.strength} to ${successCount}/${matchingSubs.length} subscribers`);

      // Mark as sent
      if (successCount > 0) {
        await db.signalHistory.update({
          where: { id: saved.id },
          data: { telegramSent: true, telegramSentAt: new Date() },
        });
      }
    }

    log.push(`✅ Done. Sent ${sentCount} new signals, skipped ${duplicateCount} duplicates.`);

    return NextResponse.json({
      ok: true,
      startedAt,
      finishedAt: new Date().toISOString(),
      newsCount: news?.length || 0,
      briefTitle: brief?.title,
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
      {
        ok: false,
        startedAt,
        error: String(err),
        log,
      },
      { status: 500 }
    );
  }
}
