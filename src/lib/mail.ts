/**
 * Sends e-mail from the site itself (invitations), over Resend's REST API with
 * plain fetch, like the rest of the site's outside calls. The sign-in codes do
 * not go through here: Supabase sends those itself, through the same Resend
 * domain, set up under Authentication > Emails there.
 *
 * Needs RESEND_API_KEY (a key with sending access). Without it nothing is
 * sent and `sendMail` says so, so the caller can fall back to a message the
 * person who invites hands over. MAIL_FROM overrides the sender; RESEND_API_URL
 * points the call elsewhere, which only tests use.
 */

const apiUrl = () => process.env.RESEND_API_URL ?? "https://api.resend.com/emails";
const apiKey = () => process.env.RESEND_API_KEY;

export const mailConfigured = () => !!apiKey();

/** «BOC <login@mail.jakobjolstad.com>»: the domain verified at Resend (see README). */
export const mailSender = (clubShortName: string) => process.env.MAIL_FROM ?? `${clubShortName} <login@mail.jakobjolstad.com>`;

export async function sendMail(mail: { from: string; to: string; subject: string; html: string; text: string }): Promise<boolean> {
  if (!mailConfigured()) return false;
  try {
    const res = await fetch(apiUrl(), {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: mail.from, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text }),
      cache: "no-store",
    });
    // Only the status is logged: the answer can repeat the address the mail was meant for.
    if (!res.ok) console.error("[mail] Resend avviste e-posten", res.status);
    return res.ok;
  } catch (error) {
    console.error("[mail] kunne ikke sende e-post", error instanceof Error ? error.message : error);
    return false;
  }
}
