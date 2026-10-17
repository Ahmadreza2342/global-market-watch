import { db, ensureDbInitialized } from "./db";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "crypto";

const SESSION_COOKIE = "gmw_session";
const SESSION_DAYS = 30;

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "gmw_salt_2026").digest("hex");
}

function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<{ user: AuthUser; token: string } | { error: string }> {
  try {
    await ensureDbInitialized();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return { error: "EMAIL_EXISTS" };

    const user = await db.user.create({
      data: {
        email,
        name: name || null,
        password: hashPassword(password),
      },
    });

    const token = newSessionToken();
    const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await setSession(token, user.id, expires);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  } catch (err) {
    console.error("[registerUser] error:", err);
    return { error: "REGISTER_FAILED" };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string } | { error: string }> {
  try {
    await ensureDbInitialized();
    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.password !== hashPassword(password)) {
      return { error: "INVALID_CREDENTIALS" };
    }
    const token = newSessionToken();
    const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
    await setSession(token, user.id, expires);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    };
  } catch (err) {
    console.error("[loginUser] error:", err);
    return { error: "LOGIN_FAILED" };
  }
}

// Simple in-memory session store (resets on restart). For production,
// replace with a DB table or Redis.
const sessions = new Map<string, { userId: string; expires: Date }>();

async function setSession(token: string, userId: string, expires: Date) {
  sessions.set(token, { userId, expires });
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const session = sessions.get(token);
    if (!session) return null;
    if (session.expires < new Date()) {
      sessions.delete(token);
      return null;
    }

    await ensureDbInitialized();
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name };
  } catch (err) {
    console.error("[getSessionUser] error:", err);
    return null;
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function setSessionCookie(token: string) {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  return `${SESSION_COOKIE}=${token}; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax`;
}
