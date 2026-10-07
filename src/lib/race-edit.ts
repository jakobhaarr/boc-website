import { checkText } from "./group-fields";
import type { Db } from "./types";

/**
 * A ride (Race) as an admin edits it, and what the server accepts. The ride's
 * own page (slug, info, page) is not edited here: it is the club's own words
 * about what the organiser's site says, and stays as it is.
 */
export interface RaceEdit {
  /** The branch the ride belongs to (Landevei, Terreng). */
  nodeId: string;
  name: string;
  /** The date the organiser has published, `YYYY-MM-DD`. */
  date: string;
  /** Last day of a ride over several days, or empty. */
  endDate: string;
  place: string;
  /** What it is when it is not a mass-start road race («Temporitt»), or empty. */
  format: string;
  organiser: string;
  /** The organiser's own page, https, or empty. */
  url: string;
  /** Arranged by the club itself. */
  ownEvent: boolean;
  /** The groups that train towards it. */
  groupIds: string[];
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** What is wrong with the edit, in a sentence for the person editing, or null. `branchIds` are the branches they may use. */
export function validateRaceEdit(edit: RaceEdit, db: Pick<Db, "nodes">, branchIds: string[]): string | null {
  if (!edit.name.trim()) return "Gi rittet et navn.";
  if (!branchIds.includes(edit.nodeId)) return "Velg en gren du har tilgang til.";
  if (!ISO.test(edit.date)) return "Velg dato for rittet.";
  if (edit.endDate && (!ISO.test(edit.endDate) || edit.endDate < edit.date)) return "Siste dag kan ikke være før første dag.";
  if (edit.url && !/^https:\/\/[^\s]+$/.test(edit.url.trim())) return "Lenken må begynne med https://.";
  const groups = new Set(db.nodes.map((n) => n.id));
  if (edit.groupIds.some((id) => !groups.has(id))) return "En av gruppene finnes ikke lenger.";
  return (
    checkText("Navn", edit.name, 80) ??
    checkText("Sted", edit.place, 120) ??
    checkText("Format", edit.format, 40) ??
    checkText("Arrangør", edit.organiser, 80)
  );
}
