import type { Metadata } from "next";
import { requireUser } from "@/app/actions/auth";
import { CancelVisitForm, AddressForm, PauseForm, RescheduleForm, ResumeForm } from "@/components/dashboard-forms";
import { db } from "@/lib/db";
import { addDays, formatDate, formatMoney, toDateOnly, todayInBusinessZone } from "@/lib/dates";
import { syncPlanStatus } from "@/lib/bookings";
import { syncRewards, spendSummary } from "@/lib/rewards-sync";
import { REWARD_THRESHOLD_CENTS } from "@/lib/rewards";
import { pausedDaysInYear, remainingPauseDays } from "@/lib/pause";
import { FREQUENCIES, FrequencyKey } from "../../../config/pricing";
import { PAUSE_MAX_DAYS_PER_YEAR, TIME_WINDOWS } from "../../../config/site";

export const metadata: Metadata = { title: "My account" };

export default async function DashboardPage() {
  const user = await requireUser();
  const today = todayInBusinessZone();
  const year = today.getUTCFullYear();

  // Keep plan status correct before rendering (a pause may have ended since the last visit).
  const planIds = await db.plan.findMany({ where: { userId: user.id }, select: { id: true } });
  for (const { id } of planIds) await syncPlanStatus(id, today);
  await syncRewards(user.id);
  const spend = await spendSummary(user.id);

  const plans = await db.plan.findMany({
    where: { userId: user.id, status: { not: "cancelled" } },
    include: { pauses: { orderBy: { startDate: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
  const bookings = await db.booking.findMany({ where: { userId: user.id }, orderBy: { scheduledFor: "asc" } });
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });

  const upcoming = bookings.filter(
    (b) => b.scheduledFor >= today && !["completed", "cancelled"].includes(b.status),
  );
  const past = bookings.filter((b) => !upcoming.includes(b)).reverse();
  const minVisit = toDateOnly(addDays(today, 1));
  const minPause = toDateOnly(addDays(today, 7));

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div>
        <h1 className="text-3xl font-extrabold text-navy">Hi {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-navy-600">Manage your visits, recurring plan and saved addresses.</p>
      </div>

      {/* SPEND AND REWARDS */}
      <section aria-labelledby="spend-heading" className="space-y-4">
        <h2 id="spend-heading" className="text-2xl font-bold text-navy">Spending and rewards</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <p className="text-sm text-navy-600">Total spent</p>
            <p className="text-2xl font-extrabold text-navy">{formatMoney(spend.totalSpentCents)}</p>
            <p className="text-xs text-navy-600">{spend.visitsCount} completed visit(s)</p>
          </div>
          <div className="card sm:col-span-1 lg:col-span-2">
            <p className="text-sm text-navy-600">Progress to a free deep clean</p>
            <p className="text-2xl font-extrabold text-navy">
              {formatMoney(spend.pendingCents)} <span className="text-base font-semibold text-navy-600">of {formatMoney(REWARD_THRESHOLD_CENTS)}</span>
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-navy-50" role="progressbar" aria-valuemin={0} aria-valuemax={REWARD_THRESHOLD_CENTS} aria-valuenow={Math.min(spend.pendingCents, REWARD_THRESHOLD_CENTS)}>
              <div className="h-full bg-teal" style={{ width: `${Math.min(100, (spend.pendingCents / REWARD_THRESHOLD_CENTS) * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-navy-600">Spend {formatMoney(REWARD_THRESHOLD_CENTS)} in a 3-month window to earn a free deep clean.</p>
          </div>
          <div className="card">
            <p className="text-sm text-navy-600">Free deep cleans available</p>
            <p className="text-2xl font-extrabold text-navy">{spend.availableRewards}</p>
            {spend.availableRewards > 0 ? (
              <a className="mt-2 inline-block text-sm font-semibold underline" href="/book">Book one now</a>
            ) : null}
          </div>
        </div>
      </section>

      {/* RECURRING PLANS */}
      <section aria-labelledby="plans-heading" className="space-y-4">
        <h2 id="plans-heading" className="text-2xl font-bold text-navy">Recurring plan</h2>
        {plans.length === 0 ? (
          <div className="card">
            <p className="text-navy-600">You don&apos;t have a recurring plan yet. Choose weekly, every two weeks or monthly when you book.</p>
          </div>
        ) : (
          plans.map((plan) => {
            const ranges = plan.pauses.map((p) => ({ startDate: p.startDate, endDate: p.endDate }));
            const used = pausedDaysInYear(ranges, year);
            const remaining = remainingPauseDays(ranges, year);
            const hasOpenPause = plan.pauses.some((p) => !p.resumedAt && p.endDate >= today);
            return (
              <article key={plan.id} className="card space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-navy">
                      {FREQUENCIES[plan.frequency as FrequencyKey]?.label ?? plan.frequency} cleaning
                    </h3>
                    <p className="text-sm text-navy-600">
                      {formatMoney(plan.priceCents)} per visit · {plan.addressLine1}, {plan.city}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      plan.status === "paused" ? "bg-amber-100 text-amber-900" : "bg-teal-50 text-teal-700"
                    }`}
                  >
                    {plan.status === "paused" ? "Paused" : "Active"}
                  </span>
                </div>

                <p className="text-sm text-navy">
                  Pause allowance for {year}: <strong>{used}</strong> of {PAUSE_MAX_DAYS_PER_YEAR} days used,{" "}
                  <strong>{remaining}</strong> left.
                </p>

                {plan.pauses.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-navy-600">
                    {plan.pauses.map((p) => (
                      <li key={p.id}>
                        {formatDate(p.startDate)} to {formatDate(p.endDate)}
                        {p.resumedAt ? " (ended early)" : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-navy">Pause plan</h4>
                    <PauseForm planId={plan.id} minDate={minPause} />
                  </div>
                  {hasOpenPause ? (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-navy">Resume plan</h4>
                      <p className="text-sm text-navy-600">Resume at the same price. Visits released during the pause that are still ahead go back on the schedule for confirmation.</p>
                      <ResumeForm planId={plan.id} />
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* UPCOMING VISITS */}
      <section aria-labelledby="upcoming-heading" className="space-y-4">
        <h2 id="upcoming-heading" className="text-2xl font-bold text-navy">Upcoming visits</h2>
        {upcoming.length === 0 ? (
          <p className="card text-navy-600">No upcoming visits. <a className="font-semibold underline" href="/book">Book a cleaning</a>.</p>
        ) : (
          upcoming.map((b) => {
            const changeable = ["requested", "confirmed"].includes(b.status);
            return (
              <article key={b.id} className="card space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-navy">{formatDate(b.scheduledFor)}</p>
                    <p className="text-sm text-navy-600">
                      {TIME_WINDOWS[b.timeWindow as keyof typeof TIME_WINDOWS] ?? b.timeWindow} · {b.addressLine1}, {b.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-navy-50 px-3 py-1 text-sm font-semibold capitalize text-navy">{b.status}</span>
                    <p className="mt-1 text-sm text-navy-600">{b.isCustomQuote ? "Custom quote" : formatMoney(b.priceCents)}</p>
                  </div>
                </div>
                {changeable ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <details className="rounded-lg border border-navy-100 p-4">
                      <summary className="cursor-pointer font-semibold text-navy">Reschedule</summary>
                      <div className="mt-4">
                        <RescheduleForm bookingId={b.id} minDate={minVisit} />
                      </div>
                    </details>
                    <div className="rounded-lg border border-navy-100 p-4">
                      <p className="mb-3 font-semibold text-navy">Cancel visit</p>
                      <p className="mb-3 text-sm text-navy-600">Cancellations need 24 hours&apos; notice.</p>
                      <CancelVisitForm bookingId={b.id} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-navy-600">Paused visits are released and not charged. They return to the schedule if you resume early.</p>
                )}
              </article>
            );
          })
        )}
      </section>

      {/* PAST VISITS */}
      <section aria-labelledby="past-heading" className="space-y-4">
        <h2 id="past-heading" className="text-2xl font-bold text-navy">Past visits</h2>
        {past.length === 0 ? (
          <p className="card text-navy-600">Your completed visits will appear here.</p>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-navy-100 bg-navy-50 text-navy">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Amount</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Payment</th>
                </tr>
              </thead>
              <tbody>
                {past.map((b) => (
                  <tr key={b.id} className="border-b border-navy-100 last:border-0">
                    <td className="px-4 py-3">{formatDate(b.scheduledFor)}</td>
                    <td className="px-4 py-3 capitalize">
                      {b.status}
                      {b.isRewardVisit ? <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">Free deep clean</span> : null}
                    </td>
                    <td className="px-4 py-3">{b.isCustomQuote ? "Custom quote" : formatMoney(b.priceCents)}</td>
                    <td className="px-4 py-3 capitalize">{b.paymentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ADDRESSES */}
      <section aria-labelledby="addresses-heading" className="space-y-4">
        <h2 id="addresses-heading" className="text-2xl font-bold text-navy">Saved addresses</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.length === 0 ? (
            <p className="card text-navy-600 md:col-span-2">No saved addresses yet.</p>
          ) : (
            addresses.map((a) => (
              <div key={a.id} className="card">
                <p className="font-semibold text-navy">{a.label}</p>
                <p className="text-sm text-navy-600">{a.line1}, {a.city}, TX {a.zip}</p>
              </div>
            ))
          )}
        </div>
        <div className="card">
          <h3 className="mb-4 text-lg font-bold text-navy">Add an address</h3>
          <AddressForm />
        </div>
      </section>
    </div>
  );
}
