"use client";

import Link from "next/link";
import { useState } from "react";
import { ADDONS, AddonKey, FREQUENCIES, FrequencyKey, SQFT_TIERS, SqftTierKey } from "../../config/pricing";
import { calculatePrice } from "@/lib/pricing";
import { PriceBox } from "@/components/PriceBox";
import { CheckboxField, SelectField } from "@/components/fields";

/**
 * Home-page pricing calculator. All numbers come from config/pricing.ts.
 * "Book this cleaning" passes the choices to the booking page as query parameters.
 */
export function PriceCalculator() {
  const [tier, setTier] = useState<SqftTierKey>("1500_2500");
  const [frequency, setFrequency] = useState<FrequencyKey>("one_time");
  const [deepClean, setDeepClean] = useState(false);
  const [addons, setAddons] = useState<AddonKey[]>([]);

  const result = calculatePrice({ tier, frequency, deepClean, addons });

  const toggleAddon = (key: AddonKey) =>
    setAddons((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  // Deep clean includes every add-on, so selecting it ticks them all and greys them out.
  const onDeepClean = (checked: boolean) => {
    setDeepClean(checked);
    setAddons(checked ? (Object.keys(ADDONS) as AddonKey[]) : []);
  };

  const params = new URLSearchParams({ tier, frequency });
  if (deepClean) params.set("deep", "1");
  if (addons.length) params.set("addons", addons.join(","));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form className="card space-y-5" aria-label="Pricing calculator" onSubmit={(e) => e.preventDefault()}>
        <SelectField
          name="calc-tier"
          label="Home size"
          value={tier}
          onChange={(e) => setTier(e.target.value as SqftTierKey)}
          options={SQFT_TIERS.map((t) => ({ value: t.key, label: t.label }))}
        />
        <SelectField
          name="calc-frequency"
          label="How often"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as FrequencyKey)}
          options={Object.entries(FREQUENCIES).map(([value, f]) => ({
            value,
            label: f.discount > 0 ? `${f.label} (${Math.round(f.discount * 100)}% off)` : f.label,
          }))}
        />
        <CheckboxField
          name="calc-deep"
          label="Deep clean (1.5× the one-time price)"
          checked={deepClean}
          onChange={(e) => onDeepClean(e.target.checked)}
        />
        <fieldset>
          <legend className="label mb-2">Add-ons{deepClean ? " (included in deep clean)" : ""}</legend>
          <div className="space-y-1">
            {(Object.keys(ADDONS) as AddonKey[]).map((key) => (
              <CheckboxField
                key={key}
                name={`calc-addon-${key}`}
                label={`${ADDONS[key].label} (+$${ADDONS[key].priceCents / 100})`}
                checked={addons.includes(key)}
                disabled={deepClean}
                onChange={() => toggleAddon(key)}
              />
            ))}
          </div>
        </fieldset>
      </form>

      <div className="space-y-4">
        <PriceBox result={result} frequencyLabel={FREQUENCIES[frequency].label} perVisitLabel={frequency !== "one_time"} />
        <Link href={`/book?${params.toString()}`} className="btn-teal w-full">
          {result.kind === "custom_quote" ? "Request a custom quote" : "Book this cleaning"}
        </Link>
      </div>
    </div>
  );
}
