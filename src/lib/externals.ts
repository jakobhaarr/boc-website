import type { Db } from "./types";

/**
 * The externals: people the club names but who are not in the member register,
 * for now the photographers of its pictures (a parent, a hobby photographer).
 * Plain functions on the database, so the rules can be checked without a server.
 */

export const normaliseName = (value: string) => value.trim().replace(/\s+/g, " ");

export function validateExternalName(db: Db, value: string, ownId?: string): string | undefined {
  const name = normaliseName(value);
  if (name.length < 2) return "Skriv navnet.";
  if (name.length > 80) return "Navnet kan være opptil 80 tegn.";
  if (db.externals.some((e) => e.id !== ownId && normaliseName(e.name).toLocaleLowerCase("nb") === name.toLocaleLowerCase("nb"))) return "Denne personen finnes allerede blant de eksterne.";
  return undefined;
}

/** How many pictures credit this external. An external used anywhere cannot be deleted, so no credit is left pointing at nobody. */
export const externalUsage = (db: Db, externalId: string) => db.photos.filter((p) => p.photographer?.kind === "external" && p.photographer.refId === externalId).length;
