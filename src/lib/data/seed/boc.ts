import bmxPhoto from "@/components/assets/bmx.jpg";
import bmxYouthPhoto from "@/components/assets/bmx-barn.jpg";
import kitsPhoto from "@/components/assets/boc-kits.png";
import jerseyBlack from "@/components/assets/boc-jersey-black-cutout.png";
import jerseyYellow from "@/components/assets/boc-jersey-yellow-cutout.png";
import styrkeprovenNarrow from "@/components/assets/boc1-styrkeproven.jpg";
import styrkeprovenHero from "@/components/assets/boc1-styrkeproven-wide.jpg";
import zwiftPhoto from "@/components/assets/boc-zwift-hero.png";
import companionMenu from "@/components/assets/zwift/companion-1-meny.png";
import companionSearch from "@/components/assets/zwift/companion-2-sok.png";
import companionMeetups from "@/components/assets/zwift/companion-3-meetups.png";
import companionAccept from "@/components/assets/zwift/companion-4-godta.png";
import terrengPhoto from "@/components/assets/terreng.jpeg";
import velodromPhoto from "@/components/assets/velodrom-meetup.jpg";
import jakobPhoto from "@/components/assets/jakob.jpg";
import { para, text } from "@/lib/rich-text";
import type { Activity, Article, Block, Club, Inline, Db, LevelId, OrgNode, Person, Photo, Race, TrainingSeries, User, Venue } from "@/lib/types";
import type { SeedCtx } from "./context";
import { themeSeed } from "./org";

/**
 * Bærum og Omegn Cykleklubb — the single-sport club in the prototype.
 *
 * Structure, colours, partners and news headlines follow the real club
 * (baerumock.no); the news bodies are short summaries written for the demo,
 * not copies of the club's articles. Riders and their families are invented,
 * because a prototype about consent should not carry real people's data. The
 * photographs are drawn (see ./art.ts) for the same reason.
 */

const SPOND_SIGNUP = "https://club.spond.com/landing/signup/boc/form/80A02DFABAC3441EBF1FCF28EE0E1A7F";
const VELODROM_SPOND = "https://spond.com/invite/OHNOO";
const BMX_FACEBOOK = "https://www.facebook.com/BOCBMX";

/** A bundled screenshot as plain data (src and size), for a join wizard. */
const screenshot = (img: { src: string; width: number; height: number }) => ({ src: img.src, width: img.width, height: img.height });

const bmxParticipation = (fee: number): NonNullable<OrgNode["participation"]> => ({
  title: "Slik blir du med",
  intro: "BMX-gruppene er aldersinndelt og trener tirsdag og torsdag i Bærum Sykkelpark. Klubben arrangerer jevnlig rekruttdager for dem som vil prøve.",
  steps: [
    "Følg BOC BMX på Facebook for neste rekruttdag, eller kontakt post@baerumock.no.",
    "Meld deg på rekruttdagen via Spond. Klubben har noe utstyr til utlån.",
    "Til fast trening trenger du BMX-racingsykkel, helhjelm med visir og hakebeskytter, langermet trøye og bukse, sko med flat såle og sykkelhansker. Kne- og albuebeskyttere anbefales.",
    "Bli medlem i BOC og skaff lisens fra Norges Cykleforbund. Lisensen er gratis til og med 12 år.",
  ],
  note: `Treningsavgift for denne gruppen er kr ${fee.toLocaleString("nb-NO")}. Påmelding og siste beskjeder kommer i Spond.`,
  source: { kind: "web", label: "BOC BMX på Facebook", url: BMX_FACEBOOK },
});

const velodromParticipation: NonNullable<OrgNode["participation"]> = {
  title: "Fra introkurs til banetrening",
  intro:
    "Kursdatoer, kapasitet og medlemspris publiseres i BOC Velodrom-gruppen i Spond. Eystein Westgaard har tidligere vært en av klubbens instruktører, og medlemstilbud har inkludert sykkel, hjelm og eventuelle sko i egenandelen.",
  steps: [
    "Åpne invitasjonslenken til BOC Velodrom i Spond, eller bruk gruppekode OHNOO.",
    "Meld deg først på et introkurs. Der lærer du fastnavssykkelen, banen og de viktigste sikkerhetsreglene.",
    "Etter bestått introkurs kan du melde deg på A1-baneakkreditering.",
    "Med A1 kan du delta på åpne timer og organisert trening. Sjekk alltid Spond for gjeldende dato, pris og utstyrsinformasjon.",
  ],
  note: "Som eksempel kostet klubbens tilbud i desember 2025 kr 250 for intro og kr 350 for A1, mot ordinært kr 500 og kr 700. Dette er historiske priser; dagens tilbud står i Spond.",
  source: { kind: "spond", label: "Åpne BOC Velodrom i Spond", url: VELODROM_SPOND },
};

const club = (): Club => ({
  id: "boc",
  name: "Bærum og Omegn Cykleklubb",
  shortName: "BOC",
  founded: 1974,
  orgNumber: "984 061 501",
  email: "post@boc.no",
  phone: "67 54 22 10",
  address: { street: "Klubbhuset, Bærum Idrettspark", postalCode: "1351", city: "Rud" },
  about:
    "Bærum og Omegn Cykleklubb er en sykkelklubb med fem disipliner: landevei, terreng, BMX, banesykling og innendørs. Klubben drives av frivillige, og har tilbud fra sykkelskole for de yngste til ritt på nasjonalt nivå.",
  heroPhotoId: "b-ph-hero",
  youthPhotoId: "b-ph-bmx-barn",
  /* The statement has two jobs in one breath. The weekly training is what a
     member actually gets — 28 of the club's sessions a week are fellestrening
     — so it comes first and is what "hele året" is about: road through the
     summer, spinning and Zwift through the winter. The races and Mallorca
     follow, because those are the part a free social ride cannot arrange,
     and they are the answer to "why join a club at all". The supporting line
     names both audiences, so a parent knows in one sentence that they are in
     the right place. */
  identity: {
    // Not "hele sommeren": the race calendar is heavy from 1 May to 30 June,
    // empty through July while the club is on fellesferie, and picks up again
    // in August and September.
    headline: "Fellestreninger hele året. Ritt på vår, sommer og høst.",
    headlineMuted: "Mallorca i mars og oktober.",
    intro:
      "Fire landeveis-grupper for voksne, og egne grupper for barn og ungdom fra 5 til 17 år. Om vinteren flytter vi inn på spinning og Zwift, og i Velodromen sykler vi hele året.",
    reach: { value: "Alle nivåer", label: "nybegynner til elitesyklist" },
    newsKinds: "Referater, beskjeder og historier",
    aboutHeadline: "Bærum og Omegn Cykleklubb er en av landets største sykkelklubber, stiftet i 1974.",
    aboutMuted: "Alt arbeid gjøres av frivillige, og alle barn og unge kan prøve før de melder seg inn.",
    /* Written as an argument, not a description: the section has to say what
       a membership buys that turning up to a free group ride does not. */
    year: {
      headline: "Sykling er bedre sammen.",
      headlineMuted: "Å kjøre ritt i samme drakt og reise bort sammen krever en klubb.",
      note: "De fleste av oss kjører turritt- eller masterklassen, så du trenger ikke være rask for å stille. Påmelding skjer hos arrangøren.",
    },
  },
  themeId: "boc",
  logo: "wordmark",
  sponsors: [
    { name: "Genus", kind: "Hovedsamarbeidspartner" },
    { name: "Kalas", kind: "Klubbtøy" },
    { name: "Anton Sport", kind: "Utstyr og verksted" },
  ],
  membership: {
    adult: 900,
    youth: 600,
    family: 1700,
    note: "Treningsavgift kommer i tillegg per disiplin. Lisens til ritt kjøpes hos Norges Cykleforbund.",
  },
  signupUrl: SPOND_SIGNUP,
  grasrotandelenOrgNumber: "984061501",
  footerLinks: [{ label: "Medlemsfordeler", href: `/nyheter/${BOC_BENEFITS_SLUG}` }],
  kit: {
    headline: "Sykle i klubbdrakten.",
    headlineMuted: "Fra Kalas, i race- og fritidsdesign.",
    text: [
      "Klubbdraktene sys av Kalas og selges i perioder. Når Kalas åpner klubbutikken for et nytt drop, får du beskjed i Spond om når den åpner og hvor lenge den er åpen.",
      "Som medlem får du også fordeler hos Anton Sport, med bonus i Anton Club og fastpris på service, og 5 % av det du handler går tilbake til klubben.",
    ],
    photoId: "b-ph-kits",
    jerseys: [
      { src: jerseyYellow.src, width: jerseyYellow.width, height: jerseyYellow.height, alt: "BOCs racedrakt i klubbens gule racedesign", label: "Race" },
      { src: jerseyBlack.src, width: jerseyBlack.width, height: jerseyBlack.height, alt: "BOCs fritidsdrakt i sort med gule striper", label: "Fritid" },
    ],
    links: [{ label: "Se medlemsfordelene", href: `/nyheter/${BOC_BENEFITS_SLUG}` }],
  },
});

const venues = (): Venue[] => [
  {
    id: "b-idrettspark",
    name: "Bærum Idrettspark",
    area: "Rud",
    surface: "Asfalt og klubbhus",
    mapQuery: "Bærum Idrettspark, Rud",
    photoId: "b-ph-landevei-group",
    note: "Oppmøte for ungdom og junior. Garderober i idrettsparken.",
  },
  {
    id: "b-bekkestua",
    name: "Bekkestua torg",
    area: "Bekkestua",
    surface: "Oppmøtested",
    mapQuery: "Bekkestua torg, Bærum",
    note: "Vanlig oppmøte for BOC 1–4. Road Captain sier fra i Spond når gruppa møtes et annet sted.",
  },
  {
    id: "b-kaffebrenneriet",
    name: "Kaffebrenneriet",
    area: "Sandvika",
    surface: "Oppmøtested",
    mapQuery: "Kaffebrenneriet Sandvika",
    note: "Helgens oppmøte for BOC 1–4. Gruppene samles her og sykler hver for seg.",
  },
  {
    id: "b-sykkelpark",
    name: "Bærum Sykkelpark",
    area: "Bryn",
    surface: "BMX-bane med 5 meters startrampe",
    address: "Gamle Lommedalsvei 99, 1348 Rykkinn",
    mapQuery: "Gamle Lommedalsvei 99, Bærum",
    note: "Ved Bryn skole. Helhjelm, langermet trøye og bukse er påbudt på trening.",
  },
  {
    id: "b-gjonneshallen",
    name: "Gjønneshallen",
    area: "Bekkestua",
    surface: "Spinningsal",
    mapQuery: "Gjønneshallen, Bærum",
    note: "Ta med håndkle og drikke. Klubben har sykler i salen.",
  },
  {
    id: "b-velodromen",
    name: "Velodromen",
    area: "Asker",
    surface: "Innendørs velodrom",
    address: "Langenga 62, Asker",
    mapQuery: "Velodromen, Langenga 62, Asker",
    photoId: "b-ph-bane",
    note: "Banesykkel, hjelm og eventuelle sykkelsko kan lånes på kurs. Se Spond for gjeldende kurs og tider.",
  },
  {
    id: "b-gnist",
    name: "Gnist Gjettum",
    area: "Gjettum",
    surface: "Innendørs sykkelrom",
    mapQuery: "Gnist Gjettum, Bærum",
    note: "Vinterøkter for ungdom og junior.",
  },
  {
    id: "b-eineasen",
    name: "Eineåsen",
    area: "Eiksmarka",
    surface: "Sti og skogsvei",
    mapQuery: "Eineåsen, Bærum",
    note: "Oppmøte på parkeringen. Lykt fra oktober.",
  },
  {
    id: "b-kolsas",
    name: "Kolsås",
    area: "Kolsås",
    surface: "Sti",
    mapQuery: "Kolsåstoppen parkering, Bærum",
  },
  {
    id: "b-vestmarka",
    name: "Vestmarka",
    area: "Vestmarka",
    surface: "Sti og grus",
    mapQuery: "Vestmarksetra, Bærum",
  },
];

