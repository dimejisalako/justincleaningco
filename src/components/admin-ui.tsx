import Link from "next/link";
import { adminLogoutAction, updateBookingAction } from "@/app/admin/actions";

/** Shared admin header with navigation and log out. Server component. */
export function AdminNav({ current }: { current: "bookings" | "users" }) {
  const link = (href: string, label: string, key: typeof current) => (
    <Link
      href={href}
      aria-current={current === key ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-sm font-semibold ${
        current === key ? "bg-navy text-white" : "text-navy hover:bg-navy-50"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <nav aria-label="Admin" className="flex flex-wrap gap-2">
        {link("/admin", "Bookings", "bookings")}
        {link("/admin/users", "Users", "users")}
      </nav>
      <form action={adminLogoutAction}>
        <button type="submit" className="btn-secondary min-h-[40px] px-4 py-2 text-sm">Log out of admin</button>
      </form>
    </div>
  );
}

/** Buttons that move a visit through its statuses. Used on the bookings and user pages. */
export function VisitActions({ id, status, paymentStatus }: { id: string; status: string; paymentStatus: string }) {
  const button = (next: string, label: string) => (
    <form action={updateBookingAction}>
      <input type="hidden" name="bookingId" value={id} />
      <input type="hidden" name="status" value={next} />
      <button type="submit" className="btn-secondary min-h-[36px] w-full px-3 py-1 text-sm">{label}</button>
    </form>
  );
  return (
    <div className="flex flex-col gap-2">
      {status === "requested" ? button("confirmed", "Confirm") : null}
      {["requested", "confirmed"].includes(status) ? button("completed", "Mark complete") : null}
      {["requested", "confirmed"].includes(status) ? button("cancelled", "Cancel") : null}
      {status === "completed" ? (
        <form action={updateBookingAction} className="flex gap-2">
          <input type="hidden" name="bookingId" value={id} />
          <input type="hidden" name="status" value="completed" />
          <select name="paymentStatus" defaultValue={paymentStatus} aria-label="Payment status" className="input mt-0 min-h-[36px] py-1 text-sm">
            <option value="unpaid">Unpaid</option>
            <option value="invoiced">Invoiced</option>
            <option value="paid">Paid</option>
          </select>
          <button type="submit" className="btn-secondary min-h-[36px] px-3 py-1 text-sm">Save</button>
        </form>
      ) : null}
    </div>
  );
}
