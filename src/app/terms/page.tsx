import type { Metadata } from "next";
import { BRAND_NAME, BUSINESS_ADDRESS, CANCELLATION_NOTICE_HOURS, CONTACT_EMAIL, PAUSE_MAX_DAYS_PER_YEAR, PAUSE_NOTICE_DAYS } from "../../../config/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 px-4 py-12 text-navy">
      <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 font-bold text-amber-900">
        REVIEW WITH LEGAL. This is placeholder text, not final terms. Do not publish it as-is.
      </div>
      <h1 className="text-3xl font-extrabold">Terms of Service</h1>
      <p className="text-sm text-navy-600">Last updated: [DATE]</p>

      <h2 className="pt-4 text-xl font-bold">1. Services and area</h2>
      <p>
        {BRAND_NAME} provides residential cleaning in the service area listed on our website. We may decline bookings
        outside it. Business address: {BUSINESS_ADDRESS}.
      </p>

      <h2 className="pt-4 text-xl font-bold">2. Billing</h2>
      <p>
        Cleaning is billed per visit. There is no monthly subscription and no automatic charge. You pay after each visit
        by invoice or payment link. [REVIEW WITH LEGAL: late payment terms, taxes, and refunds.]
      </p>

      <h2 className="pt-4 text-xl font-bold">3. Recurring plans and pauses</h2>
      <p>
        Weekly, every-two-weeks and monthly plans may be paused for up to {PAUSE_MAX_DAYS_PER_YEAR} days (8 weeks) per
        calendar year, with at least {PAUSE_NOTICE_DAYS} days&apos; notice and no pause fee. Paused visits are released.
        The plan resumes at the same price when you unpause it.
      </p>

      <h2 className="pt-4 text-xl font-bold">4. Rescheduling and cancellation</h2>
      <p>
        Please give at least {CANCELLATION_NOTICE_HOURS} hours&apos; notice to cancel or reschedule a visit. [REVIEW WITH
        LEGAL: late-cancellation fee, if any.]
      </p>

      <h2 className="pt-4 text-xl font-bold">5. Access and safety</h2>
      <p>
        You agree to give us safe access to the home and to tell us about pets, alarms and hazards. [REVIEW WITH LEGAL:
        liability limits, damage claims and insurance.]
      </p>

      <h2 className="pt-4 text-xl font-bold">6. Messages</h2>
      <p>
        SMS and WhatsApp messages about bookings are sent only if you opt in. Message and data rates may apply. Reply
        STOP to opt out.
      </p>

      <h2 className="pt-4 text-xl font-bold">7. Contact</h2>
      <p>Questions about these terms: {CONTACT_EMAIL}.</p>

      <h2 className="pt-4 text-xl font-bold">8. Governing law</h2>
      <p>[REVIEW WITH LEGAL: governing law (Texas?) and dispute resolution.]</p>
    </article>
  );
}
