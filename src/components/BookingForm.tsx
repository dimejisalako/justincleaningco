"use client";

import { useActionState, useState } from "react";
import { ADDONS, AddonKey, FREQUENCIES, FrequencyKey, SQFT_TIERS, SqftTierKey } from "../../config/pricing";
import { SERVICE_CITIES, SERVICE_RADIUS_MILES } from "../../config/service-area";
import { TIME_WINDOWS } from "../../config/site";
import { createBookingAction } from "@/app/actions/booking";
import { calculatePrice } from "@/lib/pricing";
import { CheckboxField, FormErrorSummary, SelectField, TextAreaField, TextField } from "@/components/fields";
import { PriceBox } from "@/components/PriceBox";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/lib/validation";

export interface BookingDefaults {
  name?: string;
  phone?: string;
  email?: string;
  tier?: string;
  frequency?: string;
  deep?: boolean;
  addons?: string[];
}

const initialState: FormState = { status: "idle" };

/**
 * Guest booking form (also used by signed-in clients).
 * The price preview is calculated in the browser with the same function the server uses;
 * the server recalculates the price on submit and never trusts the browser's number.
 */
export function BookingForm({
  defaults,
  minDate,
  maxDate,
}: {
  defaults: BookingDefaults;
  minDate: string;
  maxDate: string;
}) {
  const [state, formAction] = useActionState(createBookingAction, initialState);
  const v = state.status === "error" ? state.values ?? {} : {};
  const errors = state.status === "error" ? state.errors : undefined;

  const [tier, setTier] = useState<SqftTierKey>(
    (SQFT_TIERS.find((t) => t.key === defaults.tier)?.key ?? "1500_2500") as SqftTierKey,
  );
  const [frequency, setFrequency] = useState<FrequencyKey>(
    (defaults.frequency && defaults.frequency in FREQUENCIES ? defaults.frequency : "one_time") as FrequencyKey,
  );
  const [deepClean, setDeepClean] = useState(!!defaults.deep);
  const [addons, setAddons] = useState<AddonKey[]>(
    defaults.deep
      ? (Object.keys(ADDONS) as AddonKey[]) // deep clean includes every add-on
      : (defaults.addons ?? []).filter((a): a is AddonKey => a in ADDONS),
  );

  const preview = calculatePrice({ tier, frequency, deepClean, addons });

  const toggleAddon = (key: AddonKey) =>
    setAddons((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  // Deep clean includes every add-on: selecting it ticks them all and greys them out.
  const onDeepClean = (checked: boolean) => {
    setDeepClean(checked);
    setAddons(checked ? (Object.keys(ADDONS) as AddonKey[]) : []);
  };

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_340px]" noValidate>
      <div className="space-y-8">
        <FormErrorSummary message={state.status === "error" ? state.message : undefined} errors={errors} />

        <fieldset className="card space-y-5">
          <legend className="px-1 text-lg font-bold">1. Your details</legend>
          <TextField name="name" label="Full name" autoComplete="name" required defaultValue={v.name ?? defaults.name ?? ""} error={errors?.name} />
          <TextField name="phone" label="Mobile phone" type="tel" inputMode="tel" autoComplete="tel" required hint="US number. We may text you about this booking if you consent below." defaultValue={v.phone ?? defaults.phone ?? ""} error={errors?.phone} />
          <TextField name="email" label="Email" type="email" inputMode="email" autoComplete="email" required defaultValue={v.email ?? defaults.email ?? ""} error={errors?.email} />
        </fieldset>

        <fieldset className="card space-y-5">
          <legend className="px-1 text-lg font-bold">2. Where we&apos;ll clean</legend>
          <TextField name="line1" label="Street address" autoComplete="address-line1" required defaultValue={v.line1 ?? ""} error={errors?.line1} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="city"
              label="City"
              autoComplete="address-level2"
              required
              defaultValue={v.city ?? ""}
              error={errors?.city}
              hint={`We clean in ${SERVICE_CITIES.map((c) => c.name).join(", ")} and within ${SERVICE_RADIUS_MILES} miles of them.`}
            />
            <TextField name="zip" label="ZIP code" inputMode="numeric" autoComplete="postal-code" maxLength={5} required defaultValue={v.zip ?? ""} error={errors?.zip} />
          </div>
          <TextAreaField
            name="accessNotes"
            label="Access notes (optional)"
            hint="Gate or door codes, where to park, pets, alarm instructions. Keep it under 500 characters."
            maxLength={500}
            defaultValue={v.accessNotes ?? ""}
            error={errors?.accessNotes}
          />
        </fieldset>

        <fieldset className="card space-y-5">
          <legend className="px-1 text-lg font-bold">3. Your cleaning</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              name="sqftTier"
              label="Home size"
              required
              value={tier}
              onChange={(e) => setTier(e.target.value as SqftTierKey)}
              options={SQFT_TIERS.map((t) => ({ value: t.key, label: t.label }))}
              error={errors?.sqftTier}
            />
            <SelectField
              name="frequency"
              label="How often"
              required
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as FrequencyKey)}
              options={Object.entries(FREQUENCIES).map(([value, f]) => ({
                value,
                label: f.discount > 0 ? `${f.label} (${Math.round(f.discount * 100)}% off)` : f.label,
              }))}
              error={errors?.frequency}
            />
          </div>
          <CheckboxField
            name="deepClean"
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
                  name="addons"
                  value={key}
                  label={`${ADDONS[key].label} (+$${ADDONS[key].priceCents / 100})`}
                  checked={addons.includes(key)}
                  disabled={deepClean}
                  onChange={() => toggleAddon(key)}
                />
              ))}
            </div>
          </fieldset>
        </fieldset>

        <fieldset className="card space-y-5">
          <legend className="px-1 text-lg font-bold">4. When</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              name="scheduledFor"
              label="Preferred date"
              type="date"
              required
              min={minDate}
              max={maxDate}
              defaultValue={v.scheduledFor ?? ""}
              error={errors?.scheduledFor}
              hint="Tomorrow or later."
            />
            <SelectField
              name="timeWindow"
              label="Time window"
              required
              placeholder="Choose a window"
              defaultValue={v.timeWindow ?? ""}
              options={Object.entries(TIME_WINDOWS).map(([value, label]) => ({ value, label }))}
              error={errors?.timeWindow}
            />
          </div>
          <CheckboxField
            name="smsConsent"
            defaultChecked={v.smsConsent === "on"}
            label="I agree to receive SMS and WhatsApp messages about this booking (optional). Message and data rates may apply. You can reply STOP to opt out."
          />
        </fieldset>

        <SubmitButton pendingText="Sending your request…" className="btn-primary w-full lg:hidden">
          Request booking
        </SubmitButton>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <PriceBox result={preview} frequencyLabel={FREQUENCIES[frequency].label} perVisitLabel={frequency !== "one_time"} />
        <div className="hidden lg:block">
          <SubmitButton pendingText="Sending your request…" className="btn-primary w-full">
            Request booking
          </SubmitButton>
        </div>
        <p className="text-xs text-navy-600">
          This is a booking request. We confirm each visit before it happens. Nothing is charged automatically.
        </p>
      </aside>
    </form>
  );
}
