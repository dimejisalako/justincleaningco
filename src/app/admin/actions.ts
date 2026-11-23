"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkAdminPassword, clearAdminCookie, isAdmin, setAdminCookie } from "@/lib/admin";
import { db } from "@/lib/db";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { adminStatusSchema, formString, FormState } from "@/lib/validation";

export async function adminLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await getClientIp();
  const limit = consumeRateLimit("adminLogin", ip);
  if (!limit.ok) return { status: "error", message: "Too many attempts. Try again later." };

  if (!checkAdminPassword(formString(formData, "password"))) {
    return { status: "error", message: "Incorrect password." };
  }
  await setAdminCookie();
  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await clearAdminCookie();
  redirect("/admin");
}

/** Owner actions on a booking: confirm, mark complete, cancel, and record payment status. */
export async function updateBookingAction(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");

  const parsed = adminStatusSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    status: formString(formData, "status"),
    paymentStatus: formString(formData, "paymentStatus") || undefined,
  });
  if (!parsed.success) return;

  const data: { status: string; paymentStatus?: string } = { status: parsed.data.status };
  if (parsed.data.paymentStatus) data.paymentStatus = parsed.data.paymentStatus;

  await db.booking.update({ where: { id: parsed.data.bookingId }, data });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
