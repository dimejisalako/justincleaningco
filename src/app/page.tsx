import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME, TAGLINE } from "../../config/site";
import { SERVICE_CITIES, STATE_NAME } from "../../config/service-area";
import { PriceCalculator } from "@/components/PriceCalculator";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-gradient-to-b from-teal-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-teal-700">{TAGLINE}</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-navy sm:text-5xl">
              A spotless home, without the to-do list.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-navy-600">
              Book a cleaning in a few minutes, see your price up front, and pay only after each visit.
              No subscription, no automatic charges.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/book" className="btn-primary">Book a cleaning</Link>
              <a href="#pricing" className="btn-secondary">See pricing</a>
            </div>
          </div>
          <div className="flex justify-center">
            <Image
              src="/logo.svg"
              alt={`${BRAND_NAME} logo`}
              width={1200}
              height={850}
              priority
              className="h-auto w-full max-w-sm"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
        <h2 className="text-3xl font-extrabold text-navy">How it works</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { title: "1. Book online", text: "Tell us your home size, how often you want cleaning, and a time that suits you. No account needed." },
            { title: "2. We clean", text: "A trained, background-checked team arrives in your window with the supplies and the checklist you asked for." },
            { title: "3. Pay after the visit", text: "Get an invoice or payment link after each visit. Pause or change a recurring plan any time from your account." },
          ].map((step) => (
            <li key={step.title} className="card">
              <h3 className="text-xl font-bold text-navy">{step.title}</h3>
              <p className="mt-2 text-navy-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* PRICING */}
      <section id="pricing" className="scroll-mt-24 bg-navy-50 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-extrabold text-navy">Estimate your cleaning</h2>
          <p className="mt-2 text-navy-600">Choose your home size and frequency to see the price for one visit.</p>
          <div className="mt-8">
            <PriceCalculator />
          </div>
        </div>
      </section>

      {/* SERVICE AREA */}
      <section id="service-area" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
        <h2 className="text-3xl font-extrabold text-navy">Service area</h2>
        <p className="mt-2 text-navy-600">We clean homes in these {STATE_NAME} cities, and anywhere within 5 miles of them:</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          {SERVICE_CITIES.map((c) => (
            <li key={c.name} className="rounded-lg border border-navy-100 bg-white px-4 py-3 text-center font-semibold text-navy">
              {c.name}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-navy-600">Not sure if you&apos;re in our area? Enter your address on the booking page or message us on WhatsApp.</p>
      </section>

      {/* TRUST */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl font-extrabold">Trusted in your home</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-lg font-bold">Background-checked team</p>
              <p className="mt-1 text-navy-100/90">Every cleaner is background-checked before they enter a home.</p>
            </div>
            <div>
              <p className="text-lg font-bold">Pay after the visit</p>
              <p className="mt-1 text-navy-100/90">No subscription and no automatic charges. You pay for each visit only.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 text-center">
        <h2 className="text-2xl font-extrabold text-navy">Ready for a cleaner home?</h2>
        <Link href="/book" className="btn-primary mt-6">Book a cleaning</Link>
      </section>
    </>
  );
}
