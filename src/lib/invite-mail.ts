/**
 * The invitation e-mail: who invited, what access it gives, and a button to
 * the sign-in page with the address filled in. Styled like the sign-in code
 * mail in docs/epost-innloggingskode.html (BOC's theme: #0b1315 top,
 * #f7fd00 yellow, #125a6b teal, flat and square), with inline styles and a
 * table layout, since mail programs do not read ordinary CSS.
 */

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface InviteMailInput {
  clubName: string;
  /** Short form shown in the dark top bar, like «BOC». */
  clubShortName: string;
  name: string;
  /** What the access is, as part of a sentence: «lagadministrator for Zwift». */
  access: string;
  invitedBy: string;
  loginUrl: string;
}

export function inviteMail(input: InviteMailInput): { subject: string; html: string; text: string } {
  const first = input.name.trim().split(/\s+/)[0] || input.name;
  const subject = `Du er invitert til administrasjonen til ${input.clubShortName}`;
  const text = [
    `Hei ${first}!`,
    "",
    `${input.invitedBy} har gitt deg tilgang til administrasjonen til ${input.clubName} som ${input.access}.`,
    "",
    `Logg inn her: ${input.loginUrl}`,
    "",
    "Skriv inn e-postadressen din, så får du en kode på e-post. Du trenger ikke passord.",
    "",
    "Hvis du ikke venter denne e-posten, kan du se bort fra den.",
  ].join("\n");

  const font = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  const display = `'Schibsted Grotesk',${font}`;
  const html = `<!doctype html>
<html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f8fa;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.invitedBy)} har gitt deg tilgang til administrasjonen til ${escapeHtml(input.clubName)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f8fa;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border:1px solid #e2e7ee;">
      <tr><td style="background:#0b1315;padding:22px 28px;font-family:${display};">
        <span style="font-size:30px;line-height:34px;font-weight:700;letter-spacing:7px;color:#ffffff;">${escapeHtml(input.clubShortName)}</span>
        <span style="font-size:14px;line-height:34px;font-weight:600;color:#ffffff;padding-left:14px;">${escapeHtml(input.clubName)}</span>
      </td></tr>
      <tr><td style="background:#f7fd00;height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
      <tr><td style="padding:32px 28px 8px;font-family:${font};">
        <h1 style="margin:0 0 12px;font-family:${display};font-size:24px;line-height:30px;font-weight:600;color:#0b1315;">Hei ${escapeHtml(first)}!</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:24px;color:#0b1315;">${escapeHtml(input.invitedBy)} har gitt deg tilgang til administrasjonen til ${escapeHtml(input.clubName)} som <strong>${escapeHtml(input.access)}</strong>.</p>
        <p style="margin:0;font-size:16px;line-height:24px;color:#425168;">Der kan du holde siden din oppdatert og publisere innlegg og bilder.</p>
      </td></tr>
      <tr><td style="padding:24px 28px 8px;">
        <a href="${escapeHtml(input.loginUrl)}" style="display:inline-block;background:#125a6b;color:#ffffff;font-family:${font};font-size:16px;line-height:24px;font-weight:600;text-decoration:none;padding:12px 24px;">Logg inn</a>
      </td></tr>
      <tr><td style="padding:16px 28px 32px;font-family:${font};">
        <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#0b1315;">Skriv inn e-postadressen din, så får du en kode på e-post. Du trenger ikke passord.</p>
        <p style="margin:0;font-size:13px;line-height:20px;color:#66758a;">Virker ikke knappen? Lim inn denne adressen i nettleseren:<br><a href="${escapeHtml(input.loginUrl)}" style="color:#125a6b;word-break:break-all;">${escapeHtml(input.loginUrl)}</a></p>
      </td></tr>
      <tr><td style="border-top:1px solid #e2e7ee;padding:18px 28px;font-family:${font};font-size:13px;line-height:20px;color:#66758a;">Hvis du ikke venter denne e-posten, kan du se bort fra den. Ingen får tilgang uten koden som sendes til deg.</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
  return { subject, html, text };
}
