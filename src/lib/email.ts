/**
 * EMAIL PLACEHOLDER.
 *
 * No email provider is chosen yet. In development (or whenever EMAIL_PROVIDER_API_KEY is empty)
 * every email is printed to the server console instead of being sent.
 *
 * To connect a provider (Resend, Postmark, SES, SendGrid...):
 *   1. Set EMAIL_PROVIDER_API_KEY and EMAIL_FROM in .env
 *   2. Replace the TODO block in sendEmail() with the provider's SDK call.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;

  if (!apiKey) {
    console.log("\n[email:dev] ----------------------------------------");
    console.log(`To: ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    console.log(message.text);
    console.log("-----------------------------------------------------\n");
    return;
  }

  // TODO(owner): send through your email provider here, e.g.
  // await resend.emails.send({ from: process.env.EMAIL_FROM, to: message.to, subject: message.subject, text: message.text });
  console.warn("[email] EMAIL_PROVIDER_API_KEY is set but no provider is wired up yet. Email not sent.");
}
