import { HEADING_MAX, MAX_BUTTONS, MAX_HTML_BLOCKS, validateButton, validateHtml } from "./article-cta";
import { checkText } from "./group-fields";
import { plain } from "./rich-text";
import type { Article, Block } from "./types";

/**
 * Editing a published article in admin: its headline, lead, text and author.
 * Shared by the form (what to show) and the server action (what to accept).
 *
 * The text is edited block by block. Paragraphs and subheadings are editable;
 * everything else (photos, galleries, lists, quotes, and paragraphs with links)
 * is kept exactly as it is and shown as a fixed row in its place, so editing
 * never loses a photo or a link. The address (slug) never changes: it must not
 * follow the text, since a name in a headline must not end up in a URL.
 */

export const TITLE_MAX = 140;
export const LEAD_MAX = 300;
export const PARAGRAPH_MAX = 4000;
export const MAX_ADDED = 20;

export type BlockRow =
  | { index: number; editable: true; kind: "paragraph" | "heading"; text: string }
  /** A call-to-action button and an HTML block can be changed or removed here; both stay as they are unless edited. */
  | { index: number; editable: true; kind: "button"; label: string; url: string }
  | { index: number; editable: true; kind: "html"; code: string; height: number }
  | { index: number; editable: false; label: string };

/** Rows for the form: one per block, in order. */
export function rowsOf(blocks: Block[]): BlockRow[] {
  return blocks.map((b, index): BlockRow => {
    if (b.type === "heading") return { index, editable: true, kind: "heading", text: b.text };
    if (b.type === "paragraph") {
      if (b.content.some((i) => i.type === "link")) return { index, editable: false, label: "Avsnitt med lenker. Det kan ikke endres her ennå." };
      return { index, editable: true, kind: "paragraph", text: plain(b.content) };
    }
    if (b.type === "photo") return { index, editable: false, label: "Bilde" };
    if (b.type === "gallery") return { index, editable: false, label: `Bildegalleri med ${b.photoIds.length} bilder` };
    if (b.type === "list") return { index, editable: false, label: `Liste med ${b.items.length} punkter` };
    if (b.type === "button") return { index, editable: true, kind: "button", label: b.label, url: b.url };
    if (b.type === "html") return { index, editable: true, kind: "html", code: b.code, height: b.height };
    return { index, editable: false, label: "Sitat" };
  });
}

/** A block added after an existing one (`afterIndex`, -1 for before the first): a button, HTML (club administrators), or a library picture. */
export type ArticleInsert = { afterIndex: number } & ({ t: "heading"; text: string } | { t: "button"; label: string; url: string } | { t: "html"; code: string; height: number } | { t: "photo"; photoId: string });

export interface ArticleEdit {
  title: string;
  /** Empty removes the lead. */
  lead: string;
  /** New text for editable blocks by their index. An empty text removes the block. */
  texts: Record<number, string>;
  /** New paragraphs added after the last block. */
  added: string[];
  /** New text for a button block by its index, or null to remove it. Left out, it stays. */
  buttons?: Record<number, { label: string; url: string } | null>;
  /** New code for an HTML block by its index, or null to remove it. Left out, it stays. */
  htmls?: Record<number, { code: string; height: number } | null>;
  /** Buttons, HTML and pictures added in the text. */
  inserts?: ArticleInsert[];
  /** Only an administrator of the group may change it. */
  authorUserId?: string;
  /** The group the article is published for; only for those who run both the old and the new one. */
  nodeId?: string;
  /** The main picture: a picture from the library, or empty to take it away. Left out, it stays. */
  heroPhotoId?: string;
  /** The date shown on the website, «ÅÅÅÅ-MM-DDTTT:MM» in club time; only for a published article, and not in the future. Left out, it stays. */
  publishedAt?: string;
}

