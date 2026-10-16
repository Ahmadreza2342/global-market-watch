import { db, ensureDbInitialized } from "./db";

export async function getCached<T>(date: string, type: string): Promise<T | null> {
  try {
    await ensureDbInitialized();
    const cached = await db.analysisCache.findUnique({
      where: { date_type: { date, type } },
    });
    if (!cached) return null;
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
    await db.analysisCache.upsert({
      where: { date_type: { date, type } },
      create: { date, type, payload: str },
      update: { payload: str },
    });
  } catch (err) {
    console.error("[setCached] error:", err);
    // Don't throw — let the response go through without caching
  }
}

export function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}
