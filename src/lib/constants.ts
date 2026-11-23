/** Allowed status values. Kept as const arrays so Zod and TypeScript share one source of truth. */
export const BOOKING_STATUSES = ["requested", "confirmed", "completed", "cancelled", "paused"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PLAN_STATUSES = ["active", "paused", "cancelled"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "invoiced", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
