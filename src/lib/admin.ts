import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Minimal owner-only admin auth: one shared password from ADMIN_PASSWORD.
 * After login, a signed cookie is set. The cookie value is an HMAC of a fixed label,
 * keyed with ADMIN_SESSION_SECRET, so it cannot be forged without the secret.
 */

export const ADMIN_COOKIE = "jcc_admin";
const LABEL = "admin-session-v1";

function signature(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set. Add it to .env.");
  return createHmac("sha256", secret).update(LABEL).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(
    createHmac("sha256", "pw").update(password).digest("hex"),
    createHmac("sha256", "pw").update(expected).digest("hex"),
  );
}

export async function setAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, signature(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/dimeji",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete({ name: ADMIN_COOKIE, path: "/dimeji" });
}

export async function isAdmin(): Promise<boolean> {
  try {
    const jar = await cookies();
    const value = jar.get(ADMIN_COOKIE)?.value;
    return !!value && safeEqual(value, signature());
  } catch {
    return false; // missing secret or no cookie means not an admin
  }
}
