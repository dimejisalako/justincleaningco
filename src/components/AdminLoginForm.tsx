"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/app/dimeji/actions";
import { FormErrorSummary, TextField } from "@/components/fields";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/lib/validation";

export function AdminLoginForm() {
  const [state, action] = useActionState<FormState, FormData>(adminLoginAction, { status: "idle" });
  return (
    <form action={action} className="card space-y-5" noValidate>
      <FormErrorSummary message={state.status === "error" ? state.message : undefined} />
      <TextField name="password" label="Admin password" type="password" autoComplete="current-password" required />
      <SubmitButton pendingText="Checking…">Enter admin</SubmitButton>
    </form>
  );
}
