# Justin Cleaning Co. website

Mobile-first website for a residential cleaning company serving Justin, Northlake, Trophy Club, Southlake and Westlake, Texas.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite · Zod · bcryptjs · Vitest

## What's included

- **Home:** hero, how it works, service area, pricing calculator, trust section, footer with WhatsApp and contact email.
- **Book a cleaning:** guest booking (no account), address checked against the service area, price shown before submit, confirmation page and confirmation email.
- **Client accounts:** register, log in, log out, forgot and reset password. Dashboard shows upcoming and past visits with amounts, plan details, pause and resume, reschedule and cancel, and saved addresses.
- **Pause rules (enforced on the server):** up to 56 days (8 weeks) per calendar year, 7 days' notice, no fee, paused visits released, resumes at the same price.
- **Admin:** password-protected `/admin` listing today's and upcoming bookings. Confirm, mark complete, cancel, and record payment status.
- **WhatsApp:** floating click-to-chat button on every page. The prefilled message names the page. No Business API.
- **Legal:** Privacy Policy and Terms of Service, both marked "REVIEW WITH LEGAL".
- **Quality:** Zod validation, rate limits on login, registration, booking and admin login, bcrypt password hashing, pricing and pause unit tests, and a seed script with 3 sample clients.

## Setup (local)

Requires Node.js 18.18 or newer.

```bash
npm install
cp .env.example .env        # then edit .env (see "Fill these in" below)
npx prisma migrate dev --name init   # creates prisma/dev.db and the tables
npm run db:seed             # optional: 3 sample clients for the dashboard demo
npm run dev                 # http://localhost:3000
```

If you prefer not to create a migration file, `npx prisma db push` also creates the tables.

**Demo logins (from the seed, local only):** `ama@example.com`, `carlos@example.com` or `priya@example.com`, password `DemoPass123!`. Admin: the value of `ADMIN_PASSWORD` in `.env` at `/admin`.

### Email in development

No email provider is connected. With `EMAIL_PROVIDER_API_KEY` empty, every email (booking confirmations, password resets) is printed to the terminal where `npm run dev` runs. Password reset links appear there too.

### Tests

```bash
npm test
```

Covers the pricing function (`src/lib/pricing.test.ts`) and the pause limit and notice logic (`src/lib/pause.test.ts`).

## Where things are configured

| What | File |
| --- | --- |
| Square-footage tiers, base prices, frequency discounts, deep clean multiplier, add-on prices | `config/pricing.ts` |
| Cities, ZIP codes we accept, and the 5-mile radius | `config/service-area.ts` |
| Brand name, business address, pause and cancellation rules, time windows | `config/site.ts` |
| Phone number, contact email, admin password, email settings | `.env` (see `.env.example`) |

No prices are hard-coded in components.

## Fill these in before launch

1. **`config/service-area.ts`:** the listed ZIPs and their centre points are set. Addresses in a listed ZIP are accepted. Other addresses are accepted if they are within `SERVICE_RADIUS_MILES` (5) of a listed ZIP, checked by geocoding through the US Census Geocoder. Confirm the ZIP list is complete.
2. **`.env` → `NEXT_PUBLIC_WHATSAPP_NUMBER`:** your WhatsApp number in international format, digits only (for example `12145550123`). The button is hidden until this is a real number.
3. **`.env` → `NEXT_PUBLIC_CONTACT_EMAIL`:** the public contact email.
4. **`config/site.ts` → `BUSINESS_ADDRESS`:** the business address for the footer and legal pages.
5. **Email provider:** choose one (Resend, Postmark, SES, SendGrid…), set `EMAIL_PROVIDER_API_KEY` and `EMAIL_FROM`, then wire it into `sendEmail()` in `src/lib/email.ts`.
6. **Add-on prices** in `config/pricing.ts`. They are placeholders.
7. **Legal pages:** replace all text marked "REVIEW WITH LEGAL".
8. **Trust section claim:** the home page says every cleaner is background-checked. Confirm this is true before launch.
9. **Secrets:** set a strong `ADMIN_PASSWORD` and a random `ADMIN_SESSION_SECRET` (`openssl rand -hex 32`).

## Business rules implemented

- **Billing:** per visit only. No subscription and no auto-charge. Payment status (`unpaid`, `invoiced`, `paid`) is recorded for the owner. No payment integration.
- **Price per visit:** base price for the home-size tier. Deep clean is 1.5× the base. The frequency discount (10% every two weeks, 15% weekly) applies to the cleaned price. Add-ons are added at their fixed prices and are not discounted. Selecting deep clean includes every add-on at no extra charge, so the add-ons are ticked and greyed out. Homes over 3,500 sq ft get a custom quote and are not auto-priced.
- **Service area:** a listed ZIP is accepted. Any other address is accepted if it is within 5 miles of a listed ZIP's centre point. That check sends the address to the US Census Bureau's geocoder, so mention it in the privacy policy.
- **Pauses:** at most 56 days per calendar year, counted per year when a pause crosses New Year. Start at least 7 days from today. Overlapping pauses are rejected. Visits in the window are set to `paused` and are not charged. Resuming early keeps the days already used and returns released visits still ahead to `requested`, so the owner re-confirms them.
- **Cancel or reschedule:** 24 hours' notice before the start of the visit's time window (Central time).
- **Confirmation:** bookings start as `requested`. The owner confirms them in `/admin`.

## Deploy (Vercel)

> **Important:** SQLite stores data in a local file. Vercel's serverless functions cannot write to a persistent local disk, so **SQLite on Vercel will lose data** and cannot run reliably there. Before deploying to Vercel, move to a hosted database. Prisma supports Postgres, so you can use Vercel Postgres (Neon), Supabase, or Turso. Change `provider` in `prisma/schema.prisma`, set `DATABASE_URL`, and run `npx prisma migrate deploy`.
>
> The in-memory rate limiter in `src/lib/rate-limit.ts` is also per-instance on serverless. Replace it with Redis or Upstash for real limits.

Once the database is hosted:

1. Push the repository to GitHub.
2. In Vercel, **Add New → Project**, import the repository. The framework preset is Next.js.
3. Add every variable from `.env.example` under **Settings → Environment Variables**. Set `NEXT_PUBLIC_SITE_URL` to your production URL.
4. Build command: `npm run build` (it runs `prisma generate` first). Run `npx prisma migrate deploy` against the production database, from your machine or a build step.
5. Deploy, then test booking, login, the pause flow and `/admin` on the production URL.

## Project layout

```
config/          Editable business config (prices, ZIPs, site rules)
prisma/          Schema, seed script, SQLite dev DB (git-ignored)
public/          Logo
src/app/         Pages and server actions (App Router)
src/components/  UI components and client-side forms
src/lib/         Pricing, pause rules, auth, validation, rate limiting, email and WhatsApp helpers
```
