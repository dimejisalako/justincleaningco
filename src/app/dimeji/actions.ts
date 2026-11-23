"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkAdminPassword, clearAdminCookie, isAdmin, setAdminCookie } from "@/lib/admin";
import { db } from "@/lib/db";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { adminStatusSchema, formString, FormState } from "@/lib/validation";
import { syncRewards } from "@/lib/rewards-sync";
import { todayInBusinessZone } from "@/lib/dates";

export async function adminLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await getClientIp();
  const limit = consumeRateLimit("adminLogin", ip);
  if (!limit.ok) return { status: "error", message: "Too many attempts. Try again later." };

  if (!checkAdminPassword(formString(formData, "password"))) {
    return { status: "error", message: "Incorrect password." };
  }
  await setAdminCookie();
  redirect("/dimeji");
}

export async function adminLogoutAction(): Promise<void> {
  await clearAdminCookie();
  redirect("/dimeji");
}

/** Owner actions on a booking: confirm, mark complete, cancel, and record payment status. */
export async function updateBookingAction(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/dimeji");

  const parsed = adminStatusSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    status: formString(formData, "status"),
    paymentStatus: formString(formData, "paymentStatus") || undefined,
  });
  if (!parsed.success) return;

  const data: { status: string; paymentStatus?: string } = { status: parsed.data.status };
  if (parsed.data.paymentStatus) data.paymentStatus = parsed.data.paymentStatus;

  const booking = await db.booking.update({ where: { id: parsed.data.bookingId }, data });
  if (booking.userId) await syncRewards(booking.userId); // completing a visit can earn a reward
  revalidatePath("/dimeji", "layout");
  revalidatePath("/dashboard");
}

/** Owner grants a free deep clean by hand (for example as a goodwill gesture). */
export async function grantRewardAction(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/dimeji");
  const userId = formString(formData, "userId");
  const note = formString(formData, "note").trim().slice(0, 200);
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return;
  await db.reward.create({
    data: { userId, source: "manual", earnedOn: todayInBusinessZone(), note: note || "Granted by owner" },
  });
  revalidatePath(`/dimeji/users/${userId}`);
}

/** Owner voids an unused reward (only available rewards can be voided). */
export async function voidRewardAction(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/dimeji");
  const rewardId = formString(formData, "rewardId");
  const userId = formString(formData, "userId");
  await db.reward.updateMany({ where: { id: rewardId, status: "available" }, data: { status: "void" } });
  revalidatePath(`/dimeji/users/${userId}`);
}
