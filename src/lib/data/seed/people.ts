import type { Membership, Person, PrivacyRequest, User } from "@/lib/types";
import type { SeedCtx } from "./context";

type PersonInput = Omit<Person, "privacy"> & { privacy?: Partial<Person["privacy"]> };

const person = (p: PersonInput): Person => ({
  ...p,
  privacy: { status: "visible", photoConsent: "granted", ...p.privacy },
});

const athlete = (
  id: string,
  firstName: string,
  lastName: string,
  birthYear: number,
  nodeId: string,
  extra: Partial<PersonInput> = {},
): Person => person({ id, firstName, lastName, birthYear, memberships: [{ nodeId, role: "athlete" }], ...extra });

const staff = (
  id: string,
  firstName: string,
  lastName: string,
  memberships: Membership[],
  contact: Person["publicContact"],
  extra: Partial<PersonInput> = {},
): Person => person({ id, firstName, lastName, memberships, publicContact: contact, ...extra });

export function peopleSeed({ d }: SeedCtx): Person[] {
  return [
    /* ── J16-2 ──────────────────────────────────────────────────────────── */
    athlete("p-nora", "Nora", "Hansen", 2010, "j16-2", {
      guardianUserIds: ["u-line"],
      privacy: { consentUpdatedAt: d(-412), consentBy: "Line Hansen" },
    }),
    athlete("p-ida", "Ida", "Berg", 2010, "j16-2", { guardianUserIds: ["u-jonas"] }),
    athlete("p-thea", "Thea", "Nilsen", 2010, "j16-2"),
    athlete("p-emma", "Emma", "Solberg", 2011, "j16-2", { guardianUserIds: ["u-marte"] }),
    athlete("p-sofie", "Sofie", "Lund", 2010, "j16-2"),
    athlete("p-ingrid", "Ingrid", "Bakken", 2011, "j16-2"),
    athlete("p-selma", "Selma", "Aas", 2010, "j16-2"),
    athlete("p-frida", "Frida", "Holm", 2010, "j16-2"),
    athlete("p-hedda", "Hedda", "Moen", 2011, "j16-2"),
    athlete("p-tuva", "Tuva", "Sæther", 2010, "j16-2", { guardianUserIds: ["u-heidi"], privacy: { photoConsent: "unknown" } }),
    athlete("p-amalie", "Amalie", "Dahl", 2011, "j16-2"),
    athlete("p-julie", "Julie", "Haugen", 2010, "j16-2"),
    athlete("p-mathilde", "Mathilde", "Eide", 2011, "j16-2", { privacy: { photoConsent: "unknown" } }),
    athlete("p-aurora", "Aurora", "Solheim", 2010, "j16-2"),
    athlete("p-iman", "Iman", "Ali", 2011, "j16-2"),
    athlete("p-sara", "Sara", "Ahmadi", 2010, "j16-2", {
      privacy: { status: "restricted", photoConsent: "declined", consentUpdatedAt: d(-230), consentBy: "Foresatt" },
    }),

    /* ── J16-1 ──────────────────────────────────────────────────────────── */
    athlete("p-maja", "Maja", "Lie", 2010, "j16-1"),
    athlete("p-leah", "Leah", "Johansen", 2010, "j16-1"),
    athlete("p-vilde", "Vilde", "Kristiansen", 2010, "j16-1"),
    athlete("p-oda", "Oda", "Pettersen", 2011, "j16-1"),

    /* ── Other athletes ─────────────────────────────────────────────────── */
    athlete("p-sander", "Sander", "Myhre", 2012, "g14-1"),
    athlete("p-elias", "Elias", "Wang", 2012, "g14-1"),
    athlete("p-oskar", "Oskar", "Lien", 2012, "terreng-u13"),
    athlete("p-emil", "Emil", "Rød", 2012, "terreng-u13", { privacy: { photoConsent: "unknown" } }),
    athlete("p-liv", "Liv", "Andersen", 2011, "langrenn-ungdom"),
    athlete("p-nils", "Nils", "Eriksen", 1984, "tg1"),

    /* ── Coaches, managers and contacts ─────────────────────────────────── */
    staff("p-kristin", "Kristin", "Bråten", [{ nodeId: "j16-2", role: "headCoach" }], {
      email: "kristin.braten@oslosportsklubb.no",
      phone: "917 34 562",
    }),
    staff("p-espen", "Espen", "Myhre", [{ nodeId: "j16-2", role: "coach" }], { phone: "482 11 903" }),
    staff(
      "p-marte",
      "Marte",
      "Solberg",
      [{ nodeId: "j16-2", role: "teamManager" }],
      { email: "j16-2@oslosportsklubb.no", phone: "995 20 418" },
      { userId: "u-marte" },
    ),
    staff("p-jorgen", "Jørgen", "Evensen", [{ nodeId: "j16-1", role: "headCoach" }], { phone: "924 55 071" }),
    staff("p-hanne", "Hanne", "Wiik", [{ nodeId: "j16-1", role: "teamManager" }], { email: "j16-1@oslosportsklubb.no" }),
    staff("p-ahmed", "Ahmed", "Rashid", [{ nodeId: "g14-1", role: "headCoach" }], { phone: "406 38 227" }),
    staff("p-lars", "Lars", "Kolstad", [{ nodeId: "fotballskole", role: "headCoach", title: "Ansvarlig fotballskolen" }], {
      email: "fotballskolen@oslosportsklubb.no",
    }),
    staff("p-stine", "Stine", "Aasen", [{ nodeId: "kvinner", role: "headCoach" }], { phone: "971 02 846" }),
    staff("p-thomas", "Thomas", "Berge", [{ nodeId: "a-lag", role: "headCoach" }], { phone: "905 61 330" }),
    staff("p-kjersti", "Kjersti", "Moe", [{ nodeId: "j11", role: "headCoach" }], { phone: "468 90 115" }),
    staff(
      "p-torarne",
      "Tor Arne",
      "Vik",
      [{ nodeId: "fotball", role: "sectionLead", title: "Leder fotballavdelingen" }],
      { email: "fotball@oslosportsklubb.no", phone: "926 40 187" },
      { userId: "u-torarne" },
    ),
    staff(
      "p-henrik",
      "Henrik",
      "Aune",
      [{ nodeId: "sykkel", role: "sectionLead", title: "Leder sykkelgruppa" }],
      { email: "sykkel@oslosportsklubb.no", phone: "934 12 675" },
      { userId: "u-henrik" },
    ),
    staff(
      "p-silje",
      "Silje",
      "Rustad",
      [
        { nodeId: "terreng-u13", role: "headCoach", title: "Trener terreng ungdom" },
        { nodeId: "terreng-u15", role: "headCoach", title: "Trener terreng ungdom" },
      ],
      { email: "terreng@oslosportsklubb.no", phone: "413 77 902" },
      { userId: "u-silje" },
    ),
    staff("p-magnus", "Magnus", "Wold", [{ nodeId: "tg1", role: "coach", title: "Turleder" }], { phone: "951 83 240" }),
    staff("p-ola", "Ola", "Brekke", [{ nodeId: "tg2", role: "coach", title: "Turleder" }, { nodeId: "landevei-mosjon", role: "coach", title: "Turleder" }], {
      phone: "900 47 361",
    }),
    staff("p-johanne", "Johanne", "Lindberg", [{ nodeId: "landevei-junior", role: "headCoach" }], { phone: "477 23 508" }),
    staff("p-camilla", "Camilla", "Nordby", [{ nodeId: "terreng-barn", role: "headCoach", title: "Ansvarlig sykkelskolen" }], {
      phone: "918 06 442",
    }),
    staff("p-eirik", "Eirik", "Tangen", [{ nodeId: "langrenn", role: "sectionLead", title: "Leder langrenn" }], {
      email: "langrenn@oslosportsklubb.no",
      phone: "958 31 776",
    }),
    staff("p-guro", "Guro", "Myklebust", [{ nodeId: "langrenn-ungdom", role: "headCoach" }], { phone: "482 90 613" }),
    staff("p-per", "Per Ivar", "Strand", [{ nodeId: "langrenn-junior", role: "headCoach" }], { phone: "416 52 084" }),
    staff("p-anette", "Anette", "Vold", [{ nodeId: "langrenn-barn", role: "headCoach", title: "Ansvarlig skiskolen" }], {
      email: "skiskolen@oslosportsklubb.no",
    }),
    staff("p-geir", "Geir", "Holte", [{ nodeId: "langrenn-turlop", role: "coach" }], { phone: "992 14 730" }),
    staff(
      "p-kari",
      "Kari",
      "Lunde",
      [{ nodeId: "osk", role: "generalManager", title: "Daglig leder" }],
      { email: "post@oslosportsklubb.no", phone: "22 38 14 70" },
      { userId: "u-kari" },
    ),
    staff("p-bjorn", "Bjørn", "Hagen", [{ nodeId: "osk", role: "boardChair", title: "Styreleder" }], {
      email: "styret@oslosportsklubb.no",
    }),
  ];
}

