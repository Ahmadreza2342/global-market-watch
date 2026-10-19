import { NextResponse } from "next/server";

// Helper to set no-cache headers on API responses
// This prevents Vercel's edge CDN from caching API responses
// so users always get fresh data
export function noCacheJson(data: unknown, status: number = 200): NextResponse {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  res.headers.set("Vercel-CDN-Cache-Control", "no-store, max-age=0");
  res.headers.set("CDN-Cache-Control", "no-store, max-age=0");
  res.headers.set("Surrogate-Control", "no-store, max-age=0");
  return res;
}
