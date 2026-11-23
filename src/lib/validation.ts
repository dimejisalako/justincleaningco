import { z } from "zod";
import { ADDONS, FREQUENCIES, SQFT_TIERS } from "../../config/pricing";
import { TIME_WINDOWS } from "../../config/site";
import { PAYMENT_STATUSES } from "./constants";

/** All server-side input validation lives here. The browser sees the same messages. */

const sqftKeys = SQFT_TIERS.map((t) => t.key) as [string, ...string[]];
const frequencyKeys = Object.keys(FREQUENCIES) as [string, ...string[]];
const addonKeys = Object.keys(ADDONS) as [string, ...string[]];
const timeWindowKeys = Object.keys(TIME_WINDOWS) as [string, ...string[]];

export const emailSchema = z
  .string({ required_error: "Enter your email address." })
  .trim()
  .toLowerCase()
  .email("Enter a valid email address, like name@example.com.")
  .max(254);

/** Accepts US phone numbers with or without country code and punctuation. */
export const phoneSchema = z
  .string({ required_error: "Enter a phone number." })
  .trim()
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
  }, "Enter a 10-digit US phone number, like (214) 555-0123.")
  .transform((v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length === 11 ? digits.slice(1) : digits;
  });

export const passwordSchema = z
  .string({ required_error: "Enter a password." })
  .min(10, "Use at least 10 characters.")
  .max(200, "Use 200 characters or fewer.");

const dateOnly = z
  .string({ required_error: "Choose a date." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.");

/**
 * Address format only. Whether the address is inside the service area (listed ZIP or
 * within the radius) is checked separately by checkServiceArea() because it needs a lookup.
 */
const addressObject = z.object({
  line1: z.string().trim().min(5, "Enter the street address.").max(150),
  city: z.string().trim().min(2, "Enter the city.").max(60),
  zip: z.string().trim().regex(/^\d{5}$/, "Enter a 5-digit ZIP code."),
});

export const addressFieldsSchema = addressObject;

export const bookingSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(100),
    phone: phoneSchema,
    email: emailSchema,
    ...addressObject.shape,
    sqftTier: z.enum(sqftKeys, { errorMap: () => ({ message: "Choose your home size." }) }),
    frequency: z.enum(frequencyKeys, { errorMap: () => ({ message: "Choose how often you want cleaning." }) }),
    deepClean: z.boolean().default(false),
    addons: z.array(z.enum(addonKeys)).default([]),
    scheduledFor: dateOnly,
    timeWindow: z.enum(timeWindowKeys, { errorMap: () => ({ message: "Choose a time window." }) }),
    accessNotes: z.string().trim().max(500, "Keep access notes to 500 characters.").default(""),
    smsConsent: z.boolean().default(false),
  });

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(100),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "This reset link is invalid."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const pauseSchema = z
  .object({
    planId: z.string().min(1),
    startDate: dateOnly,
    endDate: dateOnly,
  });

export const rescheduleSchema = z.object({
  bookingId: z.string().min(1),
  newDate: dateOnly,
  timeWindow: z.enum(timeWindowKeys, { errorMap: () => ({ message: "Choose a time window." }) }),
});

export const addressSaveSchema = addressFieldsSchema.and(
  z.object({ label: z.string().trim().min(1, "Give this address a label.").max(40) }),
);

export const adminStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["confirmed", "completed", "cancelled"]),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
});

export type FieldErrors = Record<string, string>;

/** Turns Zod issues into { fieldName: message } for display next to each input. */
export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Shape returned by every form action; the UI reads `errors` and `message`. */
export type FormState =
  | { status: "idle" }
  | { status: "error"; message?: string; errors?: FieldErrors; values?: Record<string, string> }
  | { status: "success"; message?: string };

/** Reads a FormData field as a string ("" if missing). Checkboxes: "on" means true. */
export function formString(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export function formBool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export function formList(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((v): v is string => typeof v === "string");
}
