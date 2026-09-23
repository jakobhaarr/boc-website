import type { Block, Inline } from "./types";

/**
 * Rich text is stored as inline segments. Any phrase that identifies a person
 * is a `mention` holding both the published wording and the neutral wording
 * to use if that person is anonymised. That is what lets the privacy engine
 * rewrite text safely instead of search-and-replacing names.
 */

export const text = (value: string): Inline => ({ type: "text", text: value });

export const m = (personId: string, phrase: string, neutral: string): Inline => ({
  type: "mention",
  personId,
  text: phrase,
  neutral,
});

/**
 * Tagged template for authoring seed content:
 *   rt`${m("p-nora", "Nora Hansen", "En av spillerne")} scoret to mål mot Lyn.`
 */
export function rt(strings: TemplateStringsArray, ...values: Inline[]): Inline[] {
  const out: Inline[] = [];
  strings.forEach((chunk, i) => {
    if (chunk) out.push(text(chunk));
    if (i < values.length) out.push(values[i]);
  });
  return out;
}

export const para = (content: Inline[]): Block => ({ type: "paragraph", content });

export function plain(inlines: Inline[] | undefined): string {
  return (inlines ?? []).map((i) => i.text).join("");
}

export function personIdsIn(inlines: Inline[] | undefined): string[] {
  return (inlines ?? []).flatMap((i) => (i.type === "mention" ? [i.personId] : []));
}

export function mentionsPerson(inlines: Inline[] | undefined, personId: string): boolean {
  return (inlines ?? []).some((i) => i.type === "mention" && i.personId === personId);
}

/** Replace every mention of `personId` with its neutral wording; merges adjacent text. */
export function neutralise(inlines: Inline[], personId: string): Inline[] {
  const out: Inline[] = [];
  for (const i of inlines) {
    const next: Inline = i.type === "mention" && i.personId === personId ? text(i.neutral) : i;
    const prev = out[out.length - 1];
    if (next.type === "text" && prev?.type === "text") {
      out[out.length - 1] = text(prev.text + next.text);
    } else if (next.type !== "text" || next.text) {
      out.push(next);
    }
  }
  return tidy(out);
}

/** Collapse double spaces and stray spacing before punctuation left by removed phrases. */
function tidy(inlines: Inline[]): Inline[] {
  return inlines.map((i) =>
    i.type === "text" ? text(i.text.replace(/ {2,}/g, " ").replace(/ ([.,;:!?])/g, "$1")) : i,
  );
}

/** First words of a block for admin listings. */
export function excerpt(blocks: Block[], max = 160): string {
  const first = blocks.find((b) => b.type === "paragraph");
  if (!first || first.type !== "paragraph") return "";
  const s = plain(first.content);
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, "")} …` : s;
}
