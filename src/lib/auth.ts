import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";

/**
 * Client account auth.
 * - Passwords are hashed with bcrypt (cost 12).
 * - The session cookie holds a random token; only its SHA-256 hash is stored in the DB,
 *   so a leaked database cannot be used to hijack sessions.
 */

export const SESSION_COOKIE = "jcc_session";
const SESSION_DAYS = 30;
const RESET_TOKEN_MINUTES = 60;
const BCRYPT_COST = 12;

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { tokenHash: sha256(token), userId, expiresAt } });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Returns the signed-in user, or null. Expired sessions are treated as signed out. */
export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

/** Creates a single-use password reset token and returns the raw token (emailed to the user). */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomToken();
  await db.passwordResetToken.create({
    data: {
      tokenHash: sha256(token),
      userId,
      expiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000),
    },
  });
  return token;
}

/** Looks up a valid, unused reset token. Returns the user id or null. */
export async function findValidResetToken(rawToken: string): Promise<string | null> {
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(rawToken) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  return record.userId;
}
