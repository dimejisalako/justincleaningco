"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, parseDateOnly, todayInBusinessZone } from "@/lib/dates";
import { isRecurring, newConfirmationCode } from "@/lib/bookings";
import { sendEmail } from "@/lib/email";
import { calculatePrice } from "@/lib/pricing";
import { consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  bookingSchema,
  fieldErrorsFrom,
  FormState,
  formBool,
  formList,
  formString,
} from "@/lib/validation";
import { BRAND_NAME, TIME_WINDOWS } from "../../../config/site";
import { ADDONS, FrequencyKey, SqftTierKey, AddonKey } from "../../../config/pricing";
import { checkServiceArea } from "@/lib/service-area-check";
import { formatMoney, formatDate } from "@/lib/dates";

/**
 * Public booking. No account needed.
 * The price is recalculated here on the server; the price shown in the browser is only a preview.
 */
export async function createBookingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = await getClientIp();
  const limit = consumeRateLimit("booking", ip);
  if (!limit.ok) {
    return { status: "error", message: "Too many booking attempts from your connection. Please try again later or message us on WhatsApp." };
  }

  const raw = {
    name: formString(formData, "name"),
    phone: formString(formData, "phone"),
    email: formString(formData, "email"),
    line1: formString(formData, "line1"),
    city: formString(formData, "city"),
    zip: formString(formData, "zip"),
    sqftTier: formString(formData, "sqftTier"),
    frequency: formString(formData, "frequency"),
    deepClean: formBool(formData, "deepClean"),
    addons: formList(formData, "addons"),
    scheduledFor: formString(formData, "scheduledFor"),
    timeWindow: formString(formData, "timeWindow"),
    accessNotes: formString(formData, "accessNotes"),
    smsConsent: formBool(formData, "smsConsent"),
  };
  const useReward = formBool(formData, "useReward");
  // Echo the submitted values back so the form can be re-filled after an error.
  const values: Record<string, string> = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [
      k,
      typeof v === "boolean" ? (v ? "on" : "") : Array.isArray(v) ? v.join(",") : v,
    ]),
  );

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", errors: fieldErrorsFrom(parsed.error), values, message: "Please check the highlighted fields." };
  }
  const b = parsed.data;

  const area = await checkServiceArea({ line1: b.line1, city: b.city, zip: b.zip });
  if (!area.ok) {
    return { status: "error", errors: { line1: area.reason }, values, message: "Please check the highlighted fields." };
  }

  // Deep clean includes every add-on, so the add-on list is always the full set for a deep clean.
  // A free deep clean reward is always a deep clean, so it also includes every add-on.
  const deepApplied = b.deepClean || useReward;
  const addonsApplied = deepApplied ? (Object.keys(ADDONS) as AddonKey[]) : (b.addons as AddonKey[]);

  // The visit must be tomorrow or later (business timezone).
  const visitDate = parseDateOnly(b.scheduledFor);
  const earliest = addDays(todayInBusinessZone(), 1);
  if (!visitDate || visitDate < earliest) {
    return { status: "error", errors: { scheduledFor: "Choose a date from tomorrow onward." }, values, message: "Please check the highlighted fields." };
  }

  const price = calculatePrice({
    tier: b.sqftTier as SqftTierKey,
    frequency: b.frequency as FrequencyKey,
    deepClean: deepApplied,
    addons: addonsApplied,
  });
  const isCustomQuote = price.kind === "custom_quote";
  const priceCents = price.kind === "priced" ? price.totalCents : 0;

  const user = await getCurrentUser();
  const confirmationCode = newConfirmationCode();

  // Redeeming a free deep clean: the visit costs nothing and uses the client's oldest available reward.
  let reward: { id: string } | null = null;
  if (useReward) {
    if (!user) {
      return { status: "error", message: "Log in to use a free deep clean.", values };
    }
    if (b.frequency !== "one_time") {
      return {
        status: "error",
        errors: { frequency: "Free deep cleans apply to one-time bookings. Choose One-time to use your reward." },
        values,
        message: "Please check the highlighted fields.",
      };
    }
    if (isCustomQuote) {
      return { status: "error", message: "Free deep cleans can't be applied to homes that need a custom quote.", values };
    }
    reward = await db.reward.findFirst({
      where: { userId: user.id, status: "available" },
      orderBy: { earnedOn: "asc" },
      select: { id: true },
    });
    if (!reward) {
      return { status: "error", message: "You don't have a free deep clean available right now.", values };
    }
  }

  const booking = await db.booking.create({
    data: {
      confirmationCode,
      userId: user?.id ?? null,
      name: b.name,
      phone: b.phone,
      email: b.email,
      addressLine1: b.line1,
      city: b.city,
      zip: b.zip,
      sqftTier: b.sqftTier,
      frequency: b.frequency,
      deepClean: deepApplied,
      addons: JSON.stringify(addonsApplied),
      scheduledFor: visitDate,
      timeWindow: b.timeWindow,
      accessNotes: b.accessNotes,
      smsConsent: b.smsConsent,
      status: "requested",
      priceCents: reward ? 0 : priceCents,
      isCustomQuote,
      isRewardVisit: !!reward,
    },
  });

  if (reward) {
    await db.reward.update({
      where: { id: reward.id },
      data: { status: "redeemed", redeemedBookingId: booking.id, redeemedAt: new Date() },
    });
  }

  // Recurring bookings from signed-in clients also create a plan so pauses can apply to it.
  if (user && isRecurring(b.frequency)) {
    const plan = await db.plan.create({
      data: {
        userId: user.id,
        frequency: b.frequency,
        priceCents,
        addressLine1: b.line1,
        city: b.city,
        zip: b.zip,
        sqftTier: b.sqftTier,
        addons: JSON.stringify(addonsApplied),
        deepClean: b.deepClean,
      },
    });
    await db.booking.update({ where: { id: booking.id }, data: { planId: plan.id } });
  }

  const priceLine = reward
    ? "This is your free deep clean, earned as a reward. There is no charge for this visit."
    : isCustomQuote
      ? "Custom quote: we'll contact you with a price."
      : `Price for this visit: ${formatMoney(priceCents)} (payable after the visit by invoice or payment link).`;

  await sendEmail({
    to: b.email,
    subject: `Your ${BRAND_NAME} booking request: ${confirmationCode}`,
    text: [
      `Hi ${b.name},`,
      "",
      `Thanks for booking with ${BRAND_NAME}. We've received your request:`,
      `Date: ${formatDate(visitDate)}`,
      `Time: ${TIME_WINDOWS[b.timeWindow as keyof typeof TIME_WINDOWS]}`,
      `Address: ${b.line1}, ${b.city}, TX ${b.zip}`,
      priceLine,
      "",
      `Confirmation code: ${confirmationCode}`,
      "We'll confirm your visit shortly. Nothing is charged automatically.",
    ].join("\n"),
  });

  redirect(`/book/confirmation?code=${confirmationCode}`);
}
