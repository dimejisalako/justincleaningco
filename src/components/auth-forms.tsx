"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
} from "@/app/actions/auth";
import { FormErrorSummary, TextField } from "@/components/fields";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/lib/validation";

const idle: FormState = { status: "idle" };

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, idle);
  const errors = state.status === "error" ? state.errors : undefined;
  const v = state.status === "error" ? state.values ?? {} : {};
  return (
    <form action={action} className="card space-y-5" noValidate>
      <FormErrorSummary message={state.status === "error" ? state.message : undefined} errors={errors} />
      <TextField name="name" label="Full name" autoComplete="name" required defaultValue={v.name ?? ""} error={errors?.name} />
      <TextField name="email" label="Email" type="email" inputMode="email" autoComplete="email" required defaultValue={v.email ?? ""} error={errors?.email} />
      <TextField name="phone" label="Mobile phone" type="tel" autoComplete="tel" required defaultValue={v.phone ?? ""} error={errors?.phone} />
      <TextField name="password" label="Password" type="password" autoComplete="new-password" required hint="At least 10 characters." error={errors?.password} />
      <TextField name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" required error={errors?.confirmPassword} />
      <SubmitButton pendingText="Creating your account…">Create account</SubmitButton>
      <p className="text-center text-sm text-navy-600">
        Already have an account? <Link className="font-semibold underline" href="/login">Log in</Link>
      </p>
    </form>
  );
}

export function LoginForm({ resetDone }: { resetDone: boolean }) {
  const [state, action] = useActionState(loginAction, idle);
  const errors = state.status === "error" ? state.errors : undefined;
  const v = state.status === "error" ? state.values ?? {} : {};
  return (
    <form action={action} className="card space-y-5" noValidate>
      {resetDone ? (
        <p role="status" className="rounded-lg bg-teal-50 p-3 text-sm font-semibold text-teal-700">
          Your password has been updated. Log in with your new password.
        </p>
      ) : null}
      <FormErrorSummary message={state.status === "error" ? state.message : undefined} errors={errors} />
      <TextField name="email" label="Email" type="email" inputMode="email" autoComplete="email" required defaultValue={v.email ?? ""} error={errors?.email} />
      <TextField name="password" label="Password" type="password" autoComplete="current-password" required error={errors?.password} />
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      <div className="flex flex-col items-center justify-between gap-2 text-sm sm:flex-row">
        <Link className="font-semibold underline" href="/forgot-password">Forgot password?</Link>
        <Link className="font-semibold underline" href="/register">Create an account</Link>
      </div>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, idle);
  if (state.status === "success") {
    return <p role="status" className="card text-navy">{state.message}</p>;
  }
  const errors = state.status === "error" ? state.errors : undefined;
  return (
    <form action={action} className="card space-y-5" noValidate>
      <FormErrorSummary message={state.status === "error" ? state.message : undefined} errors={errors} />
      <TextField name="email" label="Email" type="email" inputMode="email" autoComplete="email" required error={errors?.email} />
      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, idle);
  const errors = state.status === "error" ? state.errors : undefined;
  return (
    <form action={action} className="card space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <FormErrorSummary message={state.status === "error" ? state.message : undefined} errors={errors} />
      <TextField name="password" label="New password" type="password" autoComplete="new-password" required hint="At least 10 characters." error={errors?.password} />
      <TextField name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" required error={errors?.confirmPassword} />
      <SubmitButton pendingText="Saving…">Set new password</SubmitButton>
    </form>
  );
}
