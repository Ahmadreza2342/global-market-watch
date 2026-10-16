import { db } from "./db";

export async function getCached<T>(date: string, type: string): Promise<T | null> {
  const cached = await db.analysisCache.findUnique({
    where: { date_type: { date, type } },
  });
  if (!cached) return null;
  try {
    return JSON.parse(cached.payload) as T;
  } catch {
    return null;
  }
}

export async function setCached(date: string, type: string, payload: unknown): Promise<void> {
  const str = JSON.stringify(payload);
  await db.analysisCache.upsert({
    where: { date_type: { date, type } },
    create: { date, type, payload: str },
    update: { payload: str },
  });
}

export function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}
