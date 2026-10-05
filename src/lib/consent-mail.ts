/**
 * The request to approve being shown in pictures: who asks, where, and a
 * button to the page where the person says yes or no (/samtykke/[token]).
 * Styled like the invitation (lib/invite-mail.ts): BOC's theme, flat and
 * square, inline styles and a table layout.
 */

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface ConsentMailInput {
  clubName: string;
  clubShortName: string;
  /** The person the pictures show, first name. */
  firstName: string;
  /** Who asks, by name. */
  askedBy: string;
  /** Where the pictures will be, «Landevei BOC 2» or the club. */
  where: string;
  count: number;
  url: string;
}

export function consentMail(input: ConsentMailInput): { subject: string; html: string; text: string } {
  const pictures = input.count === 1 ? "et bilde" : `${input.count} bilder`;
  const subject = `Godkjenn ${input.count === 1 ? "bildet" : "bildene"} av ${input.firstName}`;
  const text = [
    "Hei!",
    "",
    `${input.askedBy} i ${input.clubName} vil legge ut ${pictures} der ${input.firstName} kan kjennes igjen, på nettsiden til ${input.where}.`,
    "",
    `Se ${input.count === 1 ? "bildet" : "bildene"} og si ja eller nei her: ${input.url}`,
    "",
    `Bildene legges ikke ut før du har sagt ja. Hvis ${input.firstName} er under 18 år, svarer du som forelder eller foresatt. Du kan si nei, og da blir bildene ikke brukt.`,
    "",
    "Hvis du ikke venter denne e-posten, kan du se bort fra den.",
  ].join("\n");

  const font = "Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
  const display = `'Schibsted Grotesk',${font}`;
  const html = `<!doctype html>
<html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f8fa;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.askedBy)} ber om ditt samtykke til ${escapeHtml(pictures)}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f8fa;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#ffffff;border:1px solid #e2e7ee;">
      <tr><td style="background:#0b1315;padding:22px 28px;font-family:${display};">
        <span style="font-size:30px;line-height:34px;font-weight:700;letter-spacing:7px;color:#ffffff;">${escapeHtml(input.clubShortName)}</span>
        <span style="font-size:14px;line-height:34px;font-weight:600;color:#ffffff;padding-left:14px;">${escapeHtml(input.clubName)}</span>
      </td></tr>
      <tr><td style="background:#f7fd00;height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
      <tr><td style="padding:32px 28px 8px;font-family:${font};">
        <h1 style="margin:0 0 12px;font-family:${display};font-size:24px;line-height:30px;font-weight:600;color:#0b1315;">Godkjenn ${input.count === 1 ? "bildet" : "bildene"}</h1>
        <p style="margin:0 0 12px;font-size:16px;line-height:24px;color:#0b1315;">${escapeHtml(input.askedBy)} vil legge ut <strong>${escapeHtml(pictures)}</strong> der ${escapeHtml(input.firstName)} kan kjennes igjen, på nettsiden til ${escapeHtml(input.where)}.</p>
        <p style="margin:0;font-size:16px;line-height:24px;color:#425168;">Bildene legges ikke ut før du har sagt ja.</p>
      </td></tr>
      <tr><td style="padding:24px 28px 8px;">
        <a href="${escapeHtml(input.url)}" style="display:inline-block;background:#125a6b;color:#ffffff;font-family:${font};font-size:16px;line-height:24px;font-weight:600;text-decoration:none;padding:12px 24px;">Se ${input.count === 1 ? "bildet" : "bildene"} og svar</a>
      </td></tr>
      <tr><td style="padding:16px 28px 32px;font-family:${font};">
        <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#0b1315;">Hvis ${escapeHtml(input.firstName)} er under 18 år, svarer du som forelder eller foresatt. Du kan også si nei, og da blir ikke bildene brukt.</p>
        <p style="margin:0;font-size:13px;line-height:20px;color:#66758a;">Virker ikke knappen? Lim inn denne adressen i nettleseren:<br><a href="${escapeHtml(input.url)}" style="color:#125a6b;word-break:break-all;">${escapeHtml(input.url)}</a></p>
      </td></tr>
      <tr><td style="border-top:1px solid #e2e7ee;padding:18px 28px;font-family:${font};font-size:13px;line-height:20px;color:#66758a;">Hvis du ikke venter denne e-posten, kan du se bort fra den. Ingenting skjer uten at du svarer.</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
  return { subject, html, text };
}
