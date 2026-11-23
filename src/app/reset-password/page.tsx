import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth-forms";
import { findValidResetToken } from "@/lib/auth";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = token ? await findValidResetToken(token) : null;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-6 text-3xl font-extrabold text-navy">Set a new password</h1>
      {valid && token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="card space-y-3">
          <p className="text-navy">This reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="btn-primary w-full">Request a new link</Link>
        </div>
      )}
    </div>
  );
}
