import { describe, expect, it } from "vitest";
import { parseDateOnly } from "./dates";
import { endDateOnResume, pausedDaysInYear, validatePauseRequest } from "./pause";

const d = (s: string) => parseDateOnly(s)!;
const TODAY = d("2026-11-07");

describe("validatePauseRequest", () => {
  it("rejects a start date with less than 7 days' notice", () => {
    const r = validatePauseRequest(TODAY, { startDate: d("2026-11-10"), endDate: d("2026-11-20") }, []);
    expect(r.ok).toBe(false);
  });

  it("accepts a start exactly 7 days out", () => {
    const r = validatePauseRequest(TODAY, { startDate: d("2026-11-14"), endDate: d("2026-11-20") }, []);
    expect(r).toEqual({ ok: true, days: 7 });
  });

  it("rejects an end date before the start date", () => {
    const r = validatePauseRequest(TODAY, { startDate: d("2026-11-20"), endDate: d("2026-11-14") }, []);
    expect(r.ok).toBe(false);
  });

  it("enforces the 56-day (8 week) limit per calendar year", () => {
    // Existing pause uses exactly 56 days in 2026 (Mar 1 – Apr 25, inclusive)
    const existing = [{ startDate: d("2026-03-01"), endDate: d("2026-04-25") }];
    expect(pausedDaysInYear(existing, 2026)).toBe(56);

    const oneMoreDay = validatePauseRequest(TODAY, { startDate: d("2026-12-01"), endDate: d("2026-12-01") }, existing);
    expect(oneMoreDay.ok).toBe(false);
  });

  it("allows a full 56-day pause in a year with no prior pauses", () => {
    const r = validatePauseRequest(TODAY, { startDate: d("2026-12-01"), endDate: d("2026-12-31") }, []);
    expect(r.ok).toBe(true);
    const fiftySix = validatePauseRequest(TODAY, { startDate: d("2027-01-01"), endDate: d("2027-02-25") }, []);
    expect(fiftySix).toEqual({ ok: true, days: 56 });
  });

  it("splits a cross-year pause across calendar years when checking the limit", () => {
    // Dec 20 2026 – Jan 10 2027: 12 days in 2026 and 10 days in 2027, both within limit
    const r = validatePauseRequest(TODAY, { startDate: d("2026-12-20"), endDate: d("2027-01-10") }, []);
    expect(r).toEqual({ ok: true, days: 22 });

    // 2027 already has 50 paused days, so 10 more would exceed 56
    const existing2027 = [{ startDate: d("2027-03-01"), endDate: d("2027-04-19") }]; // 50 days
    const over = validatePauseRequest(TODAY, { startDate: d("2026-12-20"), endDate: d("2027-01-10") }, existing2027);
    expect(over.ok).toBe(false);
  });

  it("rejects a pause that overlaps an existing pause", () => {
    const existing = [{ startDate: d("2026-12-01"), endDate: d("2026-12-05") }];
    const r = validatePauseRequest(TODAY, { startDate: d("2026-12-05"), endDate: d("2026-12-10") }, existing);
    expect(r.ok).toBe(false);
  });
});

describe("endDateOnResume", () => {
  it("ends an active pause yesterday so the days already paused still count", () => {
    const pause = { startDate: d("2026-11-01"), endDate: d("2026-11-30") };
    expect(endDateOnResume(TODAY, pause)?.toISOString().slice(0, 10)).toBe("2026-11-06");
  });

  it("deletes a pause that has not started yet", () => {
    const pause = { startDate: d("2026-11-20"), endDate: d("2026-11-30") };
    expect(endDateOnResume(TODAY, pause)).toBeNull();
  });
});