/** Why a time to publish later cannot be used (not a time, not ahead of now, more than a year ahead), or null. */
export function scheduledAtError(value: string, now: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}:00Z`))) return "Skriv inn en gyldig dato og et klokkeslett for publiseringen.";
  if (value <= now.slice(0, 16)) return "Tidspunktet må være frem i tid. Velg «Publiser nå» for å publisere med en gang.";
  if (Date.parse(`${value}:00Z`) > Date.parse(`${now.slice(0, 16)}:00Z`) + 366 * 86400000) return "Du kan planlegge opptil ett år frem i tid.";
  return null;
}

/** Why a publishing date cannot be used (not a date, before 2000 or later than now), or null. `now` is club time in the same format. */
export function publishedAtError(value: string, now: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}:00Z`))) return "Skriv inn en gyldig publiseringsdato og et klokkeslett.";
  if (value < "2000-01-01T00:00") return "Publiseringsdatoen er for langt tilbake i tid.";
  if (value > now.slice(0, 16)) return "Publiseringsdatoen kan ikke være i fremtiden.";
  return null;
}

/** The first message that stops an edit from being saved, or null. */
export function validateArticleEdit(edit: ArticleEdit, article: Pick<Article, "blocks" | "heroPhotoId">): string | null {
  if (!edit.title.trim()) return "Innlegget trenger en overskrift.";
  const errors = [
    checkText("Overskrift", edit.title, TITLE_MAX),
    checkText("Ingress", edit.lead, LEAD_MAX),
    ...Object.values(edit.texts).map((t) => checkText("Teksten", t, PARAGRAPH_MAX)),
    ...edit.added.map((t) => checkText("Teksten", t, PARAGRAPH_MAX)),
  ];
  const first = errors.find(Boolean);
  if (first) return first;
  if (edit.added.length > MAX_ADDED) return `Du kan legge til opptil ${MAX_ADDED} avsnitt om gangen.`;

  const rows = rowsOf(article.blocks);
  for (const key of Object.keys(edit.texts)) {
    const row = rows[Number(key)];
    if (!row?.editable || (row.kind !== "paragraph" && row.kind !== "heading")) return "Fant ikke avsnittet som skulle endres.";
  }
  for (const [key, value] of Object.entries(edit.buttons ?? {})) {
    const row = rows[Number(key)];
    if (!row?.editable || row.kind !== "button") return "Fant ikke knappen som skulle endres.";
    const problem = value && validateButton(value.label, value.url);
    if (problem) return problem;
  }
  for (const [key, value] of Object.entries(edit.htmls ?? {})) {
    const row = rows[Number(key)];
    if (!row?.editable || row.kind !== "html") return "Fant ikke HTML-blokken som skulle endres.";
    const problem = value && validateHtml(value.code);
    if (problem) return problem;
  }
  const inserts = edit.inserts ?? [];
  if (inserts.length > MAX_ADDED) return `Du kan legge til opptil ${MAX_ADDED} blokker om gangen.`;
  for (const ins of inserts) {
    if (!Number.isInteger(ins.afterIndex) || ins.afterIndex < -1 || ins.afterIndex >= rows.length) return "Fant ikke stedet blokken skulle stå.";
    const problem = ins.t === "heading" ? (ins.text.length > HEADING_MAX ? `Mellomtittelen kan ha opptil ${HEADING_MAX} tegn.` : null) : ins.t === "button" ? validateButton(ins.label, ins.url) : ins.t === "html" ? validateHtml(ins.code) : null;
    if (problem) return problem;
  }
  const buttonsAfter = rows.filter((r) => r.editable && r.kind === "button" && edit.buttons?.[r.index] !== null).length + inserts.filter((i) => i.t === "button").length;
  if (buttonsAfter > MAX_BUTTONS) return `Et innlegg kan ha opptil ${MAX_BUTTONS} knapper.`;
  const htmlsAfter = rows.filter((r) => r.editable && r.kind === "html" && edit.htmls?.[r.index] !== null).length + inserts.filter((i) => i.t === "html").length;
  if (htmlsAfter > MAX_HTML_BLOCKS) return `Et innlegg kan ha opptil ${MAX_HTML_BLOCKS} HTML-blokker.`;
  const kept = rows.filter((r) => !r.editable || (r.kind === "button" ? edit.buttons?.[r.index] !== null : r.kind === "html" ? edit.htmls?.[r.index] !== null : (edit.texts[r.index] ?? r.text).trim())).length;
  if (kept + edit.added.filter((t) => t.trim()).length === 0 && !article.heroPhotoId) return "Innlegget trenger tekst eller bilder.";
  return null;
}
