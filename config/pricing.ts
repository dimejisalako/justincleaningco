/**
 * PRICING CONFIG — edit prices here only. Components and logic read from this file.
 *
 * All money is stored in CENTS (integers) to avoid floating-point rounding errors.
 * e.g. 14000 = $140.00
 *
 * PLACEHOLDER VALUES: the add-on prices below are placeholders. Confirm them before launch.
 */

export type SqftTierKey = "under_1500" | "1500_2500" | "2500_3500" | "over_3500";
export type FrequencyKey = "one_time" | "every_two_weeks" | "weekly" | "monthly";
export type AddonKey = "inside_fridge" | "inside_oven" | "interior_windows";

export interface SqftTier {
  key: SqftTierKey;
  label: string;
  /** Upper bound (inclusive) in sq ft. null means "no upper bound". */
  maxSqft: number | null;
  /** One-time base price in cents. null means custom quote (not auto-priced). */
  basePriceCents: number | null;
}

export const SQFT_TIERS: SqftTier[] = [
  { key: "under_1500", label: "Under 1,500 sq ft", maxSqft: 1499, basePriceCents: 14000 },
  { key: "1500_2500", label: "1,500 to 2,500 sq ft", maxSqft: 2500, basePriceCents: 19000 },
  { key: "2500_3500", label: "2,500 to 3,500 sq ft", maxSqft: 3500, basePriceCents: 24500 },
  { key: "over_3500", label: "Over 3,500 sq ft", maxSqft: null, basePriceCents: null },
];

/** Discount applied to the base price, as a fraction (0.10 = 10% off). */
export const FREQUENCIES: Record<FrequencyKey, { label: string; discount: number; recurring: boolean }> = {
  one_time: { label: "One-time", discount: 0, recurring: false },
  every_two_weeks: { label: "Every two weeks", discount: 0.1, recurring: true },
  weekly: { label: "Weekly", discount: 0.15, recurring: true },
  monthly: { label: "Monthly", discount: 0, recurring: true },
};

/** Deep clean multiplier applied to the base (one-time) price. */
export const DEEP_CLEAN_MULTIPLIER = 1.5;

/** Fixed add-on prices in cents. PLACEHOLDER prices. */
export const ADDONS: Record<AddonKey, { label: string; priceCents: number }> = {
  inside_fridge: { label: "Inside fridge", priceCents: 3000 },
  inside_oven: { label: "Inside oven", priceCents: 3500 },
  interior_windows: { label: "Interior windows", priceCents: 6000 },
};
