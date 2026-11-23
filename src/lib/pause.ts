import { PAUSE_MAX_DAYS_PER_YEAR, PAUSE_NOTICE_DAYS } from "../../config/site";
import { addDays, endOfYear, inclusiveDays, startOfYear } from "./dates";

/**
 * PAUSE RULES (enforced here, on the server — never trust the browser):
 *  - A plan can be paused for at most 56 days (8 weeks) per calendar year.
 *  - The pause must start at least 7 days after the request date.
 *  - No fee. The paused slot is released; the plan resumes at the same price.
 *
 * All dates are UTC-midnight Dates (see dates.ts). "endDate" is inclusive.
 */

export interface PauseRange {
  startDate: Date;
  endDate: Date;
}

/** Days of a range that fall inside a given calendar year. */
export function daysInYear(range: PauseRange, year: number): number {
  const from = range.startDate > startOfYear(year) ? range.startDate : startOfYear(year);
  const to = range.endDate < endOfYear(year) ? range.endDate : endOfYear(year);
  return to < from ? 0 : inclusiveDays(from, to);
}

/** Total paused days in a calendar year across all pauses (existing or proposed). */
export function pausedDaysInYear(ranges: PauseRange[], year: number): number {
  return ranges.reduce((sum, r) => sum + daysInYear(r, year), 0);
}

/** Remaining paused days for a calendar year. Never negative. */
export function remainingPauseDays(ranges: PauseRange[], year: number): number {
  return Math.max(0, PAUSE_MAX_DAYS_PER_YEAR - pausedDaysInYear(ranges, year));
}

export type PauseCheck =
  | { ok: true; days: number }
  | { ok: false; error: string };

/**
 * Validates a new pause request.
 *
 * @param today          The current business date (UTC midnight).
 * @param request        Requested start and inclusive end date.
 * @param existing       The plan's existing pause ranges.
 */
export function validatePauseRequest(
  today: Date,
  request: PauseRange,
  existing: PauseRange[],
): PauseCheck {
  const { startDate, endDate } = request;

  if (endDate < startDate) {
    return { ok: false, error: "The end date must be on or after the start date." };
  }

  const earliestStart = addDays(today, PAUSE_NOTICE_DAYS);
  if (startDate < earliestStart) {
    return {
      ok: false,
      error: `Pauses need ${PAUSE_NOTICE_DAYS} days' notice. The earliest start date is ${earliestStart.toISOString().slice(0, 10)}.`,
    };
  }

  // Overlapping an existing pause would double-count days.
  const overlaps = existing.some((r) => r.startDate <= endDate && startDate <= r.endDate);
  if (overlaps) {
    return { ok: false, error: "This date range overlaps a pause that is already scheduled." };
  }

  // Check every calendar year the requested range touches.
  for (let year = startDate.getUTCFullYear(); year <= endDate.getUTCFullYear(); year++) {
    const requestedInYear = daysInYear(request, year);
    const usedInYear = pausedDaysInYear(existing, year);
    if (usedInYear + requestedInYear > PAUSE_MAX_DAYS_PER_YEAR) {
      const remaining = PAUSE_MAX_DAYS_PER_YEAR - usedInYear;
      return {
        ok: false,
        error: `Pause limit reached for ${year}: up to ${PAUSE_MAX_DAYS_PER_YEAR} paused days (8 weeks) per calendar year. You have ${Math.max(0, remaining)} day(s) left in ${year}.`,
      };
    }
  }

  return { ok: true, days: inclusiveDays(startDate, endDate) };
}

/**
 * Computes the end date to store when a client resumes early.
 * Returns null if the pause should be deleted (it had not started yet).
 */
export function endDateOnResume(today: Date, pause: PauseRange): Date | null {
  if (pause.startDate >= today) return null; // not started: cancel the pause entirely
  const yesterday = addDays(today, -1);
  return pause.endDate < yesterday ? pause.endDate : yesterday;
}

/** True if the given date falls inside an active (not yet ended) pause. */
export function isPausedOn(date: Date, ranges: PauseRange[]): boolean {
  return ranges.some((r) => r.startDate <= date && date <= r.endDate);
}
