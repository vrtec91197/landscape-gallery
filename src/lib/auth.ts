import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const AUTH_SECRET = process.env.AUTH_SECRET || "change-me-in-production";

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function createSessionToken(): string {
  const payload = `admin:${Date.now()}`;
  const signature = createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = token.substring(0, lastDot);
  const signature = token.substring(lastDot + 1);

  const expected = createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function requireAuth(request: NextRequest): NextResponse | null {
  const sessionCookie = request.cookies.get("session");
  if (!sessionCookie || !verifySessionToken(sessionCookie.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
