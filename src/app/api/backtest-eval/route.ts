import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { fetchQuote } from "@/lib/yahoo";

export const runtime = "nodejs";
export const maxDuration = 30;

// Evaluate historical signals: for each SignalHistory older than 6h (or 1h after timeframe),
// fetch the current price and determine if the signal was profitable (TP hit) or losing (SL hit)
// or still open (neither hit yet). Update the record.

export async function GET() {
  try {
    await ensureDbInitialized();

    // Get all signals that don't have an outcome yet
    // Outcome: 'win' (TP hit), 'loss' (SL hit), 'open' (neither yet)
    const signals = await db.$queryRaw<Array<{
      id: string;
      symbol: string;
      timeframe: string;
      direction: string;
      entry: string;
      takeProfit: string;
      stopLoss: string;
      createdAt: string;
    }>>`
      SELECT id, symbol, timeframe, direction, entry, takeProfit, stopLoss, createdAt
      FROM SignalHistory
      WHERE telegramSent = 1
        AND createdAt < datetime('now', '-1 hour')
        AND id NOT IN (SELECT DISTINCT s.id FROM SignalHistory s
                       JOIN EvaluationLog e ON e.signalId = s.id)
      ORDER BY createdAt DESC
      LIMIT 50
    `;

    if (signals.length === 0) {
      return NextResponse.json({ ok: true, evaluated: 0, message: "No signals to evaluate" });
    }

    // Group by symbol to fetch current prices efficiently
    const symbols = Array.from(new Set(signals.map((s) => s.symbol)));
    const priceMap: Record<string, number | null> = {};
    for (const sym of symbols) {
      try {
        const q = await fetchQuote(sym);
        priceMap[sym] = q?.price ?? null;
      } catch {
        priceMap[sym] = null;
      }
    }

    let evaluated = 0;
    let wins = 0;
    let losses = 0;
    let stillOpen = 0;

    for (const sig of signals) {
      const currentPrice = priceMap[sig.symbol];
      if (currentPrice == null) continue;

      const entry = parseFloat(sig.entry);
      const tp = parseFloat(sig.takeProfit);
      const sl = parseFloat(sig.stopLoss);
      if (Number.isNaN(entry) || Number.isNaN(tp) || Number.isNaN(sl)) continue;

      let outcome: "win" | "loss" | "open";
      if (sig.direction === "long") {
        if (currentPrice >= tp) outcome = "win";
        else if (currentPrice <= sl) outcome = "loss";
        else outcome = "open";
      } else if (sig.direction === "short") {
        if (currentPrice <= tp) outcome = "win";
        else if (currentPrice >= sl) outcome = "loss";
        else outcome = "open";
      } else {
        outcome = "open";
      }

      if (outcome === "win") wins++;
      else if (outcome === "loss") losses++;
      else stillOpen++;

      // Save evaluation result
      await db.$executeRaw`
        INSERT INTO EvaluationLog (id, signalId, outcome, currentPrice, evaluatedAt, createdAt)
        VALUES (${crypto.randomUUID()}, ${sig.id}, ${outcome}, ${currentPrice}, datetime('now'), datetime('now'))
      `.catch(() => {});
      evaluated++;
    }

    return NextResponse.json({
      ok: true,
      evaluated,
      wins,
      losses,
      stillOpen,
      winRate: evaluated > 0 ? Math.round((wins / (wins + losses || 1)) * 1000) / 10 : 0,
    });
  } catch (err) {
    console.error("[/api/backtest-eval] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
