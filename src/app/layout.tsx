import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { BRAND_NAME, CONTACT_EMAIL, BUSINESS_ADDRESS, TAGLINE } from "../../config/site";
import { SERVICE_CITIES } from "../../config/service-area";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} | Residential cleaning`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: `${TAGLINE}. Book online, pay after each visit.`,
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f2445",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white font-sans text-navy antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/" className="flex items-center gap-2" aria-label={`${BRAND_NAME} home`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {/* The logo already includes the business name, so no separate text is shown. */}
              <img src="/logo.svg" alt="" width={1200} height={850} className="h-14 w-auto" />
            </Link>

            <nav aria-label="Main" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
              <Link href="/#how-it-works" className="hover:text-teal-600">How it works</Link>
              <Link href="/#pricing" className="hover:text-teal-600">Pricing</Link>
              <Link href="/#service-area" className="hover:text-teal-600">Service area</Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="hover:text-teal-600">My account</Link>
                  <form action={logoutAction}>
                    <SubmitButton className="hover:text-teal-600" pendingText="Logging out…">
                      Log out
                    </SubmitButton>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-teal-600">Log in</Link>
                  <Link href="/register" className="hover:text-teal-600">Create account</Link>
                </>
              )}
              <Link href="/book" className="btn-primary min-h-[40px] px-4 py-2 text-sm">
                Book a cleaning
              </Link>
            </nav>
          </div>
        </header>

        <main id="main" className="flex-1">
          {children}
        </main>

        <footer className="mt-16 bg-navy-900 text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
            <div>
              <p className="text-lg font-bold">{BRAND_NAME}</p>
              <p className="mt-2 text-sm text-navy-100/90">{TAGLINE}.</p>
              <p className="mt-3 text-sm">
                <span className="font-semibold">Address: </span>
                {BUSINESS_ADDRESS}
              </p>
            </div>
            <div className="text-sm">
              <p className="font-semibold">Contact</p>
              <p className="mt-2">
                Email:{" "}
                <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </p>
              <div className="mt-3">
                <WhatsAppButton pageLabel="footer" variant="inline" />
              </div>
            </div>
            <div className="text-sm">
              <p className="font-semibold">Service area</p>
              <p className="mt-2 text-navy-100/90">
                {SERVICE_CITIES.map((c) => c.name).join(", ")}, Texas
              </p>
              <ul className="mt-4 flex gap-4">
                <li>
                  <Link className="underline" href="/privacy">Privacy</Link>
                </li>
                <li>
                  <Link className="underline" href="/terms">Terms</Link>
                </li>
              </ul>
            </div>
          </div>
          <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-navy-100/70">
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </p>
        </footer>

        <WhatsAppButton />
      </body>
    </html>
  );
}
