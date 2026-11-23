"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button that disables itself while the form is sending.
 * Uses the form's pending state, so it must be placed inside a <form>.
 */
export function SubmitButton({
  children,
  pendingText = "Please wait…",
  className = "btn-primary w-full",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}
