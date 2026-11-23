import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/dates";
import { TIME_WINDOWS } from "../../../../config/site";
import { FREQUENCIES, FrequencyKey } from "../../../../config/pricing";

export const metadata: Metadata = { title: "Booking request received" };

/** Confirmation page shown after a guest booking. The code is random and not personal data. */
export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const booking = code
    ? await db.booking.findUnique({ where: { confirmationCode: code.toUpperCase() } })
    : null;

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-extrabold text-navy">We couldn&apos;t find that booking</h1>
        <p className="mt-3 text-navy-600">Check the confirmation code in your email, or book again.</p>
        <Link href="/book" className="btn-primary mt-6">Book a cleaning</Link>
      </div>
    );
  }

  const frequency = FREQUENCIES[booking.frequency as FrequencyKey]?.label ?? booking.frequency;
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm font-bold uppercase tracking-wider text-teal-700">Request received</p>
      <h1 className="mt-2 text-3xl font-extrabold text-navy">Thanks, {booking.name.split(" ")[0]}!</h1>
      <p className="mt-3 text-navy-600">
        We&apos;ve received your booking request. We&apos;ll confirm your visit by email or text. A confirmation email
        is on its way to {booking.email}.
      </p>

      <div className="card mt-8">
        <p className="text-sm text-navy-600">Confirmation code</p>
        <p className="font-mono text-2xl font-bold tracking-wider text-navy">{booking.confirmationCode}</p>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-navy">Date</dt>
            <dd>{formatDate(booking.scheduledFor)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy">Time window</dt>
            <dd>{TIME_WINDOWS[booking.timeWindow as keyof typeof TIME_WINDOWS] ?? booking.timeWindow}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy">Address</dt>
            <dd>{booking.addressLine1}, {booking.city}, TX {booking.zip}</dd>
          </div>
          <div>
            <dt className="font-semibold text-navy">How often</dt>
            <dd>{frequency}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-semibold text-navy">Price for this visit</dt>
            <dd>
              {booking.isCustomQuote
                ? "Custom quote. We'll contact you with a price."
                : `${formatMoney(booking.priceCents)}, payable after the visit by invoice or payment link.`}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-secondary">Back to home</Link>
        <Link href="/register" className="btn-primary">Create an account to manage visits</Link>
      </div>
    </div>
  );
}
