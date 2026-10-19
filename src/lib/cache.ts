import { db, ensureDbInitialized } from "./db";

const CACHE_TTL_MINUTES = 15; // Default cache valid for 15 minutes, then refreshed
const SHORT_CACHE_TTL_SECONDS = 10; // For real-time data (indicators, signals)

export async function getCached<T>(date: string, type: string, ttlSeconds?: number): Promise<T | null> {
  try {
    await ensureDbInitialized();
    const cached = await db.analysisCache.findUnique({
      where: { date_type: { date, type } },
    });
    if (!cached) return null;

    // Check if cache is stale
    const ageMs = Date.now() - cached.createdAt.getTime();
    const ttlMs = (ttlSeconds ? ttlSeconds * 1000 : CACHE_TTL_MINUTES * 60 * 1000);
    if (ageMs > ttlMs) {
      return null; // Stale — return null so caller fetches fresh
    }

    try {
      return JSON.parse(cached.payload) as T;
    } catch {
      return null;
    }
  } catch (err) {
    console.error("[getCached] error:", err);
    return null;
  }
}

export async function setCached(date: string, type: string, payload: unknown): Promise<void> {
  try {
    await ensureDbInitialized();
    const str = JSON.stringify(payload);
    // Use upsert with new createdAt to update TTL
    await db.analysisCache.upsert({
      where: { date_type: { date, type } },
      create: { date, type, payload: str, createdAt: new Date() },
      update: { payload: str, createdAt: new Date() },
    });
  } catch (err) {
    console.error("[setCached] error:", err);
    // Don't throw — let the response go through without caching
  }
}

// Helper to make a date+hour key for hourly cache (e.g., for signals)
export function hourlyKey(d: Date = new Date()): string {
  return `${todayKey(d)}-${d.getHours()}`;
}

export function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}
