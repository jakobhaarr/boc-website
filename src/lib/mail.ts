/**
 * Sends e-mail from the site itself (invitations), over Resend's REST API with
 * plain fetch, like the rest of the site's outside calls. The sign-in codes go
 * through here too when the sender for the host is known (`codeSenderFor`,
 * lib/code-mail.ts); otherwise Supabase sends them itself, through its own
 * Resend setup under Authentication > Emails.
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

/**
 * The sender of the sign-in code for the host the person is on, so the code comes from the domain they know:
 * baerumock.no → login@baerumock.no, boc.jakobjolstad.com (and the like) → login@jakobjolstad.com.
 * MAIL_FROM_HOSTS overrides or adds, as «host=Avsender <adresse>» separated by «;», e.g.
 * «baerumock.no=BOC <login@mail.baerumock.no>». The domain must be verified at Resend; if Resend refuses, the caller falls back.
 */
export function mailSenderForHost(clubShortName: string, host: string | null | undefined): string {
  const bare = (host ?? "").toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
  const custom = (process.env.MAIL_FROM_HOSTS ?? "")
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => [p.slice(0, p.indexOf("=")).trim().toLowerCase(), p.slice(p.indexOf("=") + 1).trim()] as const);
  const hit = custom.find(([h, from]) => h && from && (bare === h || bare.endsWith(`.${h}`)));
  if (hit) return hit[1];
  if (bare === "baerumock.no" || bare.endsWith(".baerumock.no")) return `${clubShortName} <login@baerumock.no>`;
  if (bare === "jakobjolstad.com" || bare.endsWith(".jakobjolstad.com")) return `${clubShortName} <login@jakobjolstad.com>`;
  return mailSender(clubShortName);
}

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