/* ── Organisation ─────────────────────────────────────────────────────── */

function nodes({ at, on }: SeedCtx): OrgNode[] {
  let order = 0;
  const node = (n: Omit<OrgNode, "sortOrder" | "updatedAt"> & { updatedAt?: string }): OrgNode => ({
    sortOrder: order++,
    updatedAt: at(-30, "12:00"),
    ...n,
  });
  const spond = (label: string) => [{ kind: "spond" as const, label, url: "https://spond.com" }];

  return [
    node({ id: "b-boc", parentId: null, kind: "club", name: "Bærum og Omegn Cykleklubb", slug: "" }),

    node({
      id: "b-sykkel",
      parentId: "b-boc",
      kind: "sport",
      name: "Sykkel",
      slug: "sykkel",
      leadTitle: "Gruppeleder",
      summary: "Fem disipliner: landevei, terreng, BMX, banesykling og innendørs.",
      description:
        "Klubben har tilbud hele året. Fellesgruppene på landevei møtes på Bekkestua torg i ukedagene og på Kaffebrenneriet i Sandvika i helgene, terrenggruppene holder til i Vestmarka og på Eineåsen, BMX har egen bane i Bærum Sykkelpark, banesyklingen går i Velodromen i Asker hele året, og om vinteren flytter mange av øktene inn på spinning og Zwift.",
      levelLabels: { discipline: "Disiplin", ageGroup: "Avdeling", team: "Gruppe" },
      coverPhotoId: "b-ph-landevei-group",
      identityPhotoId: "b-ph-landevei-corner",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet", "b-idrettspark", "b-sykkelpark", "b-eineasen", "b-velodromen"],
      season: "Landevei april–oktober, BMX og terreng mars–november, innendørs november–mars, banesykling hele året",
      joinInfo:
        "Alle kan prøve to økter før innmelding. Du trenger sykkel og godkjent hjelm. Innmelding skjer i Spond.",
      breaks: [
        { label: "Fellesferie, ingen organiserte treninger", from: on(7, 6), to: on(7, 26) },
        { label: "Innesesong: spinning, Zwift og styrke", from: on(11, 2), to: on(3, 15, 1) },
      ],
    }),

    /* ── Landevei ───────────────────────────────────────────────────────── */
    node({
      id: "b-landevei",
      parentId: "b-sykkel",
      kind: "discipline",
      name: "Landevei",
      slug: "landevei",
      // Through the winter the road riders train on Zwift; the season sits in every Landevei terminliste.
      seasonsInTerminliste: ["b-zwift"],
      leadTitle: "Road Captain",
      summary: "Fire fellesgrupper etter fart, og egen avdeling for barn og ungdom.",
      description:
        [
          "Fellestreningene går i fartsgrupper, så alle holder sammen. Hver gruppe har en Road Captain, og vi følger klubbens regler for gruppekjøring.",
          "Fra april til september trener BOC 1–4 tirsdag og torsdag kl. 17.30 fra Bekkestua torg, og lørdag kl. 10.00 er det langtur fra Kaffebrenneriet i Sandvika, der gruppene samles og sykler hver for seg. I juli er det fellesferie.",
          "Rundt mars og oktober reiser klubben en uke til Mallorca: rabattert hotell, ofte opp mot 50 deltakere og grupper på flere nivåer.",
        ].join("\n\n"),
      coverPhotoId: "b-ph-landevei-hero",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet", "b-idrettspark"],
      joinGroup: { kind: "spond", label: "Bli med i Landevei i Spond", url: "https://spond.com/invite/SKUOD" },
      joinInfo:
        "Bli med i Spond-gruppa for Landevei, så ser du øktene og kan melde deg på. Alle kan prøve to økter før innmelding. Du trenger landeveissykkel og godkjent hjelm.",
    }),
    node({
      id: "b-boc1",
      parentId: "b-landevei",
      kind: "team",
      name: "BOC 1",
      slug: "boc-1",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "Raskeste fellesgruppe, 33–37 km/t. Tirsdag og torsdag, og langtur lørdag.",
      description: "For deg som er vant til å sykle i felt og tåler høy fart over tid. Gruppa kjører ofte drag og rulling på flatt terreng.",
      seasonFocus: "Vätternrunden",
      coverPhotoId: "b-ph-boc-fast-hero",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet"],
      externalLinks: spond("BOC 1 i Spond"),
    }),
    node({
      id: "b-boc2",
      parentId: "b-landevei",
      kind: "team",
      name: "BOC 2",
      slug: "boc-2",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "30–33 km/t. Tirsdag og torsdag, og langtur lørdag.",
      coverPhotoId: "b-ph-boc-fast-hero",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet"],
      externalLinks: spond("BOC 2 i Spond"),
    }),
    node({
      id: "b-boc3",
      parentId: "b-landevei",
      kind: "team",
      name: "BOC 3",
      slug: "boc-3",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "27–30 km/t. Tirsdag og torsdag, og langtur lørdag.",
      coverPhotoId: "b-ph-landevei-coast",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet"],
    }),
    node({
      id: "b-boc4",
      parentId: "b-landevei",
      kind: "team",
      name: "BOC 4",
      slug: "boc-4",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "24–27 km/t, rolig tempo og ingen som blir sykla av. Tirsdag og torsdag, og langtur lørdag.",
      description: "Gruppa for deg som er ny på landevei eller vil sykle sosialt. Vi stopper for kaffe, og ingen sykler alene hjem.",
      joinInfo: "Møt opp på Bekkestua torg en mandag eller onsdag, og sjekk starttiden i Spond. Du trenger landeveissykkel, hjelm og noe å drikke.",
      coverPhotoId: "b-ph-landevei-coast",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet"],
    }),
    /* The two youth groups on the road sit under one heading rather than
       beside BOC 1–4: a parent looking for somewhere to put a fourteen-year-
       old should find one door, not two groups they have to compare. The
       groups themselves stay separate, because the training is. */
    node({
      id: "b-landevei-ung",
      parentId: "b-landevei",
      kind: "ageGroup",
      name: "Barn og ungdom",
      slug: "barn-og-ungdom",
      ageLabel: "13–18 år",
      ageRange: [13, 18],
      summary: "Ungdom og junior på landevei, med egne treninger og egen plan.",
      description:
        "Ungdomsgruppa og juniorgruppa trener hver for seg, men hører sammen: ungdom fra det året de fyller 13, junior fra 17. Begge møtes i Bærum Idrettspark, og begge kjører ritt for klubben gjennom sesongen.",
      coverPhotoId: "b-ph-landevei-pair",
      venueIds: ["b-idrettspark"],
    }),
    node({
      id: "b-ungdom",
      parentId: "b-landevei-ung",
      kind: "team",
      name: "Ungdom",
      slug: "ungdom",
      ageLabel: "13–16 år",
      ageRange: [13, 16],
      summary: "Intervaller tirsdag og langtur fredag, sammen med BSV Triatlon.",
      description:
        "Ungdomsgruppa drives sammen med BSV Triatlon og kombinerer intervaller, teknikk og lengre turer. Om vinteren er det innendørs sykling på Gnist Gjettum og løping og styrke i idrettsparken.",
      joinInfo:
        "Treningsavgiften er 850 kr per halvår, eller 150 kr i måneden. Du trenger sykkel og hjelm; resten avtaler vi. Ta kontakt med treneren, så blir du lagt til i Spond-gruppa.",
      coverPhotoId: "b-ph-landevei-pair",
      venueIds: ["b-idrettspark", "b-gnist"],
      externalLinks: spond("Ungdom i Spond"),
    }),
    node({
      id: "b-junior",
      parentId: "b-landevei-ung",
      kind: "team",
      name: "Junior",
      slug: "junior",
      ageLabel: "17–18 år",
      ageRange: [17, 18],
      summary: "For ryttere som satser på ritt, med egen plan gjennom sesongen.",
      coverPhotoId: "b-ph-landevei-corner",
      venueIds: ["b-idrettspark"],
      externalLinks: spond("Junior i Spond"),
    }),

    /* ── Terreng ────────────────────────────────────────────────────────── */
    node({
      id: "b-terreng",
      parentId: "b-sykkel",
      kind: "discipline",
      name: "Terreng",
      slug: "terreng",
      summary: "Sykkelskole, barn og ungdom, turgruppe, seniorgruppe og downhill.",
      description:
        "Terrenggruppene sykler på stiene i Vestmarka, på Eineåsen og rundt Kolsås. Vi legger vekt på teknikk og trygg kjøring før fart, og arrangerer spesialtreninger og turer gjennom sesongen.",
      coverPhotoId: "b-ph-terreng",
      venueIds: ["b-eineasen", "b-vestmarka", "b-kolsas"],
    }),
    node({
      id: "b-terrengskolen",
      parentId: "b-terreng",
      kind: "team",
      name: "Terrengsykkelskolen",
      slug: "terrengsykkelskolen",
      ageLabel: "6–10 år",
      ageRange: [6, 10],
      summary: "Første møte med sti og terreng. Mandager på Eineåsen.",
      joinInfo: "Møt opp på parkeringen ved Eineåsen en mandag. Hjelm er påbudt, og klubben låner ut sykkel til dem som trenger det.",
      coverPhotoId: "b-ph-terrengskolen",
      venueIds: ["b-eineasen"],
    }),
    node({
      id: "b-terreng-barn",
      parentId: "b-terreng",
      kind: "team",
      name: "Terreng – Barn og ungdom",
      slug: "barn-og-ungdom",
      ageLabel: "11–16 år",
      ageRange: [11, 16],
      summary: "Teknikk, stier og karusellritt. Onsdager i Vestmarka.",
      coverPhotoId: "b-ph-terreng-ungdom",
      venueIds: ["b-vestmarka", "b-eineasen"],
      externalLinks: spond("Terreng barn og ungdom i Spond"),
    }),
    node({
      id: "b-downhill",
      parentId: "b-terreng",
      kind: "team",
      name: "Downhill – Enduro",
      slug: "downhill-enduro",
      ageLabel: "Fra 13 år",
      ageRange: [13, 99],
      summary: "Utfor og enduro, med fellesturer til Drammen og Hafjell.",
      description: "Gruppa trener teknikk i bakkene rundt Bærum og reiser sammen til løp i Norgescupen i utfor.",
      league: "Norgescup utfor",
      coverPhotoId: "b-ph-downhill",
      venueIds: ["b-kolsas"],
    }),
    node({
      id: "b-terreng-tur",
      parentId: "b-terreng",
      kind: "team",
      name: "Terreng Tur",
      slug: "terreng-tur",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      summary: "Rolige turer på sti og grusvei, med kaffestopp. Torsdager.",
      coverPhotoId: "b-ph-terreng-berm",
      venueIds: ["b-vestmarka"],
    }),
    node({
      id: "b-terreng-senior",
      parentId: "b-terreng",
      kind: "team",
      name: "Terreng Senior",
      slug: "terreng-senior",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      summary: "Høyere tempo på sti, og ritt i terrengkarusellen. Onsdager.",
      coverPhotoId: "b-ph-terreng-berm",
      venueIds: ["b-kolsas", "b-vestmarka"],
    }),

    /* ── BMX ────────────────────────────────────────────────────────────── */
    node({
      id: "b-bmx",
      parentId: "b-sykkel",
      kind: "discipline",
      name: "BMX",
      slug: "bmx",
      summary: "Omtrent 80 aktive medlemmer fra fem år, med trening og løp for alle nivåer.",
      description:
        "BMX racing er en olympisk disiplin som kjøres på spesialbygde baner på 300–400 meter. Sporten kombinerer fart, spenning og tekniske ferdigheter. BOC trener i Bærum Sykkelpark fra april til oktober eller november, og deltar i lokale, regionale og nasjonale løp som Regionscup, Succé Cup og NM.",
      coverPhotoId: "b-ph-bmx-air",
      venueIds: ["b-sykkelpark"],
      season: "April–oktober/november",
      externalLinks: [
        { kind: "web", label: "Se BMX under Paris 2024", url: "https://www.youtube.com/watch?v=AIeimpCYXfE" },
        { kind: "web", label: "Utstyrguide", url: "https://www.baerumock.no/contentcategory/948569515" },
        { kind: "web", label: "BOC BMX på Facebook", url: BMX_FACEBOOK },
        { kind: "web", label: "Intern Facebook-gruppe", url: "https://www.facebook.com/groups/bocbmxintern/" },
        { kind: "web", label: "Bli medlem", url: "https://www.baerumock.no/contentcategory/948554353" },
        { kind: "web", label: "BMX hos Norges Cykleforbund", url: "https://sykling.no/bmx/" },
      ],
    }),
    node({
      id: "b-bmx-rekrutt",
      parentId: "b-bmx",
      kind: "team",
      name: "Gruppe 1",
      slug: "rekrutt",
      ageLabel: "5–7 år",
      ageRange: [5, 7],
      summary: "Tirsdag og torsdag kl. 18.00–19.00 i Bærum Sykkelpark.",
      joinInfo: "Vil du prøve BMX, kan du bli med på en rekruttdag. Påmelding skjer via Spond, og klubben har noe utstyr til utlån.",
      participation: bmxParticipation(800),
      coverPhotoId: "b-ph-bmx-berm",
      venueIds: ["b-sykkelpark"],
      externalLinks: [
        ...spond("Gruppe 1 i Spond"),
        { kind: "web", label: "NCF-lisens", url: "https://sykling.no/lisens/" },
      ],
    }),
    node({
      id: "b-bmx-racing",
      parentId: "b-bmx",
      kind: "team",
      name: "Gruppe 2",
      slug: "racing",
      ageLabel: "8–10 år",
      ageRange: [8, 10],
      summary: "Tirsdag og torsdag kl. 18.00–19.15 i Bærum Sykkelpark.",
      league: "Regionscup, Succé Cup og NM",
      participation: bmxParticipation(1500),
      coverPhotoId: "b-ph-bmx-air",
      venueIds: ["b-sykkelpark"],
      externalLinks: [
        ...spond("Gruppe 2 i Spond"),
        { kind: "web", label: "NCF-lisens", url: "https://sykling.no/lisens/" },
      ],
    }),
    node({
      id: "b-bmx-voksen",
      parentId: "b-bmx",
      kind: "team",
      name: "Gruppe 3",
      slug: "cruiser",
      ageLabel: "Fra 11 år",
      ageRange: [11, 99],
      summary: "Tirsdag og torsdag kl. 19.00–20.30 i Bærum Sykkelpark.",
      league: "Regionscup, Succé Cup og NM",
      participation: bmxParticipation(2500),
      coverPhotoId: "b-ph-bmx-berm",
      venueIds: ["b-sykkelpark"],
      externalLinks: [
        ...spond("Gruppe 3 i Spond"),
        { kind: "web", label: "NCF-lisens", url: "https://sykling.no/lisens/" },
      ],
    }),

    /* ── Banesykling ─────────────────────────────────────────────────────── */
    node({
      id: "b-bane",
      parentId: "b-sykkel",
      kind: "discipline",
      name: "Banesykling",
      slug: "banesykling",
      summary: "Kurs og banetrening i Velodromen i Asker hele året, for ungdom og voksne.",
      description:
        "Banegruppa sykler i Velodromen i Asker gjennom hele året, på fastnavssykler på en overbygd bane. Nye starter med introkurs og kan deretter ta A1-akkreditering, som gir tilgang til åpne timer og organisert trening. Sykkel og hjelm kan lånes på kurs.",
      joinInfo:
        "Banesykling krever kurs: nye starter med introkurs før A1-baneakkreditering. Kursene publiseres i Spond-gruppen BOC Velodrom, og banesykkel og hjelm lånes på kurset.",
      coverPhotoId: "b-ph-bane",
      venueIds: ["b-velodromen"],
    }),
    node({
      id: "b-banegruppa",
      parentId: "b-bane",
      kind: "team",
      name: "Banegruppa",
      slug: "banegruppa",
      ageLabel: "Fra 13 år",
      ageRange: [13, 99],
      summary: "Introkurs, A1-akkreditering og organiserte økter i Velodromen i Asker. Lånesykler til nye.",
      description:
        "BOC-medlemmer kan delta på rabatterte kurs i Velodromen. Introkurset gir en trygg innføring i fastnavssykkelen, banen og grunnleggende kjøreregler. Bestått introkurs er krav før A1-baneakkreditering, som åpner for åpne timer og organisert trening.",
      joinInfo: "Registrer deg i Spond-gruppen BOC Velodrom med kode OHNOO og meld deg på arrangementet der. Påmelding via velodromen.no er ikke nødvendig for kurs klubben organiserer i Spond.",
      announcement: {
        eyebrow: "Neste banekurs",
        title: "Dato og ledige plasser publiseres i Spond.",
        text: "Bli med i gruppen BOC Velodrom for å se neste introkurs og A1-kurs. Påmelding skjer direkte på kursarrangementet i Spond.",
        href: VELODROM_SPOND,
        linkLabel: "Se neste kurs og meld deg på",
      },
      participation: velodromParticipation,
      coverPhotoId: "b-ph-bane",
      venueIds: ["b-velodromen"],
      externalLinks: [{ kind: "spond", label: "BOC Velodrom i Spond", url: VELODROM_SPOND }],
    }),

    /* ── Innendørs ──────────────────────────────────────────────────────── */
    node({
      id: "b-innendors",
      parentId: "b-sykkel",
      kind: "discipline",
      name: "Innendørs",
      slug: "innendors",
      summary: "Spinning og Zwift fra november til mars.",
      description:
        "Når utesesongen er over, holder klubben beina i gang innendørs. Spinningtimene går i Gjønneshallen med klubbens egne instruktører, og på Zwift kjører vi felles intervalløkter mandag og onsdag fra 1. november ut mars.",
      coverPhotoId: "b-ph-spinning",
      venueIds: ["b-gjonneshallen"],
    }),
    node({
      id: "b-spinning",
      parentId: "b-innendors",
      kind: "team",
      name: "Spinning i Gjønneshallen",
      slug: "spinning",
      ageLabel: "Fra 15 år",
      ageRange: [15, 99],
      summary: "Tirsdager og torsdager fra oktober til mars. Åpent for alle medlemmer.",
      joinInfo: "Timene er gratis for medlemmer. Møt opp 10 minutter før, så hjelper instruktøren deg å stille inn sykkelen.",
      coverPhotoId: "b-ph-spinning",
      venueIds: ["b-gjonneshallen"],
      externalLinks: spond("Spinning i Spond"),
    }),
    node({
      id: "b-zwift",
      parentId: "b-innendors",
      kind: "team",
      name: "Zwift",
      slug: "zwift",
      ageLabel: "Fra 15 år",
      ageRange: [15, 99],
      summary: "Felles intervalløkt mandag og onsdag, 1. november ut mars. «Stay together» er på, så alle nivåer kan kjøre sammen.",
      description:
        "Jakob Jølstad inviterer til Meetups i Zwift, og vi kjører samme intervalløkt samtidig med «Stay together» slått på. Da holder alle følge i gruppa uansett watt, så ingen trenger å føle at de sinker noen.",
      joinInfo: "Du trenger Zwift-konto og smartrulle eller wattmåler. Følg Jakob Jølstad i Zwift Companion og aksepter Meetup-invitasjonen når den kommer.",
      participation: {
        title: "Slik blir du med på Zwift",
        intro: "Meetup-invitasjoner kan bare sendes til personer som følger arrangøren. Derfor må følgeforespørselen være på plass før Jakob setter opp økten.",
        steps: [
          "Åpne Zwift Companion, søk etter Jakob Jølstad og velg Følg.",
          "Når invitasjonen vises på startsiden i Companion, åpner du den og velger Going. Lagre eventuelt en påminnelse.",
          "Start Zwift i god tid, koble til rulle eller wattmåler og gå inn i en valgfri verden før økten begynner.",
          "Godta meldingen om å bli med i Meetup når den vises. Fortsett å tråkke for å bli med gruppen når «Keep Everyone Together» er aktivert.",
        ],
        note: "Meetupen bruker «Keep Everyone Together»: ulik watt går fint, men ryttere som slutter å tråkke kan falle av gruppen.",
        source: { kind: "web", label: "Zwifts Meetup-instrukser", url: "https://support.zwift.com/en_us/meetups-HJP7iUd4r" },
        /* The same path as the group's presentation (/presentasjon/zwift-2025-26),
           one step at a time with its screenshots from Zwift Companion. */
        wizard: [
          {
            title: "Gjør klar utstyret",
            text: "Alle nivåer kjører sammen, så du trenger ikke være i form. Du trenger bare det som skal til for å sykle i Zwift hjemme.",
            points: ["En Zwift-konto med abonnement (ca. 250 kr/mnd)", "En smartrulle eller en wattmåler på sykkelen", "Zwift Companion-appen på telefonen"],
          },
          {
            title: "Følg gruppelederen",
            text: "Meetup-invitasjoner kan bare sendes til dem som følger arrangøren, så dette må være gjort før økten settes opp.",
            points: ["Åpne Zwift Companion og trykk More", "Velg Find Zwifters", "Søk etter «Jakob Jølstad» og trykk følg-knappen"],
            images: [
              { ...screenshot(companionMenu), alt: "Zwift Companion: More nederst til høyre, og Find Zwifters i menyen" },
              { ...screenshot(companionSearch), alt: "Zwift Companion: søk etter Jakob Jølstad og følg-knappen" },
            ],
          },
          {
            title: "Godta invitasjonen",
            text: "Før hver økt får du en invitasjon til Meetupen. Godta den, så står du på lista.",
            points: ["Trykk Events", "Velg Meetups og finn økta under «Your Meetups»", "Åpne den og trykk på haken"],
            images: [
              { ...screenshot(companionMeetups), alt: "Zwift Companion: Events, Meetups og invitasjonen under Your Meetups" },
              { ...screenshot(companionAccept), alt: "Zwift Companion: Meetup-invitasjonen med grønn hake for å godta" },
            ],
          },
          {
            title: "Bli med når økten starter",
            text: "Start Zwift i god tid og koble til rulla eller wattmåleren.",
            points: [
              "Logg på Zwift",
              "Meetupen ligger som foreslått aktivitet",
              "Gå inn på den og vent på start",
              "Fortsett å tråkke: med «Keep Everyone Together» holder du følge uansett watt",
            ],
          },
          {
            title: "Velg dagens intervalløkt",
            text: "Alle kjører samme workout. Hvilken står i beskrivelsen av dagens økt.",
            points: ["Stå klar med sykkelen i Meetupen", "Klikk Meny → Workouts", "Velg økta som står i beskrivelsen"],
          },
        ],
        wizardDone: { label: "Se presentasjonen", href: "/presentasjon/zwift-2025-26" },
      },
      coverPhotoId: "b-ph-zwift",
      /* Fryd Vinterligaen (frydvinterligaen.no): a Zwift league run by
         5071CK, eight races through the winter. Taking part is up to each
         rider, who signs up with the organiser. */
      announcement: {
        eyebrow: "Frivillig for Zwift-gruppa · Fryd Vinterligaen 2026/27",
        title: "Påmeldingen til Fryd Vinterligaen åpner 1. oktober kl. 12.",
        titleOpen: "Påmeldingen til Fryd Vinterligaen er åpen.",
        opensAt: "2026-10-01T12:00",
        until: "2027-03-31T23:59",
        text: "En liga på Zwift med åtte ritt gjennom vinteren, arrangert av 5071CK. Det er frivillig å være med, og du melder deg på selv hos arrangøren.",
        href: "https://www.frydvinterligaen.no/no/",
        linkLabel: "Til Fryd Vinterligaen",
        inline: true,
      },
      hideSections: ["terminliste", "season"],
      // Ridden in the evening, often in a dark room: the page is dark too.
      pageTone: "dark",
      heroActions: {
        primary: { label: "Slik kommer du i gang", href: "#slik-deltar-du" },
        secondary: { label: "Les om opplegget", href: "#faste" },
      },
      leadFact: { value: "Intervalltrening", label: "Meetups med workout" },
      seasonFact: { value: "Vintersesongen", label: "November til mars" },
      moreFacts: [{ value: "Alle nivåer", label: "Vi bruker «Keep together», så alle henger med" }],
      recommendFirst: true,
      externalLinks: [
        { kind: "web", label: "Presentasjon: Zwift med BOC, sesongen 2025/26", url: "/presentasjon/zwift-2025-26" },
        { kind: "web", label: "BOC på Zwift", url: "https://www.zwift.com" },
      ],
    }),
  ].map((n) => (LEVELS_BY_GROUP[n.id] ? { ...n, levels: LEVELS_BY_GROUP[n.id] } : n));
}

