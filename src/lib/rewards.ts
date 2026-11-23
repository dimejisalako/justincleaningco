/**
 * FREE DEEP CLEAN REWARD RULE (pure logic, no database).
 *
 * Every time a client has spent REWARD_THRESHOLD within a rolling 3-month window,
 * they earn one free deep clean. Spend that earns a reward is used up, so the next
 * reward needs a fresh $2,500. Spend older than 3 months stops counting.
 *
 * Only COMPLETED visits count (the owner marks them complete in /dimeji).
 */

export const REWARD_THRESHOLD_CENTS = 250_000; // $2,500
export const REWARD_WINDOW_MONTHS = 3;

export interface SpendVisit {
  id: string;
  date: Date; // scheduled visit date (UTC midnight)
  amountCents: number;
}

export interface EarnedReward {
  visitId: string; // the visit whose spend completed the $2,500
  earnedOn: Date;
}

export interface RewardProgress {
  earned: EarnedReward[];
  /** Spend that is in the window and not yet used for a reward, as of `asOf`. */
  pendingCents: number;
}

/** Date exactly REWARD_WINDOW_MONTHS before `d`. */
export function windowStart(d: Date): Date {
  const x = new Date(d);
  x.setUTCMonth(x.getUTCMonth() - REWARD_WINDOW_MONTHS);
  return x;
}

export function computeRewards(
  visits: SpendVisit[],
  asOf: Date,
  threshold: number = REWARD_THRESHOLD_CENTS,
): RewardProgress {
  const sorted = [...visits].sort((a, b) => a.date.getTime() - b.date.getTime());
  const earned: EarnedReward[] = [];
  let queue: SpendVisit[] = [];

  for (const visit of sorted) {
    const start = windowStart(visit.date);
    queue = queue.filter((q) => q.date >= start);
    queue.push(visit);
    const sum = queue.reduce((s, q) => s + q.amountCents, 0);
    if (sum >= threshold) {
      earned.push({ visitId: visit.id, earnedOn: visit.date });
      queue = []; // the spend is used up
    }
  }

  // Progress as of today: only spend still inside the window counts.
  const todayStart = windowStart(asOf);
  const pendingCents = queue
    .filter((q) => q.date >= todayStart && q.date <= asOf)
    .reduce((s, q) => s + q.amountCents, 0);

  return { earned, pendingCents };
}
