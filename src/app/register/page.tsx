import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold text-navy">Create your client account</h1>
      <p className="mt-2 mb-6 text-navy-600">
        Manage visits, pause a recurring plan, and save your addresses. Bookings you made earlier with the same email
        will be linked to your account.
      </p>
      <RegisterForm />
    </div>
  );
}
