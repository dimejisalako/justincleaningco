import type { Metadata } from "next";
import { BRAND_NAME, BUSINESS_ADDRESS, CONTACT_EMAIL } from "../../../config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="prose-legal mx-auto max-w-3xl space-y-5 px-4 py-12 text-navy">
      <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 font-bold text-amber-900">
        REVIEW WITH LEGAL. This is placeholder text, not a finished privacy policy. Do not publish it as-is.
      </div>
      <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
      <p className="text-sm text-navy-600">Last updated: [DATE]</p>

      <h2 className="pt-4 text-xl font-bold">1. Who we are</h2>
      <p>{BRAND_NAME} provides residential cleaning services. Business address: {BUSINESS_ADDRESS}. Contact: {CONTACT_EMAIL}.</p>

      <h2 className="pt-4 text-xl font-bold">2. Information we collect</h2>
      <p>
        We collect the details you give us when booking or creating an account: name, phone number, email address,
        service address, home size, access notes (such as gate codes or pet information), visit history, and payment
        status. Account passwords are stored only as bcrypt hashes.
      </p>

      <h2 className="pt-4 text-xl font-bold">3. How we use it</h2>
      <p>
        To schedule and perform visits, send booking and account emails, and, only if you opt in, send SMS or WhatsApp
        messages about your bookings. [REVIEW WITH LEGAL: confirm the lawful basis and TCPA/consent wording.]
      </p>

      <h2 className="pt-4 text-xl font-bold">4. Sharing</h2>
      <p>
        We do not sell your personal information. We share it only with service providers needed to run the business
        (for example email, hosting and messaging providers) and when required by law. To check that an address is
        inside our service area, we send it to the US Census Bureau&apos;s public geocoder. [REVIEW WITH LEGAL: list actual
        processors.]
      </p>

      <h2 className="pt-4 text-xl font-bold">5. Access notes and security</h2>
      <p>
        Access codes and pet details are used only to perform your visit. [REVIEW WITH LEGAL and operations: describe
        retention and security measures.]
      </p>

      <h2 className="pt-4 text-xl font-bold">6. Retention</h2>
      <p>[REVIEW WITH LEGAL: how long bookings, invoices and account data are kept, and how deletion requests are handled.]</p>

      <h2 className="pt-4 text-xl font-bold">7. Your choices</h2>
      <p>
        You can update your account details, stop SMS or WhatsApp messages by replying STOP or by contacting us, and
        ask us to delete your account by emailing {CONTACT_EMAIL}.
      </p>

      <h2 className="pt-4 text-xl font-bold">8. Changes</h2>
      <p>[REVIEW WITH LEGAL: how users are told about changes to this policy.]</p>
    </article>
  );
}
