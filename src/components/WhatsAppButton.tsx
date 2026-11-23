"use client";

import { usePathname } from "next/navigation";
import { pageLabelFor, whatsappLink } from "@/lib/whatsapp";

/**
 * WhatsApp click-to-chat button.
 * - Floating (default): fixed bottom-right on every page.
 * - Inline: plain link used in the footer.
 * The prefilled message names the page the visitor is on.
 * Hidden automatically if NEXT_PUBLIC_WHATSAPP_NUMBER is not set.
 */
export function WhatsAppButton({
  pageLabel,
  variant = "floating",
}: {
  pageLabel?: string;
  variant?: "floating" | "inline";
}) {
  const pathname = usePathname();
  const label = pageLabel ?? pageLabelFor(pathname ?? "/");
  const href = whatsappLink(label);
  if (!href) return null;

  if (variant === "inline") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 font-semibold text-navy-900 hover:brightness-95"
      >
        Chat on WhatsApp
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-4 right-4 z-50 flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-bold text-navy-900 shadow-lg transition hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 fill-current">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.13c-.25.7-1.45 1.34-2 1.4-.52.06-1.18.09-1.9-.12-.44-.13-1-.33-1.72-.64-3.03-1.31-5-4.37-5.15-4.57-.15-.2-1.23-1.64-1.23-3.13 0-1.49.78-2.22 1.06-2.52.27-.3.6-.37.8-.37h.58c.19 0 .43-.04.67.52.25.6.85 2.08.93 2.23.07.15.12.33.02.53-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.6.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.36 1.46.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.01.96.3.15.5.22.57.35.07.12.07.73-.18 1.43Z" />
      </svg>
      <span className="hidden sm:inline">WhatsApp us</span>
    </a>
  );
}