/**
 * Which levels each group welcomes (see lib/levels.ts). The landevei groups
 * step by speed; groups that ride together whatever the watts (Zwift with
 * «Stay together», spinning, bane with loan bikes) take everyone.
 */
const LEVELS_BY_GROUP: Record<string, LevelId[]> = {
  /* Placed on the three-step scale in lib/levels.ts. The road groups are a
     speed ladder, so they are kept narrow and overlapping by one step —
     that is what lets the finder rank BOC 3 above BOC 2 for someone who has
     ridden a bit. Indoor and track welcome everyone, so they list all three. */
  "b-boc1": ["aktiv"],
  "b-boc2": ["aktiv"],
  "b-boc3": ["litt", "aktiv"],
  "b-boc4": ["ny", "litt"],
  "b-ungdom": ["ny", "litt", "aktiv"],
  "b-junior": ["aktiv"],
  "b-terrengskolen": ["ny"],
  "b-terreng-barn": ["ny", "litt"],
  "b-downhill": ["litt", "aktiv"],
  "b-terreng-tur": ["ny", "litt"],
  "b-terreng-senior": ["aktiv"],
  "b-bmx-rekrutt": ["ny", "litt", "aktiv"],
  "b-bmx-racing": ["ny", "litt", "aktiv"],
  "b-bmx-voksen": ["ny", "litt", "aktiv"],
  "b-banegruppa": ["ny", "litt", "aktiv"],
  "b-spinning": ["ny", "litt", "aktiv"],
  "b-zwift": ["ny", "litt", "aktiv"],
};


