import {
  ADDONS,
  AddonKey,
  DEEP_CLEAN_MULTIPLIER,
  FREQUENCIES,
  FrequencyKey,
  SQFT_TIERS,
  SqftTierKey,
} from "../../config/pricing";

export type PriceResult =
  | {
      kind: "priced";
      /** True when the deep clean option is selected (it includes all add-ons). */
      deepClean: boolean;
      /** Base price for the tier, in cents (before deep clean and discount). */
      baseCents: number;
      /** Base after the deep clean multiplier (equals baseCents when not a deep clean). */
      cleanCents: number;
      /** Frequency discount in cents, subtracted from cleanCents. */
      discountCents: number;
      /** Sum of add-on prices in cents. Add-ons are not discounted. */
      addonsCents: number;
      /** What the client pays for one visit, in cents. */
      totalCents: number;
    }
  | { kind: "custom_quote" };

export interface PriceInput {
  tier: SqftTierKey;
  frequency: FrequencyKey;
  deepClean?: boolean;
  addons?: AddonKey[];
}

/**
 * Calculates the price of ONE visit.
 *
 * Order of operations (all in integer cents):
 *   1. base      = tier base price
 *   2. clean     = base * 1.5 if deep clean, else base
 *   3. discount  = clean * frequency discount (rounded to nearest cent)
 *   4. total     = clean - discount + sum(add-ons), where add-ons are free when deep clean is selected
 *
 * Homes over the largest tier return { kind: "custom_quote" } and are never auto-priced.
 */
export function calculatePrice(input: PriceInput): PriceResult {
  const tier = SQFT_TIERS.find((t) => t.key === input.tier);
  if (!tier || tier.basePriceCents === null) {
    return { kind: "custom_quote" };
  }

  const frequency = FREQUENCIES[input.frequency];
  const baseCents = tier.basePriceCents;
  const cleanCents = input.deepClean ? Math.round(baseCents * DEEP_CLEAN_MULTIPLIER) : baseCents;
  const discountCents = Math.round(cleanCents * frequency.discount);
  // A deep clean includes every add-on at no extra charge.
  const addonsCents = input.deepClean
    ? 0
    : (input.addons ?? []).reduce((sum, key) => sum + ADDONS[key].priceCents, 0);

  return {
    kind: "priced",
    deepClean: !!input.deepClean,
    baseCents,
    cleanCents,
    discountCents,
    addonsCents,
    totalCents: cleanCents - discountCents + addonsCents,
  };
}
