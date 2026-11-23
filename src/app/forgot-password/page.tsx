import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold text-navy">Forgot your password?</h1>
      <p className="mt-2 mb-6 text-navy-600">Enter your account email and we&apos;ll send you a link to set a new password.</p>
      <ForgotPasswordForm />
    </div>
  );
}