export const userSeed = (): User[] => [
  {
    id: "u-kari",
    name: "Kari Lunde",
    email: "kari.lunde@oslosportsklubb.no",
    authProviders: ["google"],
    personId: "p-kari",
    guardianOfPersonIds: [],
    roles: [{ role: "clubAdmin", nodeId: "osk" }],
  },
  {
    id: "u-torarne",
    name: "Tor Arne Vik",
    email: "fotball@oslosportsklubb.no",
    authProviders: ["email"],
    personId: "p-torarne",
    guardianOfPersonIds: [],
    roles: [{ role: "sectionAdmin", nodeId: "fotball" }],
  },
  {
    id: "u-marte",
    name: "Marte Solberg",
    email: "marte.solberg@eksempel.no",
    phone: "995 20 418",
    authProviders: ["google", "email"],
    personId: "p-marte",
    guardianOfPersonIds: ["p-emma"],
    roles: [
      { role: "groupAdmin", nodeId: "j16-2" },
      { role: "guardian", nodeId: "j16-2" },
    ],
  },
  {
    id: "u-silje",
    name: "Silje Rustad",
    email: "silje.rustad@eksempel.no",
    authProviders: ["email"],
    personId: "p-silje",
    guardianOfPersonIds: [],
    roles: [
      { role: "groupAdmin", nodeId: "terreng-u13" },
      { role: "groupAdmin", nodeId: "terreng-u15" },
    ],
  },
  {
    id: "u-jonas",
    name: "Jonas Berg",
    email: "jonas.berg@eksempel.no",
    phone: "911 47 026",
    authProviders: ["email"],
    guardianOfPersonIds: ["p-ida"],
    roles: [
      { role: "contributor", nodeId: "j16-2" },
      { role: "guardian", nodeId: "j16-2" },
    ],
  },
  {
    id: "u-henrik",
    name: "Henrik Aune",
    email: "sykkel@oslosportsklubb.no",
    authProviders: ["google"],
    personId: "p-henrik",
    guardianOfPersonIds: [],
    roles: [{ role: "sectionAdmin", nodeId: "sykkel" }],
  },
  {
    id: "u-line",
    name: "Line Hansen",
    email: "line.hansen@eksempel.no",
    phone: "930 55 218",
    authProviders: ["email"],
    guardianOfPersonIds: ["p-nora"],
    roles: [{ role: "guardian", nodeId: "j16-2" }],
  },
  {
    id: "u-heidi",
    name: "Heidi Sæther",
    email: "heidi.sather@eksempel.no",
    phone: "482 60 137",
    authProviders: ["email"],
    guardianOfPersonIds: ["p-tuva"],
    roles: [{ role: "guardian", nodeId: "j16-2" }],
  },
];

export const privacyRequestSeed = ({ d }: SeedCtx): PrivacyRequest[] => [
  {
    id: "pr-nora",
    personId: "p-nora",
    kind: "anonymise",
    receivedAt: d(-3),
    fromName: "Line Hansen",
    relation: "Foresatt",
    message:
      "Nora ønsker ikke lenger å kunne kjennes igjen på klubbens nettside, heller ikke i gamle kampreferater og bilder. Hun fortsetter på laget.",
    status: "open",
  },
];
