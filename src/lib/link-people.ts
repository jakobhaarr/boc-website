import { fullName } from "./content";
import { m, text } from "./rich-text";
import type { Inline, Person } from "./types";

/**
 * Plain text in, inline segments out: the people the author has confirmed
 * (or who were already linked in the text being edited) are turned into
 * mentions, so anonymising a person can later rewrite the text safely.
 * Shared by publishing and by editing a published article.
 */

/** What the sport calls those who take part: players in football, riders in cycling, otherwise athletes. */
const PARTICIPANTS: Record<string, string> = { fotball: "spillerne", sykkel: "rytterne" };

function neutralPhrase(person: Person, nodeId: string, sportId?: string): string {
  const role = person.memberships.find((x) => x.nodeId === nodeId)?.role ?? person.memberships[0]?.role;
  if (role === "teamManager") return "laglederen";
  if (role === "headCoach" || role === "coach") return "treneren";
  return `en av ${(sportId && PARTICIPANTS[sportId]) || "utøverne"}`;
}

/**
 * Turns plain composer text into inline segments, linking confirmed people.
 * Full names match first, then first names. Neutral wording is capitalised
 * when the mention starts a sentence.
 */
export function linkPeople(source: string, people: Person[], nodeId: string, sportId?: string): Inline[] {
  if (!people.length) return [text(source)];
  const patterns = people.flatMap((p) => [
    { person: p, needle: fullName(p) },
    { person: p, needle: p.firstName },
  ]);
  const escaped = patterns.map((p) => p.needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(?<![\\p{L}])(${escaped.join("|")})(?![\\p{L}])`, "gu");
  const out: Inline[] = [];
  let last = 0;
  for (const match of source.matchAll(re)) {
    const idx = match.index ?? 0;
    const hit = patterns.find((p) => p.needle === match[0]);
    if (!hit) continue;
    if (idx > last) out.push(text(source.slice(last, idx)));
    const before = source.slice(0, idx).trimEnd();
    const sentenceStart = before === "" || /[.!?]$/.test(before);
    const neutral = neutralPhrase(hit.person, nodeId, sportId);
    out.push(m(hit.person.id, match[0], sentenceStart ? neutral[0].toUpperCase() + neutral.slice(1) : neutral));
    last = idx + match[0].length;
  }
  if (last < source.length) out.push(text(source.slice(last)));
  return out;
}
