import type { Metadata } from "next";
import { BookingForm, BookingDefaults } from "@/components/BookingForm";
import { getCurrentUser } from "@/lib/auth";
import { addDays, toDateOnly, todayInBusinessZone } from "@/lib/dates";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Book a cleaning" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Booking page. Query parameters (from the home calculator) pre-fill the choices. */
export default async function BookPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await getCurrentUser();

  const today = todayInBusinessZone();
  const defaults: BookingDefaults = {
    name: user?.name,
    phone: user?.phone,
    email: user?.email,
    tier: first(sp.tier),
    frequency: first(sp.frequency),
    deep: first(sp.deep) === "1",
    addons: first(sp.addons)?.split(",").filter(Boolean),
  };

  const freeDeepCleans = user
    ? await db.reward.count({ where: { userId: user.id, status: "available" } })
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-navy">Book a cleaning</h1>
      <p className="mt-2 max-w-2xl text-navy-600">
        No account needed. Fill in the details below and we&apos;ll confirm your visit. You&apos;ll see the price before you
        send the request.
      </p>
      <div className="mt-8">
        <BookingForm
          defaults={defaults}
          minDate={toDateOnly(addDays(today, 1))}
          maxDate={toDateOnly(addDays(today, 180))}
          freeDeepCleans={freeDeepCleans}
        />
      </div>
    </div>
  );
}
