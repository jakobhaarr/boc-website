/**
 * Call-to-action buttons and HTML blocks in a news article: what the editor offers and the server accepts.
 * Shared by the composer, the article editor, the server actions and the page.
 *
 * - A button has a label of at most BUTTON_LABEL_MAX characters (so it does not break the layout on a phone: the button
 *   is one line, never wrapped) and a link: https://, mailto:, tel:, or a page on this site that starts with «/».
 *   Nothing else is accepted, so a button can never run script (javascript:, data:).
 * - An HTML block is for advanced users and only club administrators may add one. It is shown in a sandboxed frame
 *   (components/public/html-embed.tsx): it cannot touch the site, its cookies or the page around it. It cannot be
 *   anonymised automatically, so the server refuses code that contains a registered person's full name.
 */
export const BUTTON_LABEL_MAX = 28;
export const BUTTON_URL_MAX = 500;
export const HTML_MAX = 20_000;
export const HTML_HEIGHT = { min: 80, max: 1200, default: 360 } as const;
/** How many buttons, pictures placed in the text and HTML blocks one article may have, so a page stays a page. */
export const MAX_BUTTONS = 6;
export const MAX_HTML_BLOCKS = 3;

export const BUTTON_URL_HELP = "Skriv en lenke som starter med https://, mailto: eller tel:, eller en side på nettsiden, for eksempel /bli-med.";

/**
 * The link as it will be stored, or null when it is not allowed. A bare address («www.klubben.no») gets https://.
 * Method: allowlist of schemes (https, mailto, tel) and site-internal paths; the URL must parse; control characters and
 * spaces are refused.
 */
export function normaliseButtonUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url || url.length > BUTTON_URL_MAX || /[\s\u0000-\u001f]/.test(url)) return null;
  if (url.startsWith("/")) return url.startsWith("//") ? null : url;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : /^[^/@:]+\.[^/@:]+/.test(url) ? `https://${url}` : null;
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === "https:" && parsed.hostname.includes(".")) return parsed.toString();
    if (parsed.protocol === "mailto:" && /^[^\s@]+@[^\s@]+\.[^\s@]+/.test(decodeURIComponent(parsed.pathname))) return candidate;
    if (parsed.protocol === "tel:" && /^\+?[0-9 ()-]{5,}$/.test(decodeURIComponent(parsed.pathname))) return candidate;
  } catch {
    return null;
  }
  return null;
}

/** The first problem with a button, in the words admin shows, or null. */
export function validateButton(label: string, url: string): string | null {
  const text = label.trim();
  if (!text) return "Knappen trenger en tekst.";
  if (/\n/.test(label)) return "Knappeteksten skal stå på én linje.";
  if (text.length > BUTTON_LABEL_MAX) return `Knappeteksten kan ha opptil ${BUTTON_LABEL_MAX} tegn.`;
  if (!normaliseButtonUrl(url)) return BUTTON_URL_HELP;
  return null;
}

export const clampHtmlHeight = (height: number) => Math.min(HTML_HEIGHT.max, Math.max(HTML_HEIGHT.min, Math.round(Number.isFinite(height) ? height : HTML_HEIGHT.default)));

/** The first problem with an HTML block, or null. Names are checked by the server against the register. */
export function validateHtml(code: string): string | null {
  if (!code.trim()) return "HTML-blokken er tom.";
  if (code.length > HTML_MAX) return `HTML-koden kan ha opptil ${HTML_MAX.toLocaleString("nb-NO")} tegn.`;
  return null;
}

export const isExternalUrl = (url: string) => /^(https?:|mailto:|tel:)/i.test(url);

const lower = (s: string) => s.toLocaleLowerCase("nb-NO");

/**
 * The full name of a registered person that stands in `text`, or undefined. Used for a button label and for HTML code: they
 * are stored as plain text, which anonymisation cannot rewrite, so a name must not be in them to begin with.
 */
export function personNameIn(text: string, people: { firstName: string; lastName: string }[]): string | undefined {
  const hay = lower(text);
  for (const p of people) {
    const full = `${p.firstName} ${p.lastName}`.trim();
    if (full.includes(" ") && hay.includes(lower(full))) return full;
  }
  return undefined;
}
