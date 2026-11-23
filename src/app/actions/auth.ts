"use server";

import { redirect } from "next/navigation";
import {
  createPasswordResetToken,
  createSession,
  destroySession,
  findValidResetToken,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { linkGuestBookings } from "@/lib/bookings";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  fieldErrorsFrom,
  FormState,
  formString,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation";
import { BRAND_NAME } from "../../../config/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await getClientIp();
  const limit = consumeRateLimit("register", ip);
  if (!limit.ok) {
    return { status: "error", message: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` };
  }

  const raw = {
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", errors: fieldErrorsFrom(parsed.error), values: { name: raw.name, email: raw.email, phone: raw.phone } };
  }

  const { name, email, phone, password } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      status: "error",
      errors: { email: "An account with this email already exists. Log in instead." },
      values: { name, email, phone },
    };
  }

  const user = await db.user.create({
    data: { email, name, phone, passwordHash: await hashPassword(password) },
  });
  await linkGuestBookings(user.id, email); // connects bookings made earlier as a guest
  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await getClientIp();
  const limit = consumeRateLimit("login", ip);
  if (!limit.ok) {
    return { status: "error", message: `Too many login attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` };
  }

  const raw = { email: formString(formData, "email"), password: formString(formData, "password") };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", errors: fieldErrorsFrom(parsed.error), values: { email: raw.email } };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Same message whether the email exists or not, so accounts cannot be probed.
  const ok = user && (await verifyPassword(parsed.data.password, user.passwordHash));
  if (!user || !ok) {
    return { status: "error", message: "Email or password is incorrect.", values: { email: raw.email } };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await getClientIp();
  const limit = consumeRateLimit("forgotPassword", ip);
  if (!limit.ok) {
    return { status: "error", message: "Too many requests. Please try again later." };
  }

  const parsed = forgotPasswordSchema.safeParse({ email: formString(formData, "email") });
  if (!parsed.success) {
    return { status: "error", errors: fieldErrorsFrom(parsed.error) };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = await createPasswordResetToken(user.id);
    await sendEmail({
      to: user.email,
      subject: `Reset your ${BRAND_NAME} password`,
      text: `Hi ${user.name},\n\nUse this link to set a new password (valid for 60 minutes):\n${SITE_URL}/reset-password?token=${token}\n\nIf you did not ask for this, you can ignore this email.`,
    });
  }

  // Always show the same confirmation, whether or not the account exists.
  return { status: "success", message: "If an account exists for that email, we've sent a reset link. Check your inbox." };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    token: formString(formData, "token"),
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  };
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", errors: fieldErrorsFrom(parsed.error) };
  }

  const userId = await findValidResetToken(parsed.data.token);
  if (!userId) {
    return { status: "error", message: "This reset link has expired or was already used. Request a new one." };
  }

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
    db.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId } }), // sign out everywhere after a reset
  ]);

  redirect("/login?reset=1");
}

/** Used by protected pages to bounce signed-out visitors to login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
