/**
 * The honorary members (æresmedlemmer) of a club, shown on /aeresmedlemmer and linked from the footer. Plain names, not
 * people in the register: they are listed by the club's own decision, and a name is added here only when the club has
 * confirmed that it may be shown. `year` is when the annual meeting appointed them, where the minutes say so (the
 * `decisions` of /årsmøter); left out when it is not known. Kept in code and not in `Club`, because a club saved from admin
 * carries its own whole copy, which would hide a list added to the seed later.
 */
export interface HonoraryMember {
  name: string;
  year?: number;
}

const HONORARY: Record<string, HonoraryMember[]> = {
  boc: [
    { name: "Bård Anders Ballestad Rounge", year: 2026 },
    { name: "Arild Salte", year: 2024 },
    { name: "Jon Gravdal", year: 2023 },
    { name: "Jan Ketil Omberg" },
    { name: "Knut Brynjulf Eriksen" },
    { name: "Frank Solberg" },
    { name: "Nils Adolf Enger" },
    { name: "Stig Andreas Dalen" },
    { name: "Henrik Hartvig Munthe" },
  ],
};

/** Those with a known year first (newest first), then the rest by name. */
export function honoraryMembers(clubId: string): HonoraryMember[] {
  return [...(HONORARY[clubId] ?? [])].sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.name.localeCompare(b.name, "nb"));
}
