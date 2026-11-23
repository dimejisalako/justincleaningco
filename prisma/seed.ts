/**
 * Seed script: creates 3 sample clients (with plans, visits and pauses) so the dashboard can be demoed.
 * Run with: npm run db:seed
 *
 * DEMO LOGIN for every sample client (local development only, never use in production):
 *   password: DemoPass123!
 *   emails:   ama@example.com, carlos@example.com, priya@example.com
 *
 * This script WIPES existing data in the local database first.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { calculatePrice } from "../src/lib/pricing";
import { addDays, todayInBusinessZone } from "../src/lib/dates";
import { AddonKey, FrequencyKey, SqftTierKey } from "../config/pricing";

const db = new PrismaClient();
const DEMO_PASSWORD = "DemoPass123!";

function code(n: number): string {
  return `DEMO-${String(n).padStart(4, "0")}`;
}

async function main() {
  // Clear in dependency order.
  await db.booking.deleteMany();
  await db.pause.deleteMany();
  await db.plan.deleteMany();
  await db.address.deleteMany();
  await db.session.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.user.deleteMany();

  const today = todayInBusinessZone();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  let n = 1;

  type Sample = {
    name: string;
    email: string;
    phone: string;
    addressLine1: string;
    city: string;
    zip: string;
    tier: SqftTierKey;
    frequency: FrequencyKey;
    deepClean: boolean;
    addons: AddonKey[];
    timeWindow: string;
  };

  // ZIPs from config/service-area.ts (76247 = Justin, 76226 = Northlake, 76092 = Southlake).
  const samples: Sample[] = [
    {
      name: "Ama Johnson",
      email: "ama@example.com",
      phone: "2145550101",
      addressLine1: "101 Oak Lane",
      city: "Justin",
      zip: "76247",
      tier: "1500_2500",
      frequency: "weekly",
      deepClean: false,
      addons: ["inside_fridge"],
      timeWindow: "morning",
    },
    {
      name: "Carlos Mendez",
      email: "carlos@example.com",
      phone: "2145550102",
      addressLine1: "22 Maple Court",
      city: "Northlake",
      zip: "76226",
      tier: "under_1500",
      frequency: "every_two_weeks",
      deepClean: false,
      addons: [],
      timeWindow: "afternoon",
    },
    {
      name: "Priya Shah",
      email: "priya@example.com",
      phone: "2145550103",
      addressLine1: "9 Ridgeview Drive",
      city: "Southlake",
      zip: "76092",
      tier: "2500_3500",
      frequency: "monthly",
      deepClean: true,
      addons: ["inside_oven", "interior_windows"],
      timeWindow: "evening",
    },
  ];

  for (const s of samples) {
    const price = calculatePrice({ tier: s.tier, frequency: s.frequency, deepClean: s.deepClean, addons: s.addons });
    const priceCents = price.kind === "priced" ? price.totalCents : 0;

    const user = await db.user.create({
      data: { name: s.name, email: s.email, phone: s.phone, passwordHash },
    });
    await db.address.create({
      data: { userId: user.id, label: "Home", line1: s.addressLine1, city: s.city, zip: s.zip },
    });

    const plan = await db.plan.create({
      data: {
        userId: user.id,
        frequency: s.frequency,
        priceCents,
        addressLine1: s.addressLine1,
        city: s.city,
        zip: s.zip,
        sqftTier: s.tier,
        addons: JSON.stringify(s.addons),
        deepClean: s.deepClean,
      },
    });

    // Interval between visits for each frequency (days).
    const interval = s.frequency === "weekly" ? 7 : s.frequency === "every_two_weeks" ? 14 : 30;
    const base = {
      userId: user.id,
      planId: plan.id,
      name: s.name,
      phone: s.phone,
      email: s.email,
      addressLine1: s.addressLine1,
      city: s.city,
      zip: s.zip,
      sqftTier: s.tier,
      frequency: s.frequency,
      deepClean: s.deepClean,
      addons: JSON.stringify(s.addons),
      timeWindow: s.timeWindow,
      accessNotes: s.email.startsWith("priya") ? "Gate code 4411. Dog named Biscuit (friendly)." : "",
      smsConsent: true,
      isCustomQuote: false,
      priceCents,
    };

    // Two completed visits in the past (already paid).
    for (const offset of [-2 * interval, -interval]) {
      await db.booking.create({
        data: {
          ...base,
          confirmationCode: code(n++),
          scheduledFor: addDays(today, offset),
          status: "completed",
          paymentStatus: "paid",
        },
      });
    }

    if (s.email.startsWith("carlos")) {
      // Carlos has a pause scheduled in 2 weeks lasting 14 days (within the 56-day limit).
      const pauseStart = addDays(today, 14);
      const pauseEnd = addDays(today, 27);
      await db.pause.create({ data: { planId: plan.id, startDate: pauseStart, endDate: pauseEnd } });
      for (const days of [2, 16, 30]) {
        const d = addDays(today, days);
        const inPause = d >= pauseStart && d <= pauseEnd; // the day-16 visit falls inside the pause
        await db.booking.create({
          data: {
            ...base,
            confirmationCode: code(n++),
            scheduledFor: d,
            status: inPause ? "paused" : "confirmed",
            paymentStatus: "unpaid",
          },
        });
      }
    } else if (s.email.startsWith("priya")) {
      // Priya is paused right now (10 days, started 2 days ago).
      const pauseStart = addDays(today, -2);
      const pauseEnd = addDays(today, 7);
      await db.plan.update({ where: { id: plan.id }, data: { status: "paused" } });
      await db.pause.create({ data: { planId: plan.id, startDate: pauseStart, endDate: pauseEnd } });
      await db.booking.create({
        data: {
          ...base,
          confirmationCode: code(n++),
          scheduledFor: addDays(today, 3),
          status: "paused",
          paymentStatus: "unpaid",
        },
      });
    } else {
      // Ama: next visits are confirmed; one is still waiting for the owner to confirm.
      await db.booking.create({
        data: { ...base, confirmationCode: code(n++), scheduledFor: addDays(today, 2), status: "confirmed" },
      });
      await db.booking.create({
        data: { ...base, confirmationCode: code(n++), scheduledFor: addDays(today, 9), status: "requested" },
      });
    }
  }

  console.log(`Seeded ${samples.length} sample clients. Log in with any of these emails and password "${DEMO_PASSWORD}":`);
  for (const s of samples) console.log(`  - ${s.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