/* ── People and users ─────────────────────────────────────────────────── */

const person = (p: Omit<Person, "privacy"> & { privacy?: Partial<Person["privacy"]> }): Person => ({
  ...p,
  privacy: { status: "visible", photoConsent: "granted", ...p.privacy },
});

/**
 * Staff and volunteers follow the roles published on the club's own site;
 * riders and guardians are invented for the demo, so no real member's data
 * (least of all a child's) lives in the prototype.
 */
function people({ d }: SeedCtx): Person[] {
  return [
    person({
      id: "bp-christian",
      firstName: "Christian",
      lastName: "Adriaenssens",
      memberships: [{ nodeId: "b-boc", role: "generalManager", title: "Styret" }],
      publicContact: { email: "post@boc.no" },
      userId: "bu-christian",
    }),
    person({
      id: "bp-anders",
      firstName: "Anders",
      lastName: "Anker-Rasch",
      memberships: [{ nodeId: "b-terreng", role: "sectionLead", title: "Leder terreng" }],
      publicContact: { email: "terreng@boc.no" },
      userId: "bu-anders",
    }),
    person({
      id: "bp-thelia",
      firstName: "Thélia",
      lastName: "Haugen",
      memberships: [{ nodeId: "b-bmx", role: "volunteer", title: "Kommunikasjon og sosiale medier" }],
      publicContact: { email: "post@baerumock.no" },
      userId: "bu-thelia",
    }),
    person({
      id: "bp-terje",
      firstName: "Terje",
      lastName: "Stav",
      memberships: [{ nodeId: "b-bmx", role: "sectionLead", title: "Gruppeleder BMX" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-synnove",
      firstName: "Synnøve",
      lastName: "Steinbru",
      memberships: [{ nodeId: "b-bmx", role: "teamManager", title: "Nestleder og medlemsansvarlig" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-jakob",
      firstName: "Jakob",
      lastName: "Jølstad",
      memberships: [{ nodeId: "b-zwift", role: "headCoach", title: "Gruppeleder Zwift" }],
      publicContact: { email: "zwift@boc.no" },
      userId: "bu-jakob",
      portraitPhotoId: "b-ph-jakob",
    }),
    /* Invented volunteers, coaches and riders */
    person({
      id: "bp-gunhild",
      firstName: "Gunhild",
      lastName: "Berg",
      memberships: [
        { nodeId: "b-ungdom", role: "headCoach" },
        { nodeId: "b-junior", role: "headCoach" },
      ],
      publicContact: { email: "ungdom@boc.no", phone: "900 80 676" },
      userId: "bu-gunhild",
    }),
    person({
      id: "bp-siv",
      firstName: "Siv",
      lastName: "Rennemo",
      memberships: [{ nodeId: "b-terreng-barn", role: "headCoach" }],
      publicContact: { phone: "473 90 116" },
    }),
    person({
      id: "bp-anders-h",
      firstName: "Anders",
      lastName: "Holt",
      memberships: [{ nodeId: "b-terrengskolen", role: "headCoach", title: "Ansvarlig terrengsykkelskolen" }],
      publicContact: { email: "terrengskolen@boc.no", phone: "920 15 774" },
      userId: "bu-anders-h",
    }),
    person({
      id: "bp-gunnar",
      firstName: "Gunnar",
      lastName: "Stenberg",
      memberships: [
        { nodeId: "b-boc1", role: "coach", title: "Road Captain" },
        { nodeId: "b-boc2", role: "coach", title: "Road Captain" },
      ],
      publicContact: { phone: "901 55 238" },
    }),
    person({
      id: "bp-kirsti",
      firstName: "Kirsti",
      lastName: "Lunder",
      memberships: [
        { nodeId: "b-boc3", role: "coach", title: "Road Captain" },
        { nodeId: "b-boc4", role: "coach", title: "Road Captain" },
      ],
      publicContact: { phone: "415 08 963" },
    }),
    person({
      id: "bp-heidi",
      firstName: "Heidi",
      lastName: "Wold",
      memberships: [{ nodeId: "b-spinning", role: "coach", title: "Instruktør" }],
      publicContact: { phone: "482 60 137" },
    }),
    person({
      id: "bp-wendy",
      firstName: "Wendy",
      lastName: "Scott",
      memberships: [{ nodeId: "b-bmx-rekrutt", role: "coach", title: "Foreldre- og hjelpetrener" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-kim",
      firstName: "Kim",
      lastName: "Reyes",
      memberships: [{ nodeId: "b-bmx-racing", role: "coach", title: "Foreldre- og hjelpetrener" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-are",
      firstName: "Are",
      lastName: "Tveit",
      memberships: [{ nodeId: "b-boc", role: "boardChair", title: "Styreleder" }],
      publicContact: { email: "styret@boc.no" },
    }),
    person({
      id: "bp-banesjef",
      firstName: "Petter",
      lastName: "Aas",
      memberships: [{ nodeId: "b-banegruppa", role: "coach", title: "Baneansvarlig" }],
      publicContact: { phone: "930 21 448" },
    }),

    /* Riders (invented) */
    person({ id: "bp-oliver", firstName: "Oliver", lastName: "Krogh", birthYear: 2013, memberships: [{ nodeId: "b-terreng-barn", role: "athlete" }], guardianUserIds: ["bu-tone"] }),
    person({
      id: "bp-mathea",
      firstName: "Mathea",
      lastName: "Fjeld",
      birthYear: 2012,
      memberships: [{ nodeId: "b-bmx-racing", role: "athlete" }],
      guardianUserIds: ["bu-rune"],
      privacy: { photoConsent: "unknown" },
    }),
    person({ id: "bp-noah", firstName: "Noah", lastName: "Stang", birthYear: 2016, memberships: [{ nodeId: "b-terrengskolen", role: "athlete" }], guardianUserIds: ["bu-rune"] }),
    person({ id: "bp-selma", firstName: "Selma", lastName: "Aarnes", birthYear: 2011, memberships: [{ nodeId: "b-ungdom", role: "athlete" }], guardianUserIds: ["bu-tone"] }),
    person({ id: "bp-jonas", firstName: "Jonas", lastName: "Five", birthYear: 2009, memberships: [{ nodeId: "b-junior", role: "athlete" }] }),
    person({ id: "bp-frank", firstName: "Frank", lastName: "Nyhus", birthYear: 1979, memberships: [{ nodeId: "b-boc1", role: "athlete" }] }),
    /* Adult riders in BOC 1 and BOC 2, invented like every rider here, so the
       groups have a membership to show (MemberGrid on the group page). */
    person({ id: "bp-ingrid-solheim", firstName: "Ingrid", lastName: "Solheim", birthYear: 1984, memberships: [{ nodeId: "b-boc1", role: "athlete" }] }),
    person({ id: "bp-martin-lie", firstName: "Martin", lastName: "Lie", birthYear: 1977, memberships: [{ nodeId: "b-boc1", role: "athlete" }] }),
    person({ id: "bp-kari-brekke", firstName: "Kari", lastName: "Brekke", birthYear: 1990, memberships: [{ nodeId: "b-boc1", role: "athlete" }] }),
    person({ id: "bp-henrik-moen", firstName: "Henrik", lastName: "Moen", birthYear: 1971, memberships: [{ nodeId: "b-boc1", role: "athlete" }] }),
    person({ id: "bp-sara-nygaard", firstName: "Sara", lastName: "Nygaard", birthYear: 1988, memberships: [{ nodeId: "b-boc1", role: "athlete" }] }),
    person({ id: "bp-espen-dahl", firstName: "Espen", lastName: "Dahl", birthYear: 1968, memberships: [{ nodeId: "b-boc1", role: "athlete" }] }),
    person({ id: "bp-marte-vik", firstName: "Marte", lastName: "Vik", birthYear: 1993, memberships: [{ nodeId: "b-boc1", role: "athlete" }] }),
    person({ id: "bp-tor-hagen", firstName: "Tor", lastName: "Hagen", birthYear: 1975, memberships: [{ nodeId: "b-boc1", role: "athlete" }] }),
    person({ id: "bp-line-aasen", firstName: "Line", lastName: "Aasen", birthYear: 1982, memberships: [{ nodeId: "b-boc1", role: "athlete" }] }),
    person({ id: "bp-knut-engen", firstName: "Knut", lastName: "Engen", birthYear: 1966, memberships: [{ nodeId: "b-boc2", role: "athlete" }] }),
    person({ id: "bp-hanne-strand", firstName: "Hanne", lastName: "Strand", birthYear: 1979, memberships: [{ nodeId: "b-boc2", role: "athlete" }] }),
    person({ id: "bp-ola-myhre", firstName: "Ola", lastName: "Myhre", birthYear: 1985, memberships: [{ nodeId: "b-boc2", role: "athlete" }] }),
    person({ id: "bp-randi-saether", firstName: "Randi", lastName: "Sæther", birthYear: 1972, memberships: [{ nodeId: "b-boc2", role: "athlete" }] }),
    person({ id: "bp-petter-lund", firstName: "Petter", lastName: "Lund", birthYear: 1980, memberships: [{ nodeId: "b-boc2", role: "athlete" }] }),
    person({ id: "bp-eirin-fossum", firstName: "Eirin", lastName: "Fossum", birthYear: 1991, memberships: [{ nodeId: "b-boc2", role: "athlete" }] }),
    person({ id: "bp-geir-ruud", firstName: "Geir", lastName: "Ruud", birthYear: 1963, memberships: [{ nodeId: "b-boc2", role: "athlete" }] }),
    person({ id: "bp-tone-bakke", firstName: "Tone", lastName: "Bakke", birthYear: 1976, memberships: [{ nodeId: "b-boc2", role: "athlete" }] }),
    person({ id: "bp-tone", firstName: "Tone", lastName: "Krogh", memberships: [{ nodeId: "b-terreng-barn", role: "volunteer", title: "Foreldrekontakt" }], publicContact: { phone: "938 76 410" }, userId: "bu-tone" }),
    person({ id: "bp-rune", firstName: "Rune", lastName: "Fjeld", memberships: [], userId: "bu-rune" }),
  ].map((p) => ({ ...p, privacy: { ...p.privacy, consentUpdatedAt: p.privacy.photoConsent === "granted" ? d(-260) : undefined } }));
}

const users = (): User[] => [
  {
    id: "bu-christian",
    name: "Christian Adriaenssens",
    email: "post@boc.no",
    authProviders: ["google"],
    personId: "bp-christian",
    guardianOfPersonIds: [],
    roles: [{ role: "clubAdmin", nodeId: "b-boc" }],
  },
  {
    id: "bu-anders",
    name: "Anders Anker-Rasch",
    email: "terreng@boc.no",
    authProviders: ["email"],
    personId: "bp-anders",
    guardianOfPersonIds: [],
    roles: [{ role: "sectionAdmin", nodeId: "b-terreng" }],
  },
  {
    id: "bu-thelia",
    name: "Thélia Haugen",
    email: "bmx@boc.no",
    authProviders: ["email"],
    personId: "bp-thelia",
    guardianOfPersonIds: [],
    roles: [{ role: "sectionAdmin", nodeId: "b-bmx" }],
  },
  {
    id: "bu-jakob",
    name: "Jakob Jølstad",
    email: "zwift@boc.no",
    authProviders: ["google", "email"],
    personId: "bp-jakob",
    guardianOfPersonIds: [],
    roles: [{ role: "groupAdmin", nodeId: "b-zwift" }],
  },
  {
    id: "bu-gunhild",
    name: "Gunhild Berg",
    email: "ungdom@boc.no",
    phone: "900 80 676",
    authProviders: ["email"],
    personId: "bp-gunhild",
    guardianOfPersonIds: [],
    roles: [
      { role: "groupAdmin", nodeId: "b-ungdom" },
      { role: "groupAdmin", nodeId: "b-junior" },
    ],
  },
  {
    id: "bu-anders-h",
    name: "Anders Holt",
    email: "terrengskolen@boc.no",
    phone: "920 15 774",
    authProviders: ["email"],
    personId: "bp-anders-h",
    guardianOfPersonIds: [],
    roles: [{ role: "groupAdmin", nodeId: "b-terrengskolen" }],
  },
  {
    id: "bu-tone",
    name: "Tone Krogh",
    email: "tone.krogh@eksempel.no",
    phone: "938 76 410",
    authProviders: ["email"],
    personId: "bp-tone",
    guardianOfPersonIds: ["bp-oliver", "bp-selma"],
    roles: [
      { role: "contributor", nodeId: "b-terreng-barn" },
      { role: "guardian", nodeId: "b-terreng-barn" },
    ],
  },
  {
    id: "bu-rune",
    name: "Rune Fjeld",
    email: "rune.fjeld@eksempel.no",
    phone: "922 30 654",
    authProviders: ["email"],
    personId: "bp-rune",
    guardianOfPersonIds: ["bp-mathea", "bp-noah"],
    roles: [{ role: "guardian", nodeId: "b-bmx-racing" }],
  },
];

/* ── Photographs ──────────────────────────────────────────────────────────
   Development photography from Unsplash, chosen to match what each group
   actually does — BMX on a track, terreng on a trail, bane on a velodrom —
   and shown with the film grade the club uses on its own shots (see
   .photo-film in globals.css). A real club replaces these with its own
   pictures; the riders are then covered by the consent and anonymisation
   flow like any other photo. */

interface PhotoDef {
  id: string;
  ref: string;
  width: number;
  height: number;
  tone: string;
  photographer: string;
  alt: string;
  nodeId: string;
  caption: string;
  focal?: { x: number; y: number };
}

const shot = (p: PhotoDef): Photo => ({
  id: p.id,
  src: `https://images.unsplash.com/${p.ref}`,
  width: p.width,
  height: p.height,
  focal: p.focal ?? { x: 50, y: 50 },
  tone: p.tone,
  alt: p.alt,
  caption: [text(p.caption)],
  nodeId: p.nodeId,
  grade: "film",
  people: [],
  redactions: [],
  source: { provider: "unsplash", photographer: p.photographer },
});

const photos = (): Photo[] => [
  /* The club's own photograph from Styrkeprøven, served from the
     project. It already carries its grade, so it gets no film treatment. */
  /* The club's own photograph from Styrkeprøven: the front page's hero. Its
     narrow cut is also the road groups' cover (b-ph-landevei-hero below) —
     the wide one puts the riders too far to the side in a cover's crop. */
  {
    id: "b-ph-hero",
    src: styrkeprovenHero.src,
    width: styrkeprovenHero.width,
    height: styrkeprovenHero.height,
    focal: { x: 40, y: 58 },
    tone: "#728171",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet på en fjellvei under Styrkeprøven",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  {
    id: "b-ph-hero-narrow",
    src: styrkeprovenNarrow.src,
    width: styrkeprovenNarrow.width,
    height: styrkeprovenNarrow.height,
    focal: { x: 50, y: 58 },
    tone: "#728171",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet på en fjellvei under Styrkeprøven",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* The same narrow cut as the cover of Landevei: closer,
     and with the frame lowered so the riders sit above the «Neste aktivitet»
     card that covers the lower left of a branch hero. */
  {
    id: "b-ph-landevei-hero",
    src: styrkeprovenNarrow.src,
    width: styrkeprovenNarrow.width,
    height: styrkeprovenNarrow.height,
    focal: { x: 35, y: 100 },
    zoom: 1.3,
    tone: "#728171",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet på en fjellvei under Styrkeprøven",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* BOC 1 and BOC 2 take the same cut a little further right: their covers
     are mostly seen as tall cards (the carousel), where the Landevei crop
     cuts the riders off at the right edge. */
  {
    id: "b-ph-boc-fast-hero",
    src: styrkeprovenNarrow.src,
    width: styrkeprovenNarrow.width,
    height: styrkeprovenNarrow.height,
    focal: { x: 55, y: 100 },
    zoom: 1.3,
    tone: "#728171",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet på en fjellvei under Styrkeprøven",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  {
    id: "b-ph-terreng",
    src: terrengPhoto.src,
    width: terrengPhoto.width,
    height: terrengPhoto.height,
    focal: { x: 55, y: 40 },
    tone: "#6c6353",
    alt: "Terrengsyklist i gul BOC-drakt i utforløype i skogen, med publikum bak spenningsbåndet",
    caption: [text("Utfor i terreng")],
    nodeId: "b-terreng",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  /* Landevei */
  shot({
    id: "b-ph-landevei-group",
    ref: "photo-1600403477955-2b8c2cfab221",
    width: 3936,
    height: 2624,
    tone: "#9aa39a",
    photographer: "Martin Magnemyr",
    focal: { x: 50, y: 62 },
    alt: "Gruppe syklister på smal vei gjennom skogen",
    nodeId: "b-landevei",
    caption: "Fellestrening i fartsgrupper",
  }),
  shot({
    id: "b-ph-landevei-corner",
    ref: "photo-1605050825077-289f85b6cf43",
    width: 3949,
    height: 2633,
    tone: "#b8bcc8",
    photographer: "Munbaik Cycling Clothing",
    focal: { x: 50, y: 58 },
    alt: "Tre syklister i sving på landevei",
    nodeId: "b-landevei",
    caption: "Rittfart på klubbtur",
  }),
  shot({
    id: "b-ph-landevei-coast",
    ref: "photo-1541625602330-2277a4c46182",
    width: 6000,
    height: 4000,
    tone: "#d9d9d9",
    photographer: "Coen van de Broek",
    focal: { x: 45, y: 55 },
    alt: "To syklister på vei langs sjøen",
    nodeId: "b-boc3",
    caption: "Søndagstur med kaffestopp",
  }),
  shot({
    id: "b-ph-landevei-pair",
    ref: "photo-1681295692638-97ace05f56b4",
    width: 5367,
    height: 3578,
    tone: "#cfd3cf",
    photographer: "Tuvalum",
    alt: "To syklister på vei med åser i bakgrunnen",
    nodeId: "b-ungdom",
    caption: "Langtur på fredag",
  }),

  /* Terreng */
  shot({
    id: "b-ph-terreng-berm",
    ref: "photo-1562861894-0918c74b6448",
    width: 5000,
    height: 2825,
    tone: "#555356",
    photographer: "Axel Brunst",
    focal: { x: 45, y: 55 },
    alt: "Terrengsyklist i doserte sving på skogssti",
    nodeId: "b-terreng",
    caption: "Stier i Vestmarka",
  }),
  shot({
    id: "b-ph-downhill",
    ref: "photo-1594942939850-d8da299577f3",
    width: 4000,
    height: 5000,
    tone: "#bab0a4",
    photographer: "Tim Foster",
    focal: { x: 50, y: 45 },
    alt: "Terrengsyklist på bratt, rotete sti",
    nodeId: "b-downhill",
    caption: "Utforsesongen i Drammen",
  }),
  shot({
    id: "b-ph-terreng-ungdom",
    ref: "photo-1566728060299-ad216d6fa3c1",
    width: 3840,
    height: 5760,
    tone: "#2d2d2d",
    photographer: "Markus Spiske",
    focal: { x: 50, y: 42 },
    alt: "Ung terrengsyklist med startnummer i skogen",
    nodeId: "b-terreng-barn",
    caption: "Karusellritt for ungdom",
  }),
  shot({
    id: "b-ph-terrengskolen",
    ref: "photo-1595010310173-5c30b556d052",
    width: 4000,
    height: 5000,
    tone: "#373117",
    photographer: "Kelly Sikkema",
    focal: { x: 50, y: 45 },
    alt: "Barn på terrengsykkel på grussti",
    nodeId: "b-terrengskolen",
    caption: "Terrengsykkelskolen på Eineåsen",
  }),

  /* The club's BMX photograph is shared by the discipline, groups and BMX
     stories so every BMX surface uses the supplied club imagery. */
  /* The club kits from Kalas, race and leisure. The source is a small
     screenshot with image-search marks along its foot, so the front page
     shows it cropped to the headings and jerseys (focal at the top). */
  {
    id: "b-ph-kits",
    src: kitsPhoto.src,
    width: kitsPhoto.width,
    height: kitsPhoto.height,
    focal: { x: 50, y: 0 },
    tone: "#1d2213",
    alt: "BOCs klubbdrakter fra Kalas: race-design i gult og fritidsdesign i svart",
    caption: [text("Klubbdraktene fra Kalas")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* Children in club kit on the BMX track: the top of /barn-og-ungdom.
     bmx-barn.jpg is the club's bmx-barn.avif unedited, only saved as JPEG:
     the AVIF's static import came through with the wrong dimensions and
     stretched the picture. */
  {
    id: "b-ph-bmx-barn",
    src: bmxYouthPhoto.src,
    width: bmxYouthPhoto.width,
    height: bmxYouthPhoto.height,
    focal: { x: 50, y: 70 },
    tone: "#7d8a86",
    alt: "Barn i BOC-drakt sykler i en sving på BMX-banen mens publikum ser på",
    caption: [text("BMX-løp for barn i Bærum Sykkelpark")],
    nodeId: "b-bmx",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-bmx-air",
    src: bmxPhoto.src,
    width: bmxPhoto.width,
    height: bmxPhoto.height,
    focal: { x: 52, y: 48 },
    tone: "#79969a",
    alt: "BOC-ryttere i gul klubbdrakt under BMX-løp",
    caption: [text("BMX-løp med BOC")],
    nodeId: "b-bmx",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-bmx-berm",
    src: bmxPhoto.src,
    width: bmxPhoto.width,
    height: bmxPhoto.height,
    focal: { x: 52, y: 48 },
    tone: "#79969a",
    alt: "BOC-ryttere i gul klubbdrakt under BMX-løp",
    caption: [text("BMX-løp med BOC")],
    nodeId: "b-bmx-rekrutt",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  /* The club's own velodrome and Zwift illustrations. */
  {
    id: "b-ph-bane",
    src: velodromPhoto.src,
    width: velodromPhoto.width,
    height: velodromPhoto.height,
    focal: { x: 53, y: 58 },
    tone: "#8ca2ae",
    alt: "BOC-ryttere med banesykler samlet til instruksjon inne i Velodromen",
    caption: [text("BOC Meetup i Velodromen")],
    nodeId: "b-bane",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-zwift",
    src: zwiftPhoto.src,
    width: zwiftPhoto.width,
    height: zwiftPhoto.height,
    // The rider sits left of centre and the screen on the right; crops keep the rider.
    focal: { x: 38, y: 50 },
    tone: "#3f7fcf",
    alt: "Rytter i BOC-drakt på sykkelrulle foran en TV med Zwift, i et blått rom",
    caption: [text("Zwift hjemme i stua")],
    nodeId: "b-zwift",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* Jakob's own portrait: the Zwift group's real gruppeleder, uploaded
     directly rather than drawn from Unsplash like the invented volunteers. */
  {
    id: "b-ph-jakob",
    src: jakobPhoto.src,
    width: jakobPhoto.width,
    height: jakobPhoto.height,
    focal: { x: 50, y: 50 },
    tone: "#8a7a6d",
    alt: "Portrett av gruppelederen for Zwift-gruppa",
    nodeId: "b-zwift",
    people: [{ personId: "bp-jakob", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  /* Bane og innendørs */
  shot({
    id: "b-ph-spinning",
    ref: "photo-1520877880798-5ee004e3f11e",
    width: 6000,
    height: 3997,
    tone: "#3c6090",
    photographer: "Trust \"Tru\" Katsande",
    focal: { x: 50, y: 45 },
    alt: "Spinningtime i sal med flere syklister",
    nodeId: "b-innendors",
    caption: "Spinning i Gjønneshallen",
  }),
];

/* ── Training and activities ──────────────────────────────────────────── */

function series({ d, on }: SeedCtx): TrainingSeries[] {
  const from = d(-35);
  const to = d(90);
  const s = (x: Omit<TrainingSeries, "from" | "to"> & Partial<Pick<TrainingSeries, "from" | "to">>): TrainingSeries => ({ from, to, ...x });

  return [
    /* Landevei */
    /* BOC 1–4: Tuesday and Thursday at 17.30 from Bekkestua torg, and the
       Saturday long ride at 10.00 from Kaffebrenneriet in Sandvika, where
       everyone meets and each group rides its own. Every week from April to
       September except July, the club's fellesferie — so each session is
       two series, April–June and August–September, and the week view, the
       club year and the group page all leave July empty. */
    ...["b-boc1", "b-boc2", "b-boc3", "b-boc4"].flatMap((nodeId) =>
      [
        { key: "tir", weekday: 2, title: "Fellestrening", start: "17:30", end: "19:30", venueId: "b-bekkestua" },
        { key: "tor", weekday: 4, title: "Fellestrening", start: "17:30", end: "19:30", venueId: "b-bekkestua" },
        { key: "lor", weekday: 6, title: "Langtur", start: "10:00", end: "13:00", venueId: "b-kaffebrenneriet" },
      ].flatMap((slot) =>
        [
          { part: "var", from: on(4, 1), to: on(6, 30) },
          { part: "host", from: on(8, 1), to: on(9, 30) },
        ].map((period) =>
          s({
            id: `bs-${nodeId.slice(2)}-${slot.key}-${period.part}`,
            nodeId,
            title: slot.title,
            weekday: slot.weekday,
            start: slot.start,
            end: slot.end,
            venueId: slot.venueId,
            from: period.from,
            to: period.to,
            seasonal: true,
            clubYearGroupId: "b-landevei",
            clubYearLabel: "Landevei",
          }),
        ),
      ),
    ),
    s({
      id: "bs-ungdom-tir",
      nodeId: "b-ungdom",
      title: "Intervaller og teknikk",
      weekday: 2,
      start: "18:00",
      end: "19:30",
      venueId: "b-idrettspark",
      note: "Sammen med BSV Triatlon",
    }),
    s({ id: "bs-ungdom-fre", nodeId: "b-ungdom", title: "Langtur", weekday: 5, start: "18:00", end: "20:00", venueId: "b-idrettspark" }),
    s({ id: "bs-junior-tir", nodeId: "b-junior", title: "Intervaller", weekday: 2, start: "18:00", end: "19:30", venueId: "b-idrettspark" }),

    /* Terreng */
    s({
      id: "bs-terrengskolen",
      nodeId: "b-terrengskolen",
      title: "Terrengsykkelskolen",
      weekday: 1,
      start: "17:30",
      end: "18:45",
      venueId: "b-eineasen",
      from: on(3, 1),
      to: on(11, 30),
      seasonal: true,
      clubYearGroupId: "b-terreng",
      clubYearLabel: "Terreng",
      exceptions: [{ date: d(7), note: "Avlyst. Stiene er for våte etter regnet." }],
    }),
    s({ id: "bs-terreng-barn", nodeId: "b-terreng-barn", title: "Terrengtrening", weekday: 3, start: "17:30", end: "19:00", venueId: "b-vestmarka", from: on(3, 1), to: on(11, 30), seasonal: true, clubYearGroupId: "b-terreng", clubYearLabel: "Terreng" }),
    s({ id: "bs-terreng-senior", nodeId: "b-terreng-senior", title: "Stitrening", weekday: 3, start: "18:00", end: "20:00", venueId: "b-kolsas", from: on(3, 1), to: on(11, 30), seasonal: true, clubYearGroupId: "b-terreng", clubYearLabel: "Terreng" }),
    s({ id: "bs-terreng-tur", nodeId: "b-terreng-tur", title: "Turtempo på sti", weekday: 4, start: "18:00", end: "20:00", venueId: "b-vestmarka", from: on(3, 1), to: on(11, 30), seasonal: true, clubYearGroupId: "b-terreng", clubYearLabel: "Terreng" }),

    /* BMX — aldersgrupper med samme tider tirsdag og torsdag */
    ...[
      { id: "gr1", nodeId: "b-bmx-rekrutt", title: "BMX Gruppe 1", start: "18:00", end: "19:00" },
      { id: "gr2", nodeId: "b-bmx-racing", title: "BMX Gruppe 2", start: "18:00", end: "19:15" },
      { id: "gr3", nodeId: "b-bmx-voksen", title: "BMX Gruppe 3", start: "19:00", end: "20:30" },
    ].flatMap((group) =>
      [2, 4].map((weekday) =>
        s({
          id: `bs-bmx-${group.id}-${weekday}`,
          nodeId: group.nodeId,
          title: group.title,
          weekday,
          start: group.start,
          end: group.end,
          venueId: "b-sykkelpark",
          from: on(4, 1),
          to: on(11, 30),
          seasonal: true,
          clubYearGroupId: "b-bmx",
          clubYearLabel: "BMX",
        }),
      ),
    ),

    /* Banesykling og innendørs */
    s({ id: "bs-bane", nodeId: "b-banegruppa", title: "Banetrening", weekday: 1, start: "18:30", end: "20:30", venueId: "b-velodromen", from: on(1, 1), to: on(12, 31, 1), seasonal: true, clubYearGroupId: "b-bane", clubYearLabel: "Banesykling" }),
    s({ id: "bs-spinning-tir", nodeId: "b-spinning", title: "Spinning", weekday: 2, start: "19:00", end: "20:00", venueId: "b-gjonneshallen", from: on(10, 1), to: on(3, 31, 1), seasonal: true, clubYearGroupId: "b-spinning", clubYearLabel: "Spinning" }),
    s({ id: "bs-spinning-tor", nodeId: "b-spinning", title: "Spinning", weekday: 4, start: "19:00", end: "20:00", venueId: "b-gjonneshallen", from: on(10, 1), to: on(3, 31, 1), seasonal: true, clubYearGroupId: "b-spinning", clubYearLabel: "Spinning" }),
    ...[1, 3].map((weekday) =>
      s({
        id: `bs-zwift-${weekday}`,
        nodeId: "b-zwift",
        title: "Zwift: felles intervalløkt",
        weekday,
        start: "19:00",
        end: "20:00",
        locationNote: "Meetup i Zwift",
        note: "«Stay together» er på, så alle holder følge",
        from: on(11, 1),
        to: on(3, 31, 1),
        seasonal: true,
        clubYearGroupId: "b-zwift",
        clubYearLabel: "Zwift",
      }),
    ),
  ];
}

function activities({ d, next, on }: SeedCtx): Activity[] {
  const spond = { kind: "spond" as const, label: "Svar i Spond", url: "https://spond.com" };
  return [
    {
      id: "b-act-km",
      nodeId: "b-sykkel",
      kind: "race",
      title: "Klubbmesterskap tempo",
      date: next(7),
      start: "11:00",
      end: "14:00",
      venueId: "b-idrettspark",
      description: "12 km tempo med start fra idrettsparken. Klasser fra 11 år, påmelding på stedet fra kl. 10.00.",
      status: "scheduled",
    },
    {
      id: "b-act-regionscup",
      nodeId: "b-bmx",
      kind: "race",
      title: "RegionsCup Øst #5 i Bærum Sykkelpark",
      date: d(5),
      start: "10:00",
      end: "16:00",
      venueId: "b-sykkelpark",
      description: "Klubben arrangerer på hjemmebane. Kiosk, speaker og klubbtelt – og dugnadsvakter hele uken før.",
      status: "scheduled",
      signup: spond,
    },
    {
      id: "b-act-karusell",
      nodeId: "b-terreng-senior",
      kind: "race",
      title: "Terrengkarusell, 4. runde",
      date: d(3),
      start: "18:00",
      end: "20:00",
      venueId: "b-vestmarka",
      status: "scheduled",
      signup: spond,
    },
    {
      id: "b-act-foreldremote",
      nodeId: "b-bmx",
      kind: "event",
      title: "Foreldremøte BMX",
      date: d(9),
      start: "18:30",
      end: "19:30",
      venueId: "b-sykkelpark",
      description: "Gjennomgang av høstens løp, dugnad og gruppeinndeling. Alle foresatte er velkomne.",
      status: "scheduled",
    },
    {
      id: "b-act-dugnad",
      nodeId: "b-boc",
      kind: "volunteer",
      title: "Banedugnad i Bærum Sykkelpark",
      date: d(12),
      start: "17:00",
      end: "20:00",
      venueId: "b-sykkelpark",
      description: "Vi rydder, raker og gjør banen klar før løpet. Klubben spanderer pizza.",
      status: "scheduled",
    },
    {
      id: "b-act-temakveld",
      nodeId: "b-boc",
      kind: "event",
      title: "Temakveld: vintervedlikehold av sykkel",
      date: d(21),
      start: "19:00",
      end: "20:30",
      venueId: "b-idrettspark",
      description: "Anton Sport viser vask, kjede og lagring gjennom vinteren. Åpent for alle medlemmer.",
      status: "scheduled",
    },

    /* The season as a whole */
    ...[
      { id: "b-act-mallorca-host", title: "Treningstur til Mallorca, høst", date: on(10, 10), endDate: on(10, 17) },
      { id: "b-act-mallorca-var", title: "Treningstur til Mallorca, vår", date: on(3, 13, 1), endDate: on(3, 20, 1) },
    ].map(
      (trip): Activity => ({
        ...trip,
        nodeId: "b-landevei",
        kind: "camp",
        start: "08:00",
        locationNote: "Mallorca",
        description: "En uke med fellesturer i grupper på flere nivåer. Klubben har rabatterte priser på hotellet, og det er ofte opp mot 50 deltakere.",
        status: "scheduled",
      }),
    ),
    {
      id: "b-act-genus-open",
      nodeId: "b-boc",
      kind: "race",
      title: "GENUS OPEN by BOC",
      date: on(8, 19),
      start: "17:30",
      end: "21:00",
      locationNote: "Bogstad – Sørkedalen – Tryvann",
      description: "Klubbens eget ritt sammen med hovedsamarbeidspartneren, fra Bogstad opp til toppen av slalåmbakken.",
      status: "scheduled",
    },
    {
      id: "b-act-nm-utfor",
      nodeId: "b-downhill",
      kind: "race",
      title: "NM utfor",
      date: on(8, 9),
      endDate: on(8, 10),
      start: "09:00",
      locationNote: "Drammen skisenter",
      description: "To dager i den tekniske NM-løypa, med klubbens ryttere i flere klasser.",
      status: "scheduled",
    },
    {
      id: "b-act-sesongavslutning",
      nodeId: "b-terreng",
      kind: "event",
      title: "Sesongavslutning terreng",
      date: d(26),
      start: "17:00",
      end: "20:00",
      venueId: "b-eineasen",
      description: "Kort treningsøkt, konkurranse i balanse og moro på terrengsløyfa, før grilling og kake.",
      status: "scheduled",
    },

    /* Next season, planned before the turn of the year: this season's Ungdom
       cohort rides as Junior from January, so the camp sits on Junior. */
    {
      id: "b-act-junior-samling",
      nodeId: "b-junior",
      kind: "camp",
      title: "Treningssamling, sesongstart",
      date: on(3, 6, 1),
      endDate: on(3, 8, 1),
      start: "09:00",
      locationNote: "Larvik",
      description: "Første samling for det nye juniorkullet, som denne sesongen sykler i ungdomsgruppa.",
      status: "scheduled",
    },
  ];
}

/* ── Races ────────────────────────────────────────────────────────────────
   The races members ride together, most of them in the turritt or master
   classes. Dates are the organisers' own for the latest edition published
   (checked September 2026 in EQ Timing and on the race sites); the club year
   projects next season's edition from them. Genus Open is the club's own
   race and follows the seeded season like the rest of the club's dates. */

/* The rides BOC 1–4 train towards and enter together. BOC 4 leaves out the
   two longest, Vätternrunden and Randsfjorden Rundt; Styrkeprøven is for
   BOC 2–4 (listed on the race itself). */
const BOC_1_TO_4 = ["b-boc1", "b-boc2", "b-boc3", "b-boc4"];
const BOC_1_TO_3 = ["b-boc1", "b-boc2", "b-boc3"];

function races({ on }: SeedCtx): Race[] {
  const road = (r: Omit<Race, "nodeId">): Race => ({ nodeId: "b-landevei", ...r });
  const mtb = (r: Omit<Race, "nodeId">): Race => ({ nodeId: "b-terreng", ...r });
  return [
    road({ id: "r-enebakk", name: "Enebakk Rundt", date: "2026-05-01", place: "Skullerud – Enebakk", organiser: "IK Hero", groupIds: BOC_1_TO_4 }),
    road({ id: "r-follo", name: "Follorittet", date: "2026-05-10", place: "Ås", organiser: "Follo Sykkelklubb" }),
    road({ id: "r-ceres", name: "Ceresrittet", date: "2026-05-10", place: "Romerike", organiser: "SK Ceres" }),
    road({ id: "r-nordmarka", name: "Nordmarka Rundt", date: "2026-05-24", place: "Årvoll skole, Oslo", groupIds: BOC_1_TO_4 }),
    road({ id: "r-randsfjorden", name: "Randsfjorden Rundt", date: "2026-05-30", place: "Brandbu", groupIds: BOC_1_TO_3 }),
    road({ id: "r-tyrifjorden", name: "Tyrifjorden Rundt", date: "2026-06-07", place: "Sandvika – rundt Tyrifjorden", organiser: "Oslo Klassikerne", groupIds: BOC_1_TO_4 }),
    road({
      id: "r-vattern",
      name: "Vätternrunden",
      date: "2026-06-12",
      endDate: "2026-06-13",
      place: "Motala, rundt Vättern",
      url: "https://www.vatternrundan.se",
      groupIds: BOC_1_TO_3,
    }),
    road({
      id: "r-styrkeproven",
      name: "Styrkeprøven",
      date: "2027-06-18",
      endDate: "2027-06-19",
      place: "Trondheim – Oslo eller Lillehammer – Oslo",
      url: "https://styrkeproven.no",
      groupIds: ["b-boc2", "b-boc3", "b-boc4"],
    }),
    road({ id: "r-oyeren", name: "Øyeren Rundt", date: "2026-08-09", place: "Fjerdingby, Rælingen" }),
    road({ id: "r-genus-open", name: "Genus Open by BOC", date: on(8, 19), place: "Bogstad – Sørkedalen – Tryvann", ownEvent: true }),
    road({ id: "r-2-mila", name: "2-Mila", date: "2026-08-23", place: "Gamle Mossevei", format: "Temporitt", organiser: "IK Hero" }),
    mtb({ id: "r-grenserittet", name: "Grenserittet", date: "2026-08-15", place: "Strömstad – Halden" }),
    mtb({ id: "r-birken", name: "Birkebeinerrittet", date: "2026-08-29", place: "Rena – Lillehammer" }),
  ];
}

/* ── News ─────────────────────────────────────────────────────────────────
   Headlines, dates and bylines are the club's own, from baerumock.no/news.
   The text under each is a short summary written for the prototype, and the
   slug never carries a person's name (see articleSlug in lib/content.ts). */

interface NewsInput {
  id: string;
  slug: string;
  nodeId: string;
  title: string;
  lead: string;
  body: string[];
  author: string;
  date: string;
  photo?: string;
  home?: boolean;
  /** Structured body (headings, lists, links) for a notice that is more than paragraphs. */
  blocks?: Block[];
}

const link = (text: string, href: string): Inline => ({ type: "link", text, href });
const t = text;

/* The partner deal with Anton Sport, as the club sent it to members. */
const ANTON_CLUB_URL = "https://www.antonsport.no/klubbmedlemskap/99900325";
const antonSportBenefits: Block[] = [
  { type: "heading", text: "Slik gjør du det" },
  {
    type: "list",
    ordered: true,
    items: [
      [t("Trykk på denne lenken: "), link("antonsport.no/klubbmedlemskap", ANTON_CLUB_URL), t(".")],
      [t("Er du medlem i Anton Club fra før? Da logger du inn via lenken, og velger ja på spørsmål om du vil legge til klubbavtalen til profilen din.")],
      [t("Er du ikke medlem av Anton Club fra før? Da trykker du på «Bli medlem» via lenken, registrerer deg, og velger ja på spørsmål om du vil legge til klubbavtalen til profilen din.")],
    ],
  },
  para([
    t("Fiks ferdig! Du får nå alltid BOCs medlemsfordeler når du oppgir telefonnummeret ditt i Anton Sports butikker, eller logger inn på profilen din på "),
    link("antonsport.no", "https://www.antonsport.no"),
    t("."),
  ]),
  para([t("Kontaktperson hos Anton Sport Bekkestua som kjenner avtalen med BOC: Mattis Andersen.")]),
  { type: "heading", text: "Medlemsfordeler i Anton Sport" },
  {
    type: "list",
    items: [
      [t("20 % bonus i Anton Club. Gjelder i alle Anton Sport-butikker og på "), link("antonsport.no", "https://www.antonsport.no"), t(".")],
      [t("Egen serviceavtale med fastpris på gull- og sølvservice. Gjelder kun hos Anton Sport Bekkestua og Milslukern.")],
      [t("5 % kickback til klubben: 5 % av alt du handler som medlem går direkte tilbake til BOC.")],
    ],
  },
  { type: "heading", text: "Hva er bonus?" },
  para([
    t("Bonus er noe Anton Sport gir medlemmene tilbake for alle kjøp av varer til ordinær pris. Det fungerer som en slags Anton-penger du kan kjøpe andre varer og tjenester for. Bonusen regnes alltid i kroner: 100 kroner i bonus tilsvarer 100 kroner. Du finner din personlige bonus på alle produktene i nettbutikken, og du kan alltid se hvor mye bonus du har tjent opp på profilen din."),
  ]),
  { type: "heading", text: "Er bonus det samme som rabatt?" },
  para([
    t("Ikke helt. Bonus er litt som å få en tilgodelapp: bonusen du samler opp, kan du bruke som betalingsmiddel på en senere handel, mens rabatt er et fratrekk i prisen når du handler."),
  ]),
  { type: "heading", text: "Serviceavtale" },
  para([
    t("Service på sykkelen kan du få gjort både hos Anton Sport Bekkestua og hos Milslukern. Reserver time her: "),
    link("antonsport.no/bikefolder", "https://www.antonsport.no/bikefolder"),
    t("."),
  ]),
  para([
    t("Hva som inngår i sølv- og gullservice, og vilkårene for avtalen, står i "),
    link("BOCs serviceavtale (PDF)", "https://spond.com/storage/upload/F6EEC0F9DC58AC9102A8E6089F535006/1771887013_3FDE0798/BOC_Service.pdf"),
    t("."),
  ]),
  { type: "heading", text: "Bli med!" },
  para([
    t("Å være medlem i Anton Club gjennom BOC gir fordeler både for deg og for klubben. Ta steget i dag, og vær med på å støtte BOC samtidig som du sparer penger. "),
    link("Bli medlem i Anton Club", ANTON_CLUB_URL),
    t("."),
  ]),
];

export const BOC_BENEFITS_SLUG = "medlemsfordeler-hos-anton-sport";

const NEWS: NewsInput[] = [
  {
    id: "b-a-anton-club",
    slug: BOC_BENEFITS_SLUG,
    nodeId: "b-boc",
    title: "Bli medlem i Anton Club knyttet til BOC",
    lead: "Bli medlem i Anton Club, så skaffer du deg gode fordeler hos vår partner Anton Sport samtidig som du støtter BOC.",
    body: [],
    blocks: antonSportBenefits,
    author: "bu-christian",
    date: "2026-02-24",
  },
  {
    id: "b-a-utfor-nc",
    slug: "topplassering-i-norgescupen-i-utfor",
    nodeId: "b-downhill",
    title: "Topplasseringer på BOCs Ulrik Gerner",
    lead: "Klubbens utforrytter vant runde 2 av Norgescupen på Trysil i klassen M Senior.",
    body: [
      "Vinnertiden ble 3.34 i en løype der de fleste tapte tid i de tekniske partiene øverst.",
      "Resultatet følger opp en solid plassering i årets NM, og lover godt for utformiljøet i klubben.",
    ],
    author: "bu-anders",
    date: "2026-09-01",
    photo: "b-ph-downhill",
    home: true,
  },
  {
    id: "b-a-nm-bmx",
    slug: "seks-pallplasser-i-nm-bmx",
    nodeId: "b-bmx",
    title: "Fine prestasjoner fra BOC BMX under NM",
    lead: "Klubben stilte med en liten tropp på Klepp, og kjørte inn til seks pallplasser og ett NM-gull.",
    body: [
      "I Boys 14 tok klubben både gull og bronse i samme klasse, og flere av de yngste rytterne kjørte sine første NM-heat.",
      "Trenerne trekker fram at hele troppen forbedret startene sine gjennom helgen.",
    ],
    author: "bu-thelia",
    date: "2026-06-20",
    photo: "b-ph-bmx-air",
    home: true,
  },
  {
    id: "b-a-aremark",
    slug: "sterk-helg-i-aremark-og-rade",
    nodeId: "b-bmx",
    title: "Sterk helg for BMX gruppen – topp innsats i Aremark og Råde",
    lead: "RegionsCup i Aremark lørdag og regionsmesterskap i Råde søndag ga mange pallplasser.",
    body: [
      "Klubben stilte med bred tropp begge dager, og flere ryttere kjørte seg til finale i sine klasser.",
      "Foresatte stilte som funksjonærer i depot og på kiosk gjennom helgen.",
    ],
    author: "bu-thelia",
    date: "2026-06-07",
    photo: "b-ph-landevei-group",
  },
  {
    id: "b-a-bruksmarked",
    slug: "bmx-bruksmarked-under-treningen",
    nodeId: "b-bmx",
    title: "BMX Mini Bruksmarked torsdag 21.mai",
    lead: "Ta med utstyr og klær du vil selge eller bytte, så rigger vi opp fra kl. 18.30.",
    body: [
      "Markedet holder til ved klubbhuset mens treningen pågår. Foresatte hjelper til med rigging og salg.",
      "Har du utstyr barna har vokst fra, er dette en enkel måte å sende det videre i klubben.",
    ],
    author: "bu-thelia",
    date: "2026-05-20",
  },
  {
    id: "b-a-rekruttsykling",
    slug: "rekruttsykling-bmx-6-mai",
    nodeId: "b-bmx-rekrutt",
    title: "Rekruttsykling BMX 6.mai kl 18.00",
    lead: "Åpen økt for alle som vil prøve BMX, uansett nivå og alder.",
    body: [
      "Trenerne tar imot på banen og deler inn i grupper. Klubben låner ut hjelm og beskyttelse til dem som trenger det.",
      "Møt opp i god tid, så rekker vi en runde på banen før økten starter.",
    ],
    author: "bu-thelia",
    date: "2026-05-06",
    photo: "b-ph-bmx-berm",
  },
  {
    id: "b-a-sesongapning-bmx",
    slug: "sesongapning-for-bmx-lop",
    nodeId: "b-bmx",
    title: "Sesongåpning for BMX‑løp",
    lead: "Elleve ryttere fra klubben var på startstreken i sesongens første løp i Region Øst.",
    body: [
      "De yngste klassene kjørte sine første løp for året, og klubben hadde ryttere i finale i flere aldersklasser.",
      "Arrangementet ble gjennomført i fint vær og med god stemning i depot.",
    ],
    author: "bu-thelia",
    date: "2026-04-20",
  },
  {
    id: "b-a-lokale-lop",
    slug: "lokale-bmx-lop-2026",
    nodeId: "b-bmx",
    title: "Lokale BMX løp 2026",
    lead: "Oversikt over løpene i regionen gjennom sesongen, fra Gresshoppa i april til halloweenløpet i november.",
    body: [
      "Alle løp til og med 12 år er barneleker, uten rangering. Klubben stiller med telt, kiosk og lagleder på de fleste løpene.",
      "Invitasjon og påmelding legges ut i Spond i forkant av hvert løp.",
    ],
    author: "bu-thelia",
    date: "2026-04-18",
    home: true,
  },
  {
    id: "b-a-foreldremote-bmx",
    slug: "bmx-foreldremote-14-april",
    nodeId: "b-bmx",
    title: "BMX Foreldremøte 14.april kl 18.30",
    lead: "Foreldremøte på klubbhuset om sesongen, dugnad og gruppeinndeling.",
    body: ["Vi går gjennom treningstider, løpskalender og hvilke oppgaver klubben trenger hjelp til gjennom sesongen."],
    author: "bu-thelia",
    date: "2026-04-14",
  },
  {
    id: "b-a-sesongstart-terreng",
    slug: "sesongstart-terreng",
    nodeId: "b-terreng",
    title: "Sesongstart Terreng",
    lead: "Treningene starter opp igjen mandag 13. april, og hele vårens økter ligger i Spond.",
    body: [
      "Oppmøtested varierer mellom gruppene, og noen økter er ikke låst ennå. Følg med i Spond for detaljer.",
      "Det kommer flere arrangementer utover våren: spesialtreninger, turer og mekkekveld på klubbhuset.",
    ],
    author: "bu-anders",
    date: "2026-04-08",
    photo: "b-ph-downhill",
    home: true,
  },
  {
    id: "b-a-sesongstart-bmx",
    slug: "sesongstart-2026-bmx",
    nodeId: "b-bmx",
    title: "Sesongstart 2026 – BMX",
    lead: "Datoene før oppstart: banedugnad, klubbhusdugnad, påsketreff, treningsstart og foreldremøte.",
    body: [
      "Treningene starter 9. april, etter to dugnadskvelder på bane og klubbhus i slutten av mars.",
      "Treningstider og gruppeinndeling publiseres fortløpende. Nye og gamle medlemmer er like velkomne.",
    ],
    author: "bu-thelia",
    date: "2026-03-21",
  },
  {
    id: "b-a-anton-sport",
    slug: "ny-samarbeidspartner-anton-sport",
    nodeId: "b-boc",
    title: "Ny samarbeidspartner",
    lead: "Anton Sport overtar som klubbens partner på utstyr og verksted.",
    body: [
      "Den forrige avtalen tok slutt da samarbeidspartneren valgte å trappe ned på sykkel.",
      "Den nye avtalen gir medlemmene fordelaktige priser på utstyr og tilgang til verksted med erfarne mekanikere.",
    ],
    author: "bu-christian",
    date: "2026-02-24",
    photo: "b-ph-bmx-berm",
  },
  {
    id: "b-a-klubbtoy",
    slug: "klubbtoy-med-tidlig-leveranse",
    nodeId: "b-boc",
    title: "Klubbtøy for tidlig leveranse i 2026",
    lead: "Kalas har åpnet et nytt bestillingsvindu, med levering i god tid før sesongen.",
    body: [
      "Bestillingsvinduet er åpent til og med 4. januar, med estimert forsendelse i begynnelsen av mars.",
      "Trenger du nytt tøy til klubbturen til Mallorca, er dette sjansen.",
    ],
    author: "bu-christian",
    date: "2025-12-15",
    photo: "b-ph-landevei-group",
  },
  {
    id: "b-a-spinning",
    slug: "spinning-i-gjonneshallen-for-alle",
    nodeId: "b-spinning",
    title: "BOC Spinning - tilbud for alle!",
    lead: "Spinningtimene i Gjønneshallen er i gang igjen, med instruktører fra klubben.",
    body: [
      "Det er økter både tirsdag og torsdag gjennom vinteren, og timene er åpne for alle medlemmer.",
      "Utesesongen er på hell, og spinning er en enkel måte å holde beina i gang til våren.",
    ],
    author: "bu-christian",
    date: "2025-10-21",
    photo: "b-ph-spinning",
    home: true,
  },
  {
    id: "b-a-regionscup-hjemme",
    slug: "regionscup-pa-hjemmebane",
    nodeId: "b-bmx",
    title: "BMX-helg med full fart: RegionsCup #3 og #4 hos BOC og Moss!",
    lead: "122 ryttere til start i Bærum Sykkelpark, og rundt 350 personer innom anlegget gjennom dagen.",
    body: [
      "Klubben arrangerte RegionsCup Øst #3 på hjemmebane, med kiosk, klubbtelt og speaker på plass.",
      "Dagen etter fortsatte helgen med løp i Moss. En stor takk til alle frivillige som sto på hele uken i forkant.",
    ],
    author: "bu-thelia",
    date: "2025-10-11",
    photo: "b-ph-bmx-air",
  },
  {
    id: "b-a-avslutning-terreng",
    slug: "sesongavslutning-terreng-2025",
    nodeId: "b-terreng",
    title: "Sesongavslutning Terreng",
    lead: "Sesongen ble rundet av på Eineåsen med kort økt, konkurranser og grilling.",
    body: [
      "Terrenggruppene har hatt høyt aktivitetsnivå gjennom hele sesongen, med turer, spesialtreninger og ritt.",
      "Selv om de faste ettermiddagstreningene er over, fortsetter turer og økter gjennom vinteren.",
    ],
    author: "bu-anders",
    date: "2025-10-09",
    photo: "b-ph-terreng-berm",
  },
  {
    id: "b-a-genus-open",
    slug: "genus-open-by-boc-2025",
    nodeId: "b-boc",
    title: "OSLO's RÅESTE - GENUS OPEN by BOC - 2025",
    lead: "Klubbens eget ritt ble arrangert for sjuende gang, fra Bogstad gjennom Sørkedalen og opp til Tryvann.",
    body: [
      "Løypa går fra Bogstad badeplass inn til vendepunktet i Sørkedalen, før den siste stigningen på grusvei opp til toppen av slalåmbakken.",
      "Rittet arrangeres sammen med klubbens hovedsamarbeidspartner, og det ble kåret vinnere i flere klasser.",
    ],
    author: "bu-christian",
    date: "2025-08-21",
    photo: "b-ph-landevei-coast",
  },
  {
    id: "b-a-nm-utfor",
    slug: "pallplasser-i-nm-i-utforsykling",
    nodeId: "b-downhill",
    title: "Unge talenter fra Bærum på toppen av pallen i Norgesmesterskapet i utforsykling",
    lead: "To av klubbens unge ryttere kjørte seg til pallplass i den tekniske NM-løypa i Drammen.",
    body: [
      "Løypa bød på smale partier, store hopp og vanskelige steinseksjoner, og krevde like mye hode som fart.",
      "Resultatene viser at utformiljøet i klubben har vokst seg sterkt de siste sesongene.",
    ],
    author: "bu-christian",
    date: "2025-08-17",
    photo: "b-ph-downhill",
  },
  {
    id: "b-a-sommersesong-bmx",
    slug: "sterk-sommersesong-for-bmx",
    nodeId: "b-bmx",
    title: "Sterk sommersesong for BOC BMX – 3 store løp med imponerende innsats",
    lead: "NM i Moss, EuropaCup i Ängelholm og VM i København på rad og rekke.",
    body: [
      "Klubbens ryttere har levert både nasjonalt og internasjonalt gjennom sommeren.",
      "Oppsummeringene fra hvert av de tre løpene ligger som egne saker her på nyhetssidene.",
    ],
    author: "bu-thelia",
    date: "2025-08-10",
    photo: "b-ph-landevei-group",
  },
  {
    id: "b-a-vm-bmx",
    slug: "vm-bmx-i-kobenhavn",
    nodeId: "b-bmx",
    title: "Verdensmesterskap BMX – København, 28. juli–2. august: flere i 16-delsfinale!",
    lead: "Klubben stilte med sju ryttere i Challenge-klassen, og flere tok seg videre fra innledende heat.",
    body: [
      "Mesterskapet gikk over fire dager for Challenge-utøverne, med 56 norske ryttere til start totalt.",
      "For flere av klubbens ryttere var dette det første internasjonale mesterskapet.",
    ],
    author: "bu-thelia",
    date: "2025-08-09",
    photo: "b-ph-bmx-air",
  },
  {
    id: "b-a-europacup",
    slug: "europacup-i-angelholm",
    nodeId: "b-bmx",
    title: "EuropaCup #9 og #10 – Ängelholm, Sverige: Kurt tar seier i Cruiser 45+!",
    lead: "Over 800 ryttere fra hele Europa, og seier til klubben i Cruiser 45+.",
    body: [
      "Løpene gikk på en moderne bane med både fem og åtte meters startrampe og krevende pro-seksjoner.",
      "Flere av klubbens unge ryttere fikk verdifull erfaring i sterke felt.",
    ],
    author: "bu-thelia",
    date: "2025-08-08",
    photo: "b-ph-bmx-berm",
  },
];

const articles = (): Article[] =>
  NEWS.map((n) => ({
    id: n.id,
    slug: n.slug,
    nodeId: n.nodeId,
    title: [text(n.title)],
    lead: [text(n.lead)],
    blocks: n.blocks ?? n.body.map((p) => para([text(p)])),
    heroPhotoId: n.photo,
    status: "published" as const,
    authorUserId: n.author,
    createdAt: `${n.date}T08:30`,
    publishedAt: `${n.date}T09:00`,
    onHomepage: !!n.home,
  }));

export function bocSeed(ctx: SeedCtx): Db {
  return {
    version: 1,
    seededOn: ctx.today,
    club: club(),
    themes: themeSeed(),
    nodes: nodes(ctx),
    venues: venues(),
    people: people(ctx),
    users: users(),
    photos: photos(),
    articles: articles(),
    series: series(ctx),
    activities: activities(ctx),
    races: races(ctx),
    privacyRequests: [],
    audit: [],
  };
}
