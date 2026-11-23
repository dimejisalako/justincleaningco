import { BRAND_NAME, WHATSAPP_NUMBER } from "../../config/site";

/**
 * WhatsApp click-to-chat links (wa.me). This is NOT the WhatsApp Business API;
 * it just opens a chat with a prefilled message.
 */

/** Human-readable page name used in the prefilled message. */
export function pageLabelFor(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/book")) return "booking";
  if (pathname.startsWith("/register")) return "registration";
  if (pathname.startsWith("/login")) return "login";
  if (pathname.startsWith("/dashboard")) return "client dashboard";
  if (pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password")) return "password reset";
  if (pathname.startsWith("/privacy")) return "privacy policy";
  if (pathname.startsWith("/terms")) return "terms of service";
  if (pathname.startsWith("/admin")) return "admin";
  return "website";
}

/** Returns null when the number is not configured, so the button can be hidden instead of broken. */
export function whatsappLink(pageLabel: string): string | null {
  const digits = WHATSAPP_NUMBER.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const message = `Hi ${BRAND_NAME}, I'm interested in a cleaning. I'm on the ${pageLabel} page.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
