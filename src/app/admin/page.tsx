import type { Metadata } from "next";
import type { Booking } from "@prisma/client";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { SubmitButton } from "@/components/SubmitButton";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { formatDate, formatMoney, todayInBusinessZone } from "@/lib/dates";
import { FREQUENCIES, FrequencyKey } from "../../../config/pricing";
import { TIME_WINDOWS } from "../../../config/site";
import { adminLogoutAction, updateBookingAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-6 text-3xl font-extrabold text-navy">Admin</h1>
        <AdminLoginForm />
      </div>
    );
  }

  const today = todayInBusinessZone();
  const bookings = await db.booking.findMany({
    where: { scheduledFor: { gte: today } },
    orderBy: [{ scheduledFor: "asc" }, { timeWindow: "asc" }],
    take: 300,
  });
  const todays = bookings.filter((b) => b.scheduledFor.getTime() === today.getTime());
  const upcoming = bookings.filter((b) => b.scheduledFor.getTime() !== today.getTime());

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-navy">Bookings</h1>
        <form action={adminLogoutAction}>
          <SubmitButton className="btn-secondary" pendingText="Logging out…">Log out of admin</SubmitButton>
        </form>
      </div>

      <BookingTable title={`Today (${formatDate(today)})`} rows={todays} empty="No visits today." />
      <BookingTable title="Upcoming" rows={upcoming} empty="No upcoming visits." />
    </div>
  );
}

type Row = Booking;

function BookingTable({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-navy">{title}</h2>
      {rows.length === 0 ? (
        <p className="card text-navy-600">{empty}</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-navy-100 bg-navy-50 text-navy">
              <tr>
                <th scope="col" className="px-3 py-3">Visit</th>
                <th scope="col" className="px-3 py-3">Client</th>
                <th scope="col" className="px-3 py-3">Address / access</th>
                <th scope="col" className="px-3 py-3">Price</th>
                <th scope="col" className="px-3 py-3">Status</th>
                <th scope="col" className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-navy-100 align-top last:border-0">
                  <td className="px-3 py-3">
                    <p className="font-semibold">{formatDate(b.scheduledFor)}</p>
                    <p className="text-navy-600">{TIME_WINDOWS[b.timeWindow as keyof typeof TIME_WINDOWS] ?? b.timeWindow}</p>
                    <p className="text-navy-600">{FREQUENCIES[b.frequency as FrequencyKey]?.label ?? b.frequency}</p>
                    <p className="font-mono text-xs">{b.confirmationCode}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p>{b.name}</p>
                    <p>{b.phone}</p>
                    <p className="break-all">{b.email}</p>
                    {b.smsConsent ? <p className="text-xs text-teal-700">SMS/WhatsApp consent: yes</p> : null}
                  </td>
                  <td className="px-3 py-3">
                    <p>{b.addressLine1}, {b.city}, TX {b.zip}</p>
                    {b.accessNotes ? <p className="mt-1 whitespace-pre-wrap text-navy-600">Access: {b.accessNotes}</p> : null}
                  </td>
                  <td className="px-3 py-3">
                    {b.isCustomQuote ? "Custom quote" : formatMoney(b.priceCents)}
                    <p className="text-xs capitalize text-navy-600">{b.paymentStatus}</p>
                  </td>
                  <td className="px-3 py-3 font-semibold capitalize">{b.status}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2">
                      {b.status === "requested" ? (
                        <StatusButton id={b.id} status="confirmed" label="Confirm" />
                      ) : null}
                      {["requested", "confirmed"].includes(b.status) ? (
                        <StatusButton id={b.id} status="completed" label="Mark complete" />
                      ) : null}
                      {["requested", "confirmed"].includes(b.status) ? (
                        <StatusButton id={b.id} status="cancelled" label="Cancel" />
                      ) : null}
                      {b.status === "completed" ? (
                        <form action={updateBookingAction} className="flex gap-2">
                          <input type="hidden" name="bookingId" value={b.id} />
                          <input type="hidden" name="status" value="completed" />
                          <select name="paymentStatus" defaultValue={b.paymentStatus} aria-label="Payment status" className="input mt-0 min-h-[36px] py-1 text-sm">
                            <option value="unpaid">Unpaid</option>
                            <option value="invoiced">Invoiced</option>
                            <option value="paid">Paid</option>
                          </select>
                          <button type="submit" className="btn-secondary min-h-[36px] px-3 py-1 text-sm">Save</button>
                        </form>
                      ) : null}
                      {b.status === "paused" ? <p className="text-xs text-navy-600">Released by a plan pause.</p> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={updateBookingAction}>
      <input type="hidden" name="bookingId" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className="btn-secondary min-h-[36px] w-full px-3 py-1 text-sm">{label}</button>
    </form>
  );
}
