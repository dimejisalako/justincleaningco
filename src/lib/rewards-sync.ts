import { db } from "./db";
import { computeRewards } from "./rewards";
import { todayInBusinessZone } from "./dates";

/**
 * Database side of the rewards rule. Call after any change to a client's completed visits.
 * Creates an "auto" reward for each new $2,500 milestone. Existing rewards are never deleted,
 * so a reward the client has already seen or used is never taken back.
 */
export async function syncRewards(userId: string): Promise<void> {
  const completed = await db.booking.findMany({
    where: { userId, status: "completed" },
    select: { id: true, scheduledFor: true, priceCents: true },
  });

  const { earned } = computeRewards(
    completed.map((b) => ({ id: b.id, date: b.scheduledFor, amountCents: b.priceCents })),
    todayInBusinessZone(),
  );

  const existing = await db.reward.findMany({
    where: { userId, source: "auto" },
    select: { earnedFromBookingId: true },
  });
  const already = new Set(existing.map((r) => r.earnedFromBookingId));

  for (const e of earned) {
    if (already.has(e.visitId)) continue;
    await db.reward.create({
      data: { userId, source: "auto", earnedOn: e.earnedOn, earnedFromBookingId: e.visitId },
    });
  }
}

export interface SpendSummary {
  visitsCount: number;
  totalSpentCents: number;
  pendingCents: number; // spend toward the next reward (inside the 3-month window)
  availableRewards: number;
}

/** Totals for the client dashboard and the admin user page. Completed visits only. */
export async function spendSummary(userId: string): Promise<SpendSummary> {
  const today = todayInBusinessZone();
  const completed = await db.booking.findMany({
    where: { userId, status: "completed" },
    select: { id: true, scheduledFor: true, priceCents: true },
  });
  const { pendingCents } = computeRewards(
    completed.map((b) => ({ id: b.id, date: b.scheduledFor, amountCents: b.priceCents })),
    today,
  );
  const availableRewards = await db.reward.count({ where: { userId, status: "available" } });

  return {
    visitsCount: completed.length,
    totalSpentCents: completed.reduce((s, b) => s + b.priceCents, 0),
    pendingCents,
    availableRewards,
  };
}
