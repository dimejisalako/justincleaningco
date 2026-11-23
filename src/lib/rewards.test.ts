import { describe, expect, it } from "vitest";
import { computeRewards, SpendVisit } from "./rewards";
import { parseDateOnly } from "./dates";

const d = (s: string) => parseDateOnly(s)!;
const v = (id: string, date: string, dollars: number): SpendVisit => ({ id, date: d(date), amountCents: dollars * 100 });
const TODAY = d("2026-11-23");

describe("computeRewards (free deep clean after $2,500 in 3 months)", () => {
  it("earns a reward once three $1,000 visits fall inside 3 months", () => {
    const r = computeRewards([v("a", "2026-08-01", 1000), v("b", "2026-09-01", 1000), v("c", "2026-10-01", 1000)], TODAY);
    expect(r.earned).toEqual([{ visitId: "c", earnedOn: d("2026-10-01") }]);
    expect(r.pendingCents).toBe(0);
  });

  it("does not count spend older than 3 months", () => {
    // Jan 1 visit is outside the window when May 1 is spent, so the total is only $2,000
    const r = computeRewards([v("a", "2026-01-01", 1000), v("b", "2026-02-01", 1000), v("c", "2026-05-01", 1000)], d("2026-05-01"));
    expect(r.earned).toEqual([]);
    expect(r.pendingCents).toBe(200_000); // only Feb + May count: $2,000
  });

  it("earns one reward per $2,500, and spend used for a reward is not reused", () => {
    const visits = [
      v("1", "2026-07-01", 1000),
      v("2", "2026-08-01", 1000),
      v("3", "2026-09-01", 1000), // reward 1 (spend $3,000 >= $2,500; reset)
      v("4", "2026-10-01", 1000),
      v("5", "2026-10-15", 1000),
      v("6", "2026-11-01", 1000), // reward 2
    ];
    const r = computeRewards(visits, TODAY);
    expect(r.earned.map((e) => e.visitId)).toEqual(["3", "6"]);
  });

  it("a single large visit earns one reward and the rest of it does not carry over", () => {
    const r = computeRewards([v("big", "2026-11-01", 6000)], TODAY);
    expect(r.earned).toHaveLength(1);
    expect(r.pendingCents).toBe(0);
  });

  it("reports progress toward the next reward", () => {
    const r = computeRewards([v("a", "2026-10-01", 1000), v("b", "2026-11-01", 800)], TODAY);
    expect(r.earned).toEqual([]);
    expect(r.pendingCents).toBe(180_000); // $1,800 of $2,500
  });
});
