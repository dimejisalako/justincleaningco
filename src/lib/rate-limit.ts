import { headers } from "next/headers";

/**
 * Fixed-window rate limiter kept in memory.
 *
 * LIMITATION: state lives in this server process. It works for local development and a
 * single Node server. On serverless hosts (e.g. Vercel) each instance has its own memory,
 * so limits are per-instance. Swap the Map for Redis/Upstash before relying on it in production.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitRule {
  /** Maximum attempts allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 15 * 60 * 1000 },
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  forgotPassword: { limit: 5, windowMs: 60 * 60 * 1000 },
  booking: { limit: 10, windowMs: 60 * 60 * 1000 },
  adminLogin: { limit: 5, windowMs: 15 * 60 * 1000 },
} satisfies Record<string, RateLimitRule>;

/** Counts one attempt. Returns ok=false with retry time once the limit is exceeded. */
export function consumeRateLimit(
  scope: keyof typeof RATE_LIMITS,
  identifier: string,
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const rule = RATE_LIMITS[scope];
  const key = `${scope}:${identifier}`;
  const now = Date.now();

  // Opportunistic cleanup so the map cannot grow without bound.
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true };
  }
  if (bucket.count >= rule.limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

/** Best-effort client IP from proxy headers (set by Vercel and most reverse proxies). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
