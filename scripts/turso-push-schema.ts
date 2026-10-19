// Push database schema directly to Turso using libsql client
// Run: DATABASE_URL=libsql://... bun run scripts/turso-push-schema.ts

import { createClient } from "@libsql/client";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// Parse authToken from URL
const urlObj = new URL(dbUrl);
const authToken = urlObj.searchParams.get("authToken");
urlObj.searchParams.delete("authToken");
const cleanUrl = urlObj.toString();

console.log("Connecting to:", cleanUrl);
const client = createClient({
  url: cleanUrl,
  authToken: authToken || undefined,
});

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "AnalysisCache" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "AnalysisCache_date_type_key" ON "AnalysisCache"("date", "type");
CREATE INDEX IF NOT EXISTS "AnalysisCache_date_idx" ON "AnalysisCache"("date");

CREATE TABLE IF NOT EXISTS "SignalHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "symbol" TEXT NOT NULL,
  "timeframe" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "strength" INTEGER NOT NULL,
  "entry" TEXT,
  "takeProfit" TEXT,
  "stopLoss" TEXT,
  "source" TEXT NOT NULL,
  "reason" TEXT,
  "telegramSent" BOOLEAN NOT NULL DEFAULT 0,
  "telegramSentAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SignalHistory_symbol_timeframe_createdAt_idx" ON "SignalHistory"("symbol", "timeframe", "createdAt");
CREATE INDEX IF NOT EXISTS "SignalHistory_createdAt_idx" ON "SignalHistory"("createdAt");
CREATE INDEX IF NOT EXISTS "SignalHistory_telegramSent_idx" ON "SignalHistory"("telegramSent");

CREATE TABLE IF NOT EXISTS "TelegramSubscriber" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "botToken" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "label" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT 1,
  "threshold" INTEGER NOT NULL DEFAULT 75,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "lastSentAt" DATETIME
);
CREATE INDEX IF NOT EXISTS "TelegramSubscriber_enabled_threshold_idx" ON "TelegramSubscriber"("enabled", "threshold");

CREATE TABLE IF NOT EXISTS "EvaluationLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "signalId" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "currentPrice" TEXT NOT NULL,
  "evaluatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "EvaluationLog_signalId_idx" ON "EvaluationLog"("signalId");
CREATE INDEX IF NOT EXISTS "EvaluationLog_outcome_idx" ON "EvaluationLog"("outcome");
CREATE INDEX IF NOT EXISTS "EvaluationLog_evaluatedAt_idx" ON "EvaluationLog"("evaluatedAt");
`;

async function main() {
  const statements = SCHEMA_SQL.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
  console.log(`Executing ${statements.length} SQL statements...`);

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      const preview = stmt.split("\n")[0].slice(0, 60);
      console.log(`  ✓ ${preview}...`);
    } catch (err) {
      console.error(`  ✗ Failed: ${stmt.slice(0, 80)}`);
      console.error(`    Error: ${err}`);
    }
  }

  // Verify tables exist
  const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log("\n📊 Tables in Turso database:");
  for (const row of result.rows) {
    console.log(`  - ${row.name}`);
  }

  console.log("\n✅ Schema push complete!");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
