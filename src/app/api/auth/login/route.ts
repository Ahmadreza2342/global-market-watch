import { NextRequest, NextResponse } from "next/server";
import { loginUser, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }
  const result = await loginUser(email, password);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  const headers = new Headers();
  headers.append("Set-Cookie", setSessionCookie(result.token));
  return NextResponse.json({ user: result.user }, { headers, status: 200 });
}
