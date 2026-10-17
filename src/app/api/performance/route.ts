import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureDbInitialized();

    // Get total signals sent
    const totalSent = await db.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*) as count FROM SignalHistory WHERE telegramSent = 1
    `;

    // Get evaluations grouped by outcome
    const outcomes = await db.$queryRaw<Array<{ outcome: string; count: number }>>`
      SELECT outcome, COUNT(*) as count FROM EvaluationLog GROUP BY outcome
    `;

    const wins = outcomes.find((o) => o.outcome === "win")?.count || 0;
    const losses = outcomes.find((o) => o.outcome === "loss")?.count || 0;
    const open = outcomes.find((o) => o.outcome === "open")?.count || 0;
    const evaluated = wins + losses + open;
    const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 1000) / 10 : 0;

    // Get last 30 signals with their latest evaluation
    const recentSignals = await db.$queryRaw<Array<{
      id: string;
      symbol: string;
      timeframe: string;
      direction: string;
      strength: number;
      entry: string;
      takeProfit: string;
      stopLoss: string;
      createdAt: string;
      outcome: string | null;
      currentPrice: string | null;
      evaluatedAt: string | null;
    }>>`
      SELECT
        s.id, s.symbol, s.timeframe, s.direction, s.strength,
        s.entry, s.takeProfit, s.stopLoss, s.createdAt,
        e.outcome, e.currentPrice, e.evaluatedAt
      FROM SignalHistory s
      LEFT JOIN EvaluationLog e ON e.signalId = s.id
        AND e.evaluatedAt = (SELECT MAX(evaluatedAt) FROM EvaluationLog WHERE signalId = s.id)
      WHERE s.telegramSent = 1
      ORDER BY s.createdAt DESC
      LIMIT 30
    `;

    // Calculate ROI per signal (simplified: assume 1% risk per trade, R:R = 1:2)
    let totalROI = 0;
    const equityCurve: Array<{ date: string; roi: number }> = [];
    let cumulativeROI = 0;
    const sorted = [...recentSignals].reverse(); // oldest first for equity curve
    for (const sig of sorted) {
      let pnlPct = 0;
      if (sig.outcome === "win") pnlPct = 2; // +2% (R:R = 1:2, risk 1%)
      else if (sig.outcome === "loss") pnlPct = -1; // -1%
      cumulativeROI += pnlPct;
      equityCurve.push({
        date: sig.createdAt,
        roi: parseFloat(cumulativeROI.toFixed(2)),
      });
    }
    totalROI = cumulativeROI;

    return NextResponse.json({
      ok: true,
      stats: {
        totalSent: totalSent[0]?.count || 0,
        evaluated,
        wins,
        losses,
        stillOpen: open,
        winRate,
        totalROI: parseFloat(totalROI.toFixed(2)),
      },
      recentSignals: recentSignals.slice(0, 10),
      equityCurve,
    });
  } catch (err) {
    console.error("[/api/performance] error:", err);
    return NextResponse.json({
      ok: false,
      error: String(err),
      stats: { totalSent: 0, evaluated: 0, wins: 0, losses: 0, stillOpen: 0, winRate: 0, totalROI: 0 },
      recentSignals: [],
      equityCurve: [],
    });
  }
}
