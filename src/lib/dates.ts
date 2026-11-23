/**
 * Date helpers. All calendar dates are represented as UTC midnight Date objects,
 * so "the same day" comparisons never depend on the server's timezone.
 * "Today" is taken in the business's timezone (America/Chicago, Texas).
 */

export const BUSINESS_TIMEZONE = "America/Chicago";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses "YYYY-MM-DD" into a UTC-midnight Date. Returns null if the string is not a real date. */
export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Reject rollovers such as 2026-02-31.
  return d.toISOString().slice(0, 10) === value ? d : null;
}

/** Formats a UTC-midnight Date as "YYYY-MM-DD". */
export function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Today's date in the business timezone, as a UTC-midnight Date. */
export function todayInBusinessZone(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now); // en-CA gives YYYY-MM-DD
  return parseDateOnly(parts)!;
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

/** Number of calendar days from a to b, inclusive of both ends. */
export function inclusiveDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS) + 1;
}

export function yearOf(d: Date): number {
  return d.getUTCFullYear();
}

export function startOfYear(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

export function endOfYear(year: number): Date {
  return new Date(Date.UTC(year, 11, 31));
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(d: Date): string {
  return d.toLocaleString("en-US", { timeZone: BUSINESS_TIMEZONE, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Start hour (Central time) for each time window. */
const WINDOW_START_HOUR: Record<string, number> = { morning: 8, afternoon: 12, evening: 16 };

/** Offset in minutes between UTC and the business timezone at a given instant (e.g. -360 for CST). */
function businessOffsetMinutes(at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BUSINESS_TIMEZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** The actual instant a visit starts: the window's start hour in Central time on the visit date. */
export function visitStartInstant(scheduledFor: Date, timeWindow: string): Date {
  const hour = WINDOW_START_HOUR[timeWindow] ?? 8;
  const y = scheduledFor.getUTCFullYear();
  const m = scheduledFor.getUTCMonth();
  const day = scheduledFor.getUTCDate();
  const guess = new Date(Date.UTC(y, m, day, hour));
  // Correct for DST by applying the offset in effect at the guessed instant.
  return new Date(guess.getTime() - businessOffsetMinutes(guess) * 60000);
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
