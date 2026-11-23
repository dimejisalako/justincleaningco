/**
 * SITE CONFIG — brand and contact details.
 * Phone and email come from environment variables so they can change without code edits.
 */

export const BRAND_NAME = "Justin Cleaning Co.";
export const TAGLINE = "Residential cleaning in Justin, Northlake, Trophy Club, Southlake and Westlake";

/** WhatsApp number in international format, digits only. Set in .env. */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

/** Contact email shown in the footer. PLACEHOLDER until set in .env. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@example.com";

/** Shown in the footer and on the legal pages. */
export const BUSINESS_ADDRESS = "Wildflower Ranch, Justin, Texas";

export const CANCELLATION_NOTICE_HOURS = 24;
export const PAUSE_NOTICE_DAYS = 7;
export const PAUSE_MAX_DAYS_PER_YEAR = 56; // 8 weeks per calendar year
export const TIME_WINDOWS = {
  morning: "Morning (8am–12pm)",
  afternoon: "Afternoon (12pm–4pm)",
  evening: "Evening (4pm–7pm)",
} as const;
