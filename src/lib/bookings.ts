import { randomInt } from "node:crypto";
import { FREQUENCIES, FrequencyKey } from "../../config/pricing";
import { db } from "./db";
import { isPausedOn } from "./pause";

/** Shared booking logic used by the public booking form, registration and the dashboard. */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

/** Short, human-friendly confirmation code, e.g. "K7QF-2MXR". */
export function newConfirmationCode(): string {
  let raw = "";
  for (let i = 0; i < 8; i++) raw += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function isRecurring(frequency: string): boolean {
  return frequency in FREQUENCIES && FREQUENCIES[frequency as FrequencyKey].recurring;
}

/**
 * Attaches a registered user to earlier guest bookings made with the same email.
 * Recurring guest bookings that have no plan yet get one plan per address + frequency.
 */
export async function linkGuestBookings(userId: string, email: string): Promise<void> {
  const guestBookings = await db.booking.findMany({
    where: { email, userId: null },
    orderBy: { scheduledFor: "asc" },
  });
  if (guestBookings.length === 0) return;

  await db.booking.updateMany({ where: { email, userId: null }, data: { userId } });

  const groups = new Map<string, typeof guestBookings>();
  for (const b of guestBookings) {
    if (!isRecurring(b.frequency) || b.planId) continue;
    const key = `${b.frequency}|${b.addressLine1}|${b.zip}`;
    groups.set(key, [...(groups.get(key) ?? []), b]);
  }

  for (const [, group] of groups) {
    const first = group[0];
    const plan = await db.plan.create({
      data: {
        userId,
        frequency: first.frequency,
        priceCents: first.priceCents,
        addressLine1: first.addressLine1,
        city: first.city,
        zip: first.zip,
        sqftTier: first.sqftTier,
        addons: first.addons,
        deepClean: first.deepClean,
      },
    });
    await db.booking.updateMany({
      where: { id: { in: group.map((b) => b.id) } },
      data: { planId: plan.id },
    });
  }
}

/**
 * Keeps Plan.status in line with its pauses: "paused" while a pause is in effect today,
 * otherwise "active". Cancelled plans are left alone.
 */
export async function syncPlanStatus(planId: string, today: Date): Promise<void> {
  const plan = await db.plan.findUnique({ where: { id: planId }, include: { pauses: true } });
  if (!plan || plan.status === "cancelled") return;

  const activePause = isPausedOn(
    today,
    plan.pauses.filter((p) => !p.resumedAt).map((p) => ({ startDate: p.startDate, endDate: p.endDate })),
  );
  const next = activePause ? "paused" : "active";
  if (plan.status !== next) {
    await db.plan.update({ where: { id: planId }, data: { status: next } });
  }
}
