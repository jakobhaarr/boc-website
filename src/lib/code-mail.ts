import { sendMail, mailConfigured, mailSenderForHost } from "./mail";
import { generateCode, sendCode } from "./supabase-auth";

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** The sign-in code mail: the same look as the Supabase template in docs/epost-innloggingskode.html, with the real code. */
export function codeMail(opts: { clubName: string; clubShortName: string; code: string; siteUrl: string }) {
  const code = escapeHtml(opts.code);
  const site = escapeHtml(opts.siteUrl);
  const font = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  const head = "'Schibsted Grotesk',Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  const html = `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Koden din er ${code}. Den gjelder i ti minutter.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f8fa;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border:1px solid #e2e7ee;">
<tr><td style="background:#0b1315;padding:22px 28px;font-family:${head};"><span style="font-size:30px;line-height:34px;font-weight:700;letter-spacing:7px;color:#ffffff;">${escapeHtml(opts.clubShortName)}</span> <span style="font-size:14px;line-height:34px;font-weight:600;color:#ffffff;padding-left:14px;">${escapeHtml(opts.clubName)}</span></td></tr>
<tr><td style="background:#f7fd00;height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
<tr><td style="padding:32px 28px 4px;font-family:${font};"><h1 style="margin:0 0 12px;font-family:${head};font-size:24px;line-height:30px;font-weight:600;color:#0b1315;">Din innloggingskode</h1><p style="margin:0;font-size:16px;line-height:24px;color:#425168;">Bruk denne koden for &aring; logge inn p&aring; administrasjonen til ${escapeHtml(opts.clubShortName)}-nettsiden.</p></td></tr>
<tr><td style="padding:20px 28px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#fbffcf;border-left:6px solid #f7fd00;padding:20px 24px;"><div style="font-family:${font};font-size:12px;line-height:16px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#425168;">Engangskode</div><div style="padding-top:6px;font-family:'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace;font-size:38px;line-height:46px;font-weight:700;letter-spacing:8px;color:#0b1315;">${code}</div></td></tr></table></td></tr>
<tr><td style="padding:16px 28px 32px;font-family:${font};"><p style="margin:0 0 12px;font-size:16px;line-height:24px;color:#0b1315;">Koden gjelder i ti minutter og kan bare brukes &eacute;n gang.</p><p style="margin:0;font-size:14px;line-height:22px;color:#66758a;">Hvis du ikke ba om koden, kan du se bort fra denne e-posten. Ingen f&aring;r tilgang uten koden.</p></td></tr>
<tr><td style="border-top:1px solid #e2e7ee;padding:18px 28px;font-family:${font};font-size:13px;line-height:20px;color:#66758a;">${escapeHtml(opts.clubName)} &middot; <a href="${site}" style="color:#125a6b;text-decoration:underline;">${site}</a></td></tr>
</table></td></tr></table>`;
  const text = `Din innloggingskode: ${opts.code}\n\nBruk koden for å logge inn på administrasjonen til ${opts.clubShortName}-nettsiden. Den gjelder i ti minutter og kan bare brukes én gang.\n\nHvis du ikke ba om koden, kan du se bort fra denne e-posten.\n${opts.siteUrl}`;
  return { subject: `Innloggingskode til ${opts.clubShortName}`, html, text };
}

/**
 * Sends the sign-in code from the sender that fits the host the person is on (baerumock.no or jakobjolstad.com, see
 * `mailSenderForHost`). The site makes the code itself and mails it through Resend. If anything on that path fails
 * (no Resend key, the domain is not verified, Supabase gives no code), Supabase sends its own mail instead,
 * so a person is never left without a code.
 */
export async function sendLoginCodeMail(email: string, club: { name: string; shortName: string }, host: string, siteUrl: string): Promise<void> {
  if (mailConfigured()) {
    try {
      const code = await generateCode(email);
      if (code && (await sendMail({ from: mailSenderForHost(club.shortName, host), to: email, ...codeMail({ clubName: club.name, clubShortName: club.shortName, code, siteUrl }) }))) return;
    } catch (error) {
      console.error("[login] egen kodemail feilet, bruker Supabase", error instanceof Error ? error.message : error);
    }
  }
  await sendCode(email);
}
