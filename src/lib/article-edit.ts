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
    return { index, editable: false, label: "Sitat" };
  });
}

export interface ArticleEdit {
  title: string;
  /** Empty removes the lead. */
  lead: string;
  /** New text for editable blocks by their index. An empty text removes the block. */
  texts: Record<number, string>;
  /** New paragraphs added after the last block. */
  added: string[];
  /** Only an administrator of the group may change it. */
  authorUserId?: string;
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
    if (!row?.editable) return "Fant ikke avsnittet som skulle endres.";
  }
  const kept = rows.filter((r) => !r.editable || (edit.texts[r.index] ?? r.text).trim()).length;
  if (kept + edit.added.filter((t) => t.trim()).length === 0 && !article.heroPhotoId) return "Innlegget trenger tekst eller bilder.";
  return null;
}
