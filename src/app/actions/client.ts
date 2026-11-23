"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseDateOnly, todayInBusinessZone, visitStartInstant, addDays, formatDate } from "@/lib/dates";
import { syncPlanStatus } from "@/lib/bookings";
import { checkServiceArea } from "@/lib/service-area-check";
import { endDateOnResume, validatePauseRequest } from "@/lib/pause";
import {
  addressSaveSchema,
  fieldErrorsFrom,
  FormState,
  formString,
  pauseSchema,
  rescheduleSchema,
} from "@/lib/validation";
import { CANCELLATION_NOTICE_HOURS } from "../../../config/site";

/**
 * Server actions for the client dashboard. Every action checks the signed-in user
 * and only touches rows that belong to that user.
 */

const NOTICE_MS = CANCELLATION_NOTICE_HOURS * 60 * 60 * 1000;
const err = (message: string, errors?: Record<string, string>): FormState => ({ status: "error", message, errors });

async function requireUserOrRedirect() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function pausePlanAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserOrRedirect();
  const parsed = pauseSchema.safeParse({
    planId: formString(formData, "planId"),
    startDate: formString(formData, "startDate"),
    endDate: formString(formData, "endDate"),
  });
  if (!parsed.success) return err("Please check the dates.", fieldErrorsFrom(parsed.error));

  const plan = await db.plan.findFirst({
    where: { id: parsed.data.planId, userId: user.id },
    include: { pauses: true },
  });
  if (!plan || plan.status === "cancelled") return err("We couldn't find an active plan.");

  const start = parseDateOnly(parsed.data.startDate);
  const end = parseDateOnly(parsed.data.endDate);
  if (!start || !end) return err("Please check the dates.", { startDate: "Choose valid dates." });

  const today = todayInBusinessZone();
  const check = validatePauseRequest(
    today,
    { startDate: start, endDate: end },
    plan.pauses.map((p) => ({ startDate: p.startDate, endDate: p.endDate })),
  );
  if (!check.ok) return err(check.error);

  await db.pause.create({ data: { planId: plan.id, startDate: start, endDate: end } });

  // Visits inside the pause are released: they stop being scheduled and are not charged.
  await db.booking.updateMany({
    where: { planId: plan.id, scheduledFor: { gte: start, lte: end }, status: { in: ["requested", "confirmed"] } },
    data: { status: "paused" },
  });
  await syncPlanStatus(plan.id, today);
  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return {
    status: "success",
    message: `Paused ${formatDate(start)} to ${formatDate(end)} (${check.days} days). No fee. Your plan resumes at the same price.`,
  };
}

export async function resumePlanAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserOrRedirect();
  const planId = formString(formData, "planId");
  const plan = await db.plan.findFirst({ where: { id: planId, userId: user.id }, include: { pauses: true } });
  if (!plan || plan.status === "cancelled") return err("We couldn't find an active plan.");

  const today = todayInBusinessZone();
  const open = plan.pauses.filter((p) => !p.resumedAt && p.endDate >= today);
  if (open.length === 0) return err("This plan has no pause to end.");

  for (const pause of open) {
    const newEnd = endDateOnResume(today, pause);
    if (newEnd === null) {
      // Pause had not started yet: remove it entirely (no days used).
      await db.pause.delete({ where: { id: pause.id } });
    } else {
      // Ends the pause early; days already paused still count toward the yearly limit.
      await db.pause.update({ where: { id: pause.id }, data: { endDate: newEnd, resumedAt: new Date() } });
    }
  }

  // Visits that were released for the pause and are still ahead go back on the schedule.
  // They are set to "requested" so the owner re-confirms them.
  await db.booking.updateMany({
    where: { planId: plan.id, status: "paused", scheduledFor: { gte: today } },
    data: { status: "requested" },
  });
  await db.plan.update({ where: { id: plan.id }, data: { status: "active" } });
  await syncPlanStatus(plan.id, today);
  revalidatePath("/dashboard");
  revalidatePath("/admin");

  return { status: "success", message: "Your plan is resumed at the same price." };
}

export async function rescheduleVisitAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserOrRedirect();
  const parsed = rescheduleSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    newDate: formString(formData, "newDate"),
    timeWindow: formString(formData, "timeWindow"),
  });
  if (!parsed.success) return err("Please check the new date and time.", fieldErrorsFrom(parsed.error));

  const booking = await db.booking.findFirst({ where: { id: parsed.data.bookingId, userId: user.id } });
  if (!booking || !["requested", "confirmed"].includes(booking.status)) {
    return err("This visit can't be changed.");
  }

  const now = new Date();
  if (visitStartInstant(booking.scheduledFor, booking.timeWindow).getTime() - now.getTime() < NOTICE_MS) {
    return err(`Changes need ${CANCELLATION_NOTICE_HOURS} hours' notice. For a visit this soon, message us on WhatsApp.`);
  }

  const newDate = parseDateOnly(parsed.data.newDate);
  if (!newDate || newDate < addDays(todayInBusinessZone(), 1)) {
    return err("Choose a date from tomorrow onward.", { newDate: "Choose a date from tomorrow onward." });
  }

  await db.booking.update({
    where: { id: booking.id },
    data: { scheduledFor: newDate, timeWindow: parsed.data.timeWindow },
  });
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { status: "success", message: `Visit moved to ${formatDate(newDate)}.` };
}

export async function cancelVisitAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserOrRedirect();
  const bookingId = formString(formData, "bookingId");
  const booking = await db.booking.findFirst({ where: { id: bookingId, userId: user.id } });
  if (!booking || !["requested", "confirmed"].includes(booking.status)) {
    return err("This visit can't be cancelled.");
  }

  if (visitStartInstant(booking.scheduledFor, booking.timeWindow).getTime() - Date.now() < NOTICE_MS) {
    return err(`Cancellations need ${CANCELLATION_NOTICE_HOURS} hours' notice. For a visit this soon, message us on WhatsApp.`);
  }

  await db.booking.update({ where: { id: booking.id }, data: { status: "cancelled" } });
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { status: "success", message: "Visit cancelled." };
}

export async function saveAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUserOrRedirect();
  const raw = {
    label: formString(formData, "label"),
    line1: formString(formData, "line1"),
    city: formString(formData, "city"),
    zip: formString(formData, "zip"),
  };
  const parsed = addressSaveSchema.safeParse(raw);
  if (!parsed.success) return err("Please check the address.", fieldErrorsFrom(parsed.error));

  const area = await checkServiceArea({ line1: parsed.data.line1, city: parsed.data.city, zip: parsed.data.zip });
  if (!area.ok) return err(area.reason, { line1: area.reason });

  const count = await db.address.count({ where: { userId: user.id } });
  if (count >= 10) return err("You can save up to 10 addresses.");

  await db.address.create({
    data: { userId: user.id, label: parsed.data.label, line1: parsed.data.line1, city: parsed.data.city, zip: parsed.data.zip },
  });
  revalidatePath("/dashboard");
  return { status: "success", message: "Address saved." };
}
