import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __dbInitialized?: boolean
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || 'file:/tmp/custom.db'

  // If using libsql:// (Turso), use the libsql adapter
  if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('libsql+ws://')) {
    try {
      // Parse authToken from URL query string if present
      const urlObj = new URL(dbUrl)
      const authToken = urlObj.searchParams.get('authToken') || process.env.DATABASE_AUTH_TOKEN
      urlObj.searchParams.delete('authToken')
      const cleanUrl = urlObj.toString().replace(/\/$/, '')

      console.log('[db] Using libsql adapter. cleanUrl:', cleanUrl.slice(0, 60), 'hasAuth:', !!authToken)

      // PrismaLibSQL is a FACTORY that takes a config object (not a libsql client)
      // It internally creates the libsql client
      const adapter = new PrismaLibSQL({
        url: cleanUrl,
        authToken: authToken || undefined,
      })
      const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
      })
      console.log('[db] Prisma client created with libsql adapter')
      return client
    } catch (err) {
      console.error('[db] Failed to create libsql adapter:', err)
    }
  }

  // Default: SQLite local file
  console.log('[db] Using default SQLite (no adapter)')
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// SQL schema for ensuring tables exist on cold start
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
`

let initPromise: Promise<void> | null = null

export async function ensureDbInitialized(): Promise<void> {
  if (globalForPrisma.__dbInitialized) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      // Skip SQL initialization for libsql/Turso (tables created via scripts/turso-push-schema.ts)
      const dbUrl = process.env.DATABASE_URL || 'file:/tmp/custom.db'
      if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('libsql+ws://')) {
        globalForPrisma.__dbInitialized = true
        console.log('[db] Using Turso/libsql — tables should be pre-created')
        return
      }

      // For local SQLite, create tables
      const statements = SCHEMA_SQL.split(';').map((s) => s.trim()).filter((s) => s.length > 0)
      for (const stmt of statements) {
        await db.$executeRawUnsafe(stmt)
      }
      globalForPrisma.__dbInitialized = true
      console.log('[db] SQLite tables initialized successfully')
    } catch (err) {
      console.error('[db] Failed to initialize tables:', err)
    }
  })()

  return initPromise
}
