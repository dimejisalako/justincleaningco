import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNav, VisitActions } from "@/components/admin-ui";
import { TextField } from "@/components/fields";
import { grantRewardAction, voidRewardAction } from "@/app/admin/actions";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { formatDate, formatMoney, todayInBusinessZone } from "@/lib/dates";
import { spendSummary, syncRewards } from "@/lib/rewards-sync";
import { REWARD_THRESHOLD_CENTS } from "@/lib/rewards";
import { FREQUENCIES, FrequencyKey } from "../../../../../config/pricing";
import { TIME_WINDOWS } from "../../../../../config/site";

export const metadata: Metadata = { title: "Admin · Client", robots: { index: false, follow: false } };

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: { createdAt: "asc" } },
      plans: { include: { pauses: { orderBy: { startDate: "asc" } } }, orderBy: { createdAt: "asc" } },
      bookings: { orderBy: { scheduledFor: "desc" } },
      rewards: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) notFound();

  await syncRewards(user.id);
  const spend = await spendSummary(user.id);
  const today = todayInBusinessZone();
  const rewards = await db.reward.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <AdminNav current="users" />

      <div>
        <Link href="/admin/users" className="text-sm font-semibold underline">← All users</Link>
        <h1 className="mt-2 text-3xl font-extrabold text-navy">{user.name}</h1>
        <p className="text-navy-600">
          {user.email} · {user.phone} · Joined {formatDate(new Date(user.createdAt.toISOString().slice(0, 10) + "T00:00:00Z"))}
        </p>
      </div>

      {/* SPEND */}
      <section aria-labelledby="spend" className="space-y-4">
        <h2 id="spend" className="text-2xl font-bold text-navy">Spending and rewards</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card">
            <p className="text-sm text-navy-600">Total spent (completed visits)</p>
            <p className="text-2xl font-extrabold text-navy">{formatMoney(spend.totalSpentCents)}</p>
            <p className="text-xs text-navy-600">{spend.visitsCount} completed visit(s)</p>
          </div>
          <div className="card">
            <p className="text-sm text-navy-600">Toward next free deep clean</p>
            <p className="text-2xl font-extrabold text-navy">
              {formatMoney(spend.pendingCents)} <span className="text-base text-navy-600">of {formatMoney(REWARD_THRESHOLD_CENTS)}</span>
            </p>
            <p className="text-xs text-navy-600">Rolling 3-month window</p>
          </div>
          <div className="card">
            <p className="text-sm text-navy-600">Free deep cleans available</p>
            <p className="text-2xl font-extrabold text-navy">{spend.availableRewards}</p>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-bold text-navy">Rewards</h3>
          {rewards.length === 0 ? (
            <p className="text-sm text-navy-600">No rewards yet.</p>
          ) : (
            <ul className="divide-y divide-navy-100">
              {rewards.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold capitalize">{r.status}{r.source === "manual" ? " · granted by owner" : " · earned from spend"}</p>
                    <p className="text-navy-600">
                      Earned {formatDate(r.earnedOn)}
                      {r.redeemedAt ? ` · used ${formatDate(r.redeemedAt)}` : ""}
                      {r.note ? ` · ${r.note}` : ""}
                    </p>
                  </div>
                  {r.status === "available" ? (
                    <form action={voidRewardAction}>
                      <input type="hidden" name="rewardId" value={r.id} />
                      <input type="hidden" name="userId" value={user.id} />
                      <button type="submit" className="btn-secondary min-h-[36px] px-3 py-1 text-sm">Void</button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <form action={grantRewardAction} className="grid gap-3 border-t border-navy-100 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <input type="hidden" name="userId" value={user.id} />
            <TextField name="note" label="Grant a free deep clean (reason, optional)" maxLength={200} />
            <button type="submit" className="btn-teal min-h-[44px]">Grant free deep clean</button>
          </form>
        </div>
      </section>

      {/* PLANS */}
      <section aria-labelledby="plans" className="space-y-4">
        <h2 id="plans" className="text-2xl font-bold text-navy">Recurring plans</h2>
        {user.plans.filter((p) => p.status !== "cancelled").length === 0 ? (
          <p className="card text-navy-600">No recurring plan.</p>
        ) : (
          user.plans
            .filter((p) => p.status !== "cancelled")
            .map((p) => (
              <div key={p.id} className="card">
                <p className="font-semibold text-navy">
                  {FREQUENCIES[p.frequency as FrequencyKey]?.label ?? p.frequency} · {formatMoney(p.priceCents)} per visit · <span className="capitalize">{p.status}</span>
                </p>
                <p className="text-sm text-navy-600">{p.addressLine1}, {p.city}, TX {p.zip}</p>
                {p.pauses.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-sm text-navy-600">
                    {p.pauses.map((pa) => (
                      <li key={pa.id}>
                        Pause {formatDate(pa.startDate)} to {formatDate(pa.endDate)}{pa.resumedAt ? " (ended early)" : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))
        )}
      </section>

      {/* VISITS */}
      <section aria-labelledby="visits" className="space-y-4">
        <h2 id="visits" className="text-2xl font-bold text-navy">Visits</h2>
        {user.bookings.length === 0 ? (
          <p className="card text-navy-600">No visits yet.</p>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-navy-100 bg-navy-50 text-navy">
                <tr>
                  <th scope="col" className="px-3 py-3">Date</th>
                  <th scope="col" className="px-3 py-3">Service</th>
                  <th scope="col" className="px-3 py-3">Address / access</th>
                  <th scope="col" className="px-3 py-3">Amount</th>
                  <th scope="col" className="px-3 py-3">Status</th>
                  <th scope="col" className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {user.bookings.map((b) => (
                  <tr key={b.id} className="border-b border-navy-100 align-top last:border-0">
                    <td className="px-3 py-3">
                      <p className="font-semibold">{formatDate(b.scheduledFor)}</p>
                      <p className="text-navy-600">{TIME_WINDOWS[b.timeWindow as keyof typeof TIME_WINDOWS] ?? b.timeWindow}</p>
                      <p className="font-mono text-xs">{b.confirmationCode}</p>
                    </td>
                    <td className="px-3 py-3">
                      {FREQUENCIES[b.frequency as FrequencyKey]?.label ?? b.frequency}
                      {b.deepClean ? " · Deep clean" : ""}
                      {b.isRewardVisit ? <p className="text-xs font-semibold text-teal-700">Free deep clean reward</p> : null}
                    </td>
                    <td className="px-3 py-3">
                      <p>{b.addressLine1}, {b.city}</p>
                      {b.accessNotes ? <p className="text-navy-600">Access: {b.accessNotes}</p> : null}
                    </td>
                    <td className="px-3 py-3">
                      {b.isCustomQuote ? "Custom quote" : formatMoney(b.priceCents)}
                      <p className="text-xs capitalize text-navy-600">{b.paymentStatus}</p>
                    </td>
                    <td className="px-3 py-3 font-semibold capitalize">{b.status}</td>
                    <td className="px-3 py-3">
                      <VisitActions id={b.id} status={b.status} paymentStatus={b.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ADDRESSES */}
      <section aria-labelledby="addr" className="space-y-4">
        <h2 id="addr" className="text-2xl font-bold text-navy">Saved addresses</h2>
        {user.addresses.length === 0 ? (
          <p className="card text-navy-600">No saved addresses.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {user.addresses.map((a) => (
              <div key={a.id} className="card">
              <p className="font-semibold">{a.label}</p>
                <p className="text-sm text-navy-600">{a.line1}, {a.city}, TX {a.zip}</p>
              </div>
            ))}
          </div>
        )}
      </section>
      <p className="text-xs text-navy-600">Today: {formatDate(today)}. Passwords are stored as hashes and are never shown here.</p>
    </div>
  );
}
