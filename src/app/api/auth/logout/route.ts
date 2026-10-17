import { NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const cookieName = getSessionCookieName();
  const headers = new Headers();
  headers.append("Set-Cookie", `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax`);
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"), { headers });
}
