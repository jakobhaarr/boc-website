import { checkText } from "./group-fields";
import type { Db } from "./types";

/**
 * A venue (arena, meeting point) as an admin edits it, and what the server
 * accepts. The photo is handled separately (setVenuePhoto), since it is a file.
 */
export interface VenueEdit {
  name: string;
  /** The place, e.g. «Bekkestua». */
  area: string;
  /** What it is, e.g. «Oppmøtested» or «BMX-bane». */
  surface: string;
  address: string;
  /** What the map link searches for. */
  mapQuery: string;
  /** How a sentence reaches the place: «på Bekkestua torg», «i Vestmarka», «ved Kaffebrenneriet». */
  preposition: "på" | "i" | "ved";
  note: string;
}

export const PREPOSITIONS: { id: VenueEdit["preposition"]; label: string }[] = [
  { id: "på", label: "på (på Bekkestua torg)" },
  { id: "i", label: "i (i Vestmarka)" },
  { id: "ved", label: "ved (ved Kaffebrenneriet)" },
];

export function validateVenueEdit(edit: VenueEdit): string | null {
  if (!edit.name.trim()) return "Gi arenaen et navn.";
  if (!edit.area.trim()) return "Skriv hvor arenaen ligger, for eksempel «Bekkestua».";
  if (!edit.mapQuery.trim()) return "Skriv hva kartlenken skal søke etter, for eksempel «Bekkestua torg, Bærum».";
  if (!PREPOSITIONS.some((p) => p.id === edit.preposition)) return "Velg «på», «i» eller «ved».";
  return (
    checkText("Navn", edit.name, 60) ??
    checkText("Sted", edit.area, 60) ??
    checkText("Type", edit.surface, 80) ??
    checkText("Adresse", edit.address, 120) ??
    checkText("Kartsøk", edit.mapQuery, 120) ??
    checkText("Merknad", edit.note, 300)
  );
}

/** Where a venue is used: deleting it is refused while it is. */
export function venueUsage(db: Db, venueId: string) {
  const groups = db.nodes.filter((n) => n.venueIds?.includes(venueId)).map((n) => n.name);
  const series = db.series.filter((s) => s.venueId === venueId).length;
  const activities = db.activities.filter((a) => a.venueId === venueId).length;
  return { groups, series, activities, used: groups.length + series + activities > 0 };
}
