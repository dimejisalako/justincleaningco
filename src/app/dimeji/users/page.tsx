import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-ui";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/dates";
import { TextField } from "@/components/fields";

export const metadata: Metadata = { title: "Admin · Users", robots: { index: false, follow: false } };

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!(await isAdmin())) redirect("/dimeji");
  const { q = "" } = await searchParams;
  const term = q.trim();

  const users = await db.user.findMany({
    where: term
      ? { OR: [{ name: { contains: term } }, { email: { contains: term } }, { phone: { contains: term } }] }
      : undefined,
    include: {
      bookings: { select: { status: true, priceCents: true } },
      plans: { select: { status: true } },
      rewards: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-extrabold text-navy">Users</h1>
      <AdminNav current="users" />

      <form method="get" className="flex max-w-md items-end gap-3" role="search">
        <div className="flex-1">
          <TextField name="q" label="Search by name, email or phone" defaultValue={term} />
        </div>
        <button type="submit" className="btn-secondary min-h-[44px]">Search</button>
      </form>

      <p className="text-sm text-navy-600">{users.length} account(s){term ? ` matching “${term}”` : ""}.</p>

      {users.length === 0 ? (
        <p className="card text-navy-600">No accounts yet.</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-navy-100 bg-navy-50 text-navy">
              <tr>
                <th scope="col" className="px-3 py-3">Name</th>
                <th scope="col" className="px-3 py-3">Contact</th>
                <th scope="col" className="px-3 py-3">Joined</th>
                <th scope="col" className="px-3 py-3">Completed visits</th>
                <th scope="col" className="px-3 py-3">Total spent</th>
                <th scope="col" className="px-3 py-3">Plans</th>
                <th scope="col" className="px-3 py-3">Free cleans</th>
                <th scope="col" className="px-3 py-3"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const completed = u.bookings.filter((b) => b.status === "completed");
                const spent = completed.reduce((s, b) => s + b.priceCents, 0);
                const activePlans = u.plans.filter((p) => p.status !== "cancelled").length;
                const freeCleans = u.rewards.filter((r) => r.status === "available").length;
                return (
                  <tr key={u.id} className="border-b border-navy-100 align-top last:border-0">
                    <td className="px-3 py-3 font-semibold">{u.name}</td>
                    <td className="px-3 py-3">
                      <p className="break-all">{u.email}</p>
                      <p className="text-navy-600">{u.phone}</p>
                    </td>
                    <td className="px-3 py-3">{formatDate(new Date(u.createdAt.toISOString().slice(0, 10) + "T00:00:00Z"))}</td>
                    <td className="px-3 py-3">{completed.length}</td>
                    <td className="px-3 py-3">{formatMoney(spent)}</td>
                    <td className="px-3 py-3">{activePlans}</td>
                    <td className="px-3 py-3">{freeCleans}</td>
                    <td className="px-3 py-3">
                      <Link href={`/dimeji/users/${u.id}`} className="font-semibold underline">Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
