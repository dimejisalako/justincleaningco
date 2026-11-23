"use client";

import { useActionState } from "react";
import {
  cancelVisitAction,
  pausePlanAction,
  rescheduleVisitAction,
  resumePlanAction,
  saveAddressAction,
} from "@/app/actions/client";
import { FormErrorSummary, SelectField, TextField } from "@/components/fields";
import { SubmitButton } from "@/components/SubmitButton";
import { TIME_WINDOWS } from "../../config/site";
import type { FormState } from "@/lib/validation";

const idle: FormState = { status: "idle" };

function Feedback({ state }: { state: FormState }) {
  if (state.status === "success" && state.message) {
    return <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm font-semibold text-teal-700">{state.message}</p>;
  }
  if (state.status === "error") {
    return <FormErrorSummary message={state.message} errors={state.errors} />;
  }
  return null;
}

/** Pause form: start and end dates, inclusive. Limits are enforced on the server. */
export function PauseForm({ planId, minDate }: { planId: string; minDate: string }) {
  const [state, action] = useActionState(pausePlanAction, idle);
  const errors = state.status === "error" ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="planId" value={planId} />
      <p className="text-sm text-navy-600">
        Up to 8 weeks (56 days) per calendar year. Start at least 7 days from today. No pause fee.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="startDate" label="Pause starts" type="date" required min={minDate} error={errors?.startDate} />
        <TextField name="endDate" label="Pause ends (inclusive)" type="date" required min={minDate} error={errors?.endDate} />
      </div>
      <Feedback state={state} />
      <SubmitButton pendingText="Pausing…" className="btn-secondary">Pause plan</SubmitButton>
    </form>
  );
}

export function ResumeForm({ planId }: { planId: string }) {
  const [state, action] = useActionState(resumePlanAction, idle);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="planId" value={planId} />
      <Feedback state={state} />
      <SubmitButton pendingText="Resuming…" className="btn-teal">Resume plan</SubmitButton>
    </form>
  );
}

export function RescheduleForm({ bookingId, minDate }: { bookingId: string; minDate: string }) {
  const [state, action] = useActionState(rescheduleVisitAction, idle);
  const errors = state.status === "error" ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="newDate" label="New date" type="date" required min={minDate} error={errors?.newDate} />
        <SelectField
          name="timeWindow"
          label="New time window"
          required
          placeholder="Choose a window"
          options={Object.entries(TIME_WINDOWS).map(([value, label]) => ({ value, label }))}
          error={errors?.timeWindow}
        />
      </div>
      <Feedback state={state} />
      <SubmitButton pendingText="Saving…" className="btn-secondary">Reschedule visit</SubmitButton>
    </form>
  );
}

export function CancelVisitForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(cancelVisitAction, idle);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Feedback state={state} />
      <SubmitButton pendingText="Cancelling…" className="btn-secondary">Cancel visit</SubmitButton>
    </form>
  );
}

export function AddressForm() {
  const [state, action] = useActionState(saveAddressAction, idle);
  const errors = state.status === "error" ? state.errors : undefined;
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="label" label="Label" required placeholder="Home, Mom's house…" error={errors?.label} />
        <TextField name="line1" label="Street address" required autoComplete="address-line1" error={errors?.line1} />
        <TextField name="city" label="City" required autoComplete="address-level2" error={errors?.city} />
        <TextField name="zip" label="ZIP code" required inputMode="numeric" maxLength={5} error={errors?.zip} />
      </div>
      <Feedback state={state} />
      <SubmitButton pendingText="Saving…" className="btn-secondary">Save address</SubmitButton>
    </form>
  );
}
