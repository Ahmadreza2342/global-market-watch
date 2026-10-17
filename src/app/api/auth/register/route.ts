import { NextRequest, NextResponse } from "next/server";
import { registerUser, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, password, name } = body as { email?: string; password?: string; name?: string };
  if (!email || !password) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }
  const result = await registerUser(email, password, name);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  const headers = new Headers();
  headers.append("Set-Cookie", setSessionCookie(result.token));
  return NextResponse.json({ user: result.user }, { headers, status: 201 });
}
