import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __dbInitialized?: boolean
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Ensure SQLite tables exist on cold start (Vercel serverless ephemeral /tmp)
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "AnalysisCache" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "AnalysisCache_date_type_key" ON "AnalysisCache"("date", "type");
CREATE INDEX IF NOT EXISTS "AnalysisCache_date_idx" ON "AnalysisCache"("date");

CREATE TABLE IF NOT EXISTS "Alert" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "condition" TEXT NOT NULL,
  "threshold" TEXT NOT NULL,
  "note" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT 1,
  "triggered" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS "Alert_userId_active_idx" ON "Alert"("userId", "active");

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
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "SignalHistory_symbol_timeframe_createdAt_idx" ON "SignalHistory"("symbol", "timeframe", "createdAt");
CREATE INDEX IF NOT EXISTS "SignalHistory_createdAt_idx" ON "SignalHistory"("createdAt");

CREATE TABLE IF NOT EXISTS "Bookmark" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT,
  "category" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "Bookmark_userId_idx" ON "Bookmark"("userId");

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "checksum" TEXT NOT NULL,
  "finished_at" DATETIME,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" DATETIME,
  "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
`;

let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized(): Promise<void> {
  if (globalForPrisma.__dbInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Split into individual statements and execute
      const statements = SCHEMA_SQL.split(';').map((s) => s.trim()).filter((s) => s.length > 0);
      for (const stmt of statements) {
        await db.$executeRawUnsafe(stmt);
      }
      globalForPrisma.__dbInitialized = true;
      console.log('[db] SQLite tables initialized successfully');
    } catch (err) {
      console.error('[db] Failed to initialize SQLite tables:', err);
      // Don't throw — let individual queries fail with proper error messages
      // (the request will still return gracefully with fallback data)
    }
  })();

  return initPromise;
}
