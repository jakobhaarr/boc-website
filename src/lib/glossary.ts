import type { Org } from "./org";
import type { Db } from "./types";

/**
 * Club words a newcomer may not know, explained where they turn up in running
 * text (GlossaryText): a term gets a dotted underline and an «i», and the
 * explanation opens on hover, focus or tap. Built from the club's own data,
 * so the text follows it: the list of disciplines from the structure, the
 * riding rules from OrgNode.ridingRules. A club without the thing gets no
 * entry, and its text stays plain.
 */
export interface GlossaryEntry {
  id: string;
  /** RegExp source, matched case-insensitively; only the first match in a text is marked. */
  pattern: string;
  text: string;
  href?: string;
  hrefLabel?: string;
}

const listOf = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} og ${items.at(-1)}` : (items[0] ?? ""));

export function glossaryFor(db: Db, org: Org): GlossaryEntry[] {
  const entries: GlossaryEntry[] = [];

  // A one-sport club is divided into disciplines (BOC: landevei, terreng …).
  const sports = org.sports();
  const disciplines = sports.length === 1 ? org.children(sports[0].id).filter((c) => !org.isLeaf(c.id)) : [];
  if (disciplines.length) {
    entries.push({
      id: "disipliner",
      // «disiplin», «disipliner», «disiplinen»; not «en olympisk disiplin», which is about the sport.
      pattern: "(?<!olympisk )\\bdisiplin(?:er|en)?\\b",
      text: `${db.club.shortName} er delt i ${disciplines.length} disipliner: ${listOf(disciplines.map((d) => d.name.toLowerCase()))}. Hver disiplin har egne grupper, treningstider og kontaktpersoner.`,
      href: "/om-klubben#idretter",
      hrefLabel: "Se alle disiplinene",
    });
  }

  // The rules for riding together, where the club has written them down.
  const withRules = db.nodes.find((n) => n.ridingRules?.length);
  if (withRules?.ridingRules) {
    const titles = withRules.ridingRules.map((r) => r.title.charAt(0).toLowerCase() + r.title.slice(1));
    entries.push({
      id: "gruppekjoring",
      pattern: "regler(?:ne)? for gruppe(?:kjøring|sykling)",
      text: `${titles.length} regler for å sykle trygt sammen, blant annet ${listOf(titles.slice(0, 3))}.`,
      href: `${org.href(withRules.id)}#gruppekjoring`,
      hrefLabel: "Se alle reglene",
    });
  }

  return entries;
}
