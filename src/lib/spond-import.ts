/**
 * A Spond member export («For import» sheet) read down to what the site
 * needs: a name, a birth year and whether the member has agreed to photos
 * online. Everything else in the export — e-mail, phone, address, school,
 * police certificate, guardians — is left unread, so it never reaches the
 * register. Columns are found by their Norwegian headings, so the order in
 * the file does not matter.
 */
export interface SpondMember {
  firstName: string;
  lastName: string;
  birthYear?: number;
  photoConsent: "granted" | "declined" | "unknown";
}

export interface SpondParse {
  members: SpondMember[];
  /** Headings in the file that were not read, so the admin can see what was left out. */
  ignored: string[];
  /** Rows with a name the parse could not use. */
  skipped: number;
}

const NAME = /navn/i;
const BIRTH = /fødselsdato|født/i;
const CONSENT = /fotosamtykke/i;

export function parseSpondMembers(rows: string[][]): SpondParse {
  const header = rows[0] ?? [];
  // The first heading with «navn» that is not a guardian's is the member's name.
  const nameCol = header.findIndex((h) => NAME.test(h) && !/foresatt/i.test(h));
  const birthCol = header.findIndex((h) => BIRTH.test(h));
  const consentCol = header.findIndex((h) => CONSENT.test(h));
  if (nameCol === -1) throw new Error("Fant ingen kolonne med navn. Er dette en medlemseksport fra Spond?");

  const used = new Set([nameCol, birthCol, consentCol]);
  const ignored = header.filter((h, i) => h && !used.has(i));

  const members: SpondMember[] = [];
  let skipped = 0;
  for (const row of rows.slice(1)) {
    const name = (row[nameCol] ?? "").replace(/\s+/g, " ").trim();
    if (!name) continue;
    const parts = name.split(" ");
    if (parts.length < 2) {
      skipped++;
      continue;
    }
    const year = birthCol === -1 ? undefined : Number((row[birthCol] ?? "").match(/(\d{4})\s*$/)?.[1]);
    const consent = consentCol === -1 ? "" : (row[consentCol] ?? "").toLowerCase();
    members.push({
      firstName: parts.slice(0, -1).join(" "),
      lastName: parts.at(-1)!,
      birthYear: year && year > 1900 ? year : undefined,
      photoConsent: consent === "ja" ? "granted" : consent === "nei" ? "declined" : "unknown",
    });
  }
  return { members, ignored, skipped };
}
