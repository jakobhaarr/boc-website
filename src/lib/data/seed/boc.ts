import bmxPhoto from "@/components/assets/bmx.jpg";
import bmxYouthPhoto from "@/components/assets/bmx-barn.jpg";
import bmxNorgescupPhoto from "@/components/assets/bmx-norgescup-2026.jpeg";
import ulrikGernerPhoto from "@/components/assets/ulrik-gerner.avif";
import demoCamillaPhoto from "@/components/assets/camilla-37.png";
import joinPhoto from "@/components/assets/join-club-component-placeholder.png";
import demoRebekkaPhoto from "@/components/assets/rebekka-19.png";
import demoRobinPhoto from "@/components/assets/robil-36.png";
import demoSanderPhoto from "@/components/assets/sander-12.png";
import demoSiljePhoto from "@/components/assets/silje-34.png";
import demoTrondPhoto from "@/components/assets/trond-58.png";
import kitsPhoto from "@/components/assets/boc-kits.png";
import jerseyBlack from "@/components/assets/boc-jersey-black-cutout.png";
import jerseyYellow from "@/components/assets/boc-jersey-yellow-cutout.png";
import boc2Photo from "@/components/assets/boc2.jpg";
import boc3Photo from "@/components/assets/boc3.jpg";
import boc4Photo from "@/components/assets/boc4.jpg";
import styrkeprovenNarrow from "@/components/assets/boc1-styrkeproven.jpg";
import styrkeprovenHero from "@/components/assets/boc1-styrkeproven-wide.jpg";
import heroMobilePhoto from "@/components/assets/hero-mobile.png";
import heroMobileDarkPhoto from "@/components/assets/hero-mobile-darkmode.png";
import heroWideDarkPhoto from "@/components/assets/hero-wide-darkmode.png";
import zwiftPhoto from "@/components/assets/boc-zwift-hero.png";
import companionMenu from "@/components/assets/zwift/companion-1-meny.png";
import companionSearch from "@/components/assets/zwift/companion-2-sok.png";
import companionMeetups from "@/components/assets/zwift/companion-3-meetups.png";
import companionAccept from "@/components/assets/zwift/companion-4-godta.png";
import terrengPhoto from "@/components/assets/terreng.jpeg";
import velodromPhoto from "@/components/assets/velodrom-meetup.jpg";
import jakobPhoto from "@/components/assets/jakob.jpg";
import erikSchmidtPhoto from "@/components/assets/Erik-Schmidt.png";
import reidarKveinePhoto from "@/components/assets/Reidar-Kveine.png";
import trondVidarThomsonPhoto from "@/components/assets/Trond-Vidar-Thomson.jpg";
import estenOversjoenPhoto from "@/components/assets/esten-oversjoen.png";
import steinArneLiePhoto from "@/components/assets/stein-arne-lie.jpg";
import christianPhoto from "@/components/assets/Christian-udø-Adriaenssens.png";
import { m, para, text } from "@/lib/rich-text";
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
    "Kursdatoer, kapasitet og medlemspris publiseres i BOC Velodrom-gruppen i Spond. Eystein Westgaard er baneansvarlig og en av klubbens instruktører, og medlemstilbud har inkludert sykkel, hjelm og eventuelle sko i egenandelen.",
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
  founded: 1968,
  /* The club's own account of its history, as it wrote it. */
  history: {
    headline: "Fra ABC-klubben til eget anlegg.",
    headlineMuted: "{år} med sykling i Bærum og omegn.",
    since: 1968,
    paragraphs: [
      "Klubben ble etablert i 1968 som Asker og Bærum Cykleklubb, ABC-klubben. Fordi et idrettslag ikke kunne være registrert i to kommuner, ble navnet endret til Bærum og Omegn Cykleklubb i 1969.",
      "Klubben har leid lokaler en rekke steder i Bærum, og har hatt planer om å bygge eget klubbhus helt siden 1980-tallet. I 2013 kunne klubben etablere seg i «eget» klubbhus, og i 2017 inngikk klubben en leiekontrakt med Bærum kommune om å leie dagens klubbhus i 35 år. De leide lokalene er siden utviklet til et anlegg som svært få sykkelklubber har i dag.",
      "På få år har klubben fått egen spinningsal på Gjønnes med 28 sykler, bygget terrengløype, BMX-bane og pumptrack, og renovert klubbhuset. Styrkerommet og mekkerommet er tatt i bruk, og det har vært arrangert flere mekkekvelder.",
      "Med eget klubbhus for alle medlemmene står klubben godt rustet til å utvikle ledere, trenere og syklister, og til fortsatt å være Norges største og beste sykkelklubb.",
    ],
    milestones: [
      { year: 1968, text: "Etablert som Asker og Bærum Cykleklubb (ABC-klubben)" },
      { year: 1969, text: "Nytt navn: Bærum og Omegn Cykleklubb" },
      { year: 2013, text: "Klubben etablerer seg i «eget» klubbhus" },
      { year: 2016, text: "Terrengløypa bygges" },
      { year: 2017, text: "35 års leiekontrakt på klubbhuset med Bærum kommune, og ny BMX-bane" },
      { year: 2019, text: "Pumptrack" },
      { year: 2021, text: "Klubbhuset renoveres" },
    ],
  },
  /* Placeholders until members give their own words: the quotes are written
     for the prototype and belong to invented demo riders, from a BMX kid to
     the Zwift group. Six portraits are illustrations supplied by the site
     owner, riders in club kit who are not club members; Magnus's is a stock
     photograph from Unsplash. The page tags every one «Eksempel». Replace
     each with a real member's quote and portrait, given with their consent,
     and drop `example`. */
  testimonials: [
    {
      personId: "bp-demo-silje",
      shade: "light",
      articleSlug: "medlem-silje-boc1",
      quote: "Jeg kom fra løping og trodde BOC 1 var for proffe for meg. Nå er drag og rulling på tirsdagene høydepunktet i uka.",
      example: true,
    },
    {
      personId: "bp-demo-trond",
      shade: "dark",
      articleSlug: "medlem-trond-boc3",
      quote: "Jeg trodde landevei i gruppe var for unge og raske. I BOC 3 er farten akkurat passe, og praten går hele veien.",
      example: true,
    },
    {
      personId: "bp-demo-rebekka",
      shade: "dark",
      articleSlug: "medlem-rebekka-junior",
      quote: "Juniorgruppa ga meg både treningskompiser og mitt første ritt. Det hadde jeg aldri turt å stille på alene.",
      example: true,
    },
    {
      personId: "bp-demo-sander",
      shade: "dark",
      articleSlug: "medlem-sander-bmx",
      quote: "Det beste er startgrinda. Når den faller, er det bare å tråkke så hardt du kan. Og etter treningen får vi is.",
      example: true,
    },
    {
      personId: "bp-demo-robin",
      shade: "light",
      articleSlug: "medlem-robin-zwift",
      quote: "Zwift om vinteren gjør at jeg holder formen uten å sykle alene. Med «Stay together» kommer vi i mål som en gruppe.",
      example: true,
    },
    {
      personId: "bp-demo-magnus",
      shade: "dark",
      articleSlug: "medlem-magnus-downhill",
      quote: "Jeg lærte å kjøre bratt sammen med folk som var litt bedre enn meg. Nå er det jeg som viser de nye linjene på Kolsås.",
      example: true,
    },
    {
      personId: "bp-demo-camilla",
      shade: "light",
      articleSlug: "medlem-camilla-boc4",
      notInDeck: true,
      quote: "BOC 4 var perfekt da jeg var ny på landevei. Vi holder rolig tempo, stopper for kaffe, og ingen sykler alene hjem.",
      example: true,
    },
  ],
  // «Bærum og Omegn Cykleklubb (BOC)» on Strava, club 1026.
  stravaClubUrl: "https://www.strava.com/clubs/1026",
  orgNumber: "984 061 501",
  email: "post@baerumock.no",
  phone: "67 54 22 10",
  address: { street: "Klubbhuset, Bærum Idrettspark", postalCode: "1351", city: "Rud" },
  about:
    "Bærum og Omegn Cykleklubb er en sykkelklubb med fem disipliner: landevei, terreng, BMX, banesykling og innendørs. Klubben drives av frivillige, og har tilbud fra sykkelskole for de yngste til ritt på nasjonalt nivå.",
  heroPhotoId: "b-ph-hero",
  youthPhotoId: "b-ph-bmx-barn",
  joinPhotoId: "b-ph-join",
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
      "Fire landeveisgrupper for voksne, og egne grupper for barn og ungdom fra 5 til 17 år. Om vinteren flytter vi inn på spinning og Zwift, og i Velodromen sykler vi hele året.",
    reach: { value: "Alle nivåer", label: "nybegynner til elitesyklist" },
    newsKinds: "Referater, beskjeder og historier",
    aboutHeadline: "Bærum og Omegn Cykleklubb er en av landets største sykkelklubber, etablert i 1968.",
    aboutMuted: "Alt arbeid gjøres av frivillige, og alle er velkomne til å møte opp på en trening, uansett alder.",
    /* Written as an argument, not a description: the section has to say what
       a membership buys that turning up to a free group ride does not. */
    year: {
      headline: "Sykling er bedre sammen.",
      headlineMuted: "Å kjøre ritt i samme drakt og reise bort sammen krever en klubb.",
      note: "De fleste av oss kjører turritt- eller masterklassen, så du trenger ikke være rask for å stille. Ritt og Mallorca-turer er for medlemmer; påmelding til ritt skjer hos arrangøren.",
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
    /* The 2026 rates, from the papers for the annual meeting of 11 March
       2026 (sak 11). The meeting also set the 2027 rates, named in the note. */
    rates: [
      { label: "Hovedmedlem", amount: 600, hint: "17–66 år" },
      { label: "Ungdom", amount: 350, hint: "Til og med 16 år", children: true },
      { label: "Honnør", amount: 300, hint: "Fra 67 år" },
      { label: "Støttemedlem", amount: 300, minor: true },
      { label: "Rekrutt, 3 måneder", amount: 50, hint: "Gir ikke lisens", minor: true },
    ],
    note: "Familiemedlemmer på samme adresse og med samme betaler får 40 % rabatt, og Spond Club legger på et administrasjonsgebyr. Treningsavgift kommer i tillegg der gruppa har det. Fra 2027 er kontingenten 700 kr for hovedmedlem, 400 kr for ungdom og 350 kr for honnør og støttemedlem.",
    requiredFor: "Du må være medlem for å melde deg på ritt og bli med på Mallorca-turene.",
  },
  signupUrl: SPOND_SIGNUP,
  grasrotandelenOrgNumber: "984061501",
  footerLinks: [
    { label: "Medlemsfordeler", href: `/nyheter/${BOC_BENEFITS_SLUG}` },
    { label: "Styret", href: "/styret" },
  ],
  kit: {
    headline: "Sykle i klubbdrakten.",
    headlineMuted: "Fra Kalas, i race- og fritidsdesign.",
    text: [
      "Klubbdraktene produseres av Kalas og selges i perioder. Når Kalas åpner klubbutikken for et nytt drop, får du beskjed i Spond om når den åpner og hvor lenge den er åpen.",
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
    preposition: "ved",
    name: "Kaffebrenneriet",
    area: "Sandvika",
    surface: "Oppmøtested",
    mapQuery: "Kaffebrenneriet Sandvika",
    note: "Søndagens oppmøte for BOC 1–4. Gruppene samles her og sykler hver for seg.",
  },
  {
    id: "b-sykkelpark",
    preposition: "i",
    name: "Bærum Sykkelpark",
    area: "Bryn",
    surface: "BMX-bane med 5 meters startrampe",
    address: "Gamle Lommedalsvei 99, 1348 Rykkinn",
    mapQuery: "Gamle Lommedalsvei 99, Bærum",
    note: "Ved Bryn skole. Helhjelm, langermet trøye og bukse er påbudt på trening.",
  },
  {
    id: "b-gjonneshallen",
    preposition: "i",
    name: "Gjønneshallen",
    area: "Bekkestua",
    surface: "Spinningsal",
    mapQuery: "Gjønneshallen, Bærum",
    note: "Ta med håndkle og drikke. Klubben har sykler i salen.",
  },
  {
    id: "b-velodromen",
    preposition: "i",
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
    preposition: "i",
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
      /* From the sport's joinInfo: open sessions, and what membership is for.
         Groups with their own terms (BMX, bane, spinning) set their own. */
      firstTraining: {
        trial: "Alle kan møte opp på en trening, uansett alder, uten å være medlem. Du må være medlem for å kjøre ritt og bli med på Mallorca-turene.",
      },
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
        "Alle kan møte opp på en trening, uansett alder. Du trenger sykkel og godkjent hjelm. For ritt og Mallorca-turene må du være medlem, og innmelding skjer i Spond.",
      breaks: [
        { label: "Fellesferie, ingen organiserte treninger", from: on(7, 6), to: on(7, 26) },
        { label: "Innesesong: spinning, Zwift og styrke", from: on(11, 2), to: on(3, 15, 1) },
      ],
    }),

    /* ── Landevei ───────────────────────────────────────────────────────── */
    node({
      id: "b-landevei",
      /* The venue notes say changes come from the Road Captain in Spond. */
      firstTraining: {
        signUp: "Øktene ligger i Spond-gruppa for Landevei, der du kan melde deg på. Møtes gruppa et annet sted, sier Road Captain fra i Spond.",
        bring: "Landeveissykkel og godkjent hjelm.",
      },
      levelOptions: {
        ny: { label: "Ny på landevei eller i gruppe", hint: "Du har lite erfaring med å sykle i felt sammen med andre" },
        litt: { label: "Sykler jevnlig, men lite i gruppe", hint: "Du tar lengre turer på egen hånd og vil lære å sykle i felt" },
        aktiv: { label: "Vant til å sykle i gruppe", hint: "Du trener jevnlig, sykler i rulle og holder over 30 km/t på flatene" },
      },
      parentId: "b-sykkel",
      kind: "discipline",
      name: "Landevei",
      slug: "landevei",
      // Through the winter the road riders train on Zwift; the season sits in every Landevei terminliste.
      seasonsInTerminliste: ["b-zwift"],
      leadTitle: "Road Captain",
      ridingRules: [
        {
          title: "Maks to i bredden",
          icon: "side-by-side",
          text: "I vanlig fart sykler vi maks to i bredden. I lange stigninger på smal vei legger vi oss på én rekke, eller tar sykkelveien der det finnes en.",
        },
        { title: "Ingen «half-wheeling»", icon: "level", text: "Ligg side om side med den ved siden av deg. Et halvt hjul foran presser opp farten og splitter gruppa." },
        { title: "Følg trafikkreglene", icon: "traffic", text: "Vi følger trafikkreglene også når vi sykler i gruppe." },
        { title: "Hjelm og lys", icon: "light", text: "Hjelm er påbudt på alle fellestreninger. Fra solnedgang til soloppgang skal du også ha lys foran og bak." },
        { title: "Spytt og snyt bakerst", icon: "spit", text: "Ingen spytting eller snyting, med mindre du ligger bakerst i gruppa." },
        { title: "Vis hull og sprekker", icon: "hazard", text: "Pek ut hull, sprekker og andre hindringer, og kjør rolig og forutsigbart, så syklisten bak deg kan følge." },
        { title: "Varsle stopp i god tid", icon: "stop", text: "Gi tegn i god tid før du bremser ned eller stopper." },
        { title: "Ingen blir igjen", icon: "wait", text: "Vi stopper alltid ved punkteringer og tekniske problemer, og vi forlater ingen før vi vet at de kommer seg hjem." },
      ],
      summary: "Fire fellesgrupper etter fart, og egen avdeling for barn og ungdom.",
      description:
        [
          "Fellestreningene går i fartsgrupper, så alle holder sammen. Hver gruppe har en Road Captain, og vi følger klubbens regler for gruppekjøring, som står lenger ned på siden.",
          "Fra april til september trener BOC 1–4 tirsdag og torsdag kl. 18.00 fra Bekkestua torg, og søndag kl. 10.00 er det langtur fra Kaffebrenneriet i Sandvika, der gruppene samles og sykler hver for seg. I juli er det fellesferie.",
          "Rundt mars og oktober reiser klubben en uke til Mallorca: rabattert hotell, ofte opp mot 50 deltakere og grupper på flere nivåer.",
        ].join("\n\n"),
      coverPhotoId: "b-ph-landevei-hero",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet", "b-idrettspark"],
      joinGroup: { kind: "spond", label: "Bli med i Landevei i Spond", url: "https://spond.com/invite/SKUOD" },
      joinInfo:
        "Bli med i Spond-gruppa for Landevei, så ser du øktene og kan melde deg på. Du trenger landeveissykkel og godkjent hjelm.",
    }),
    node({
      id: "b-boc1",
      firstTraining: { pace: "33–37 km/t" },
      parentId: "b-landevei",
      kind: "team",
      name: "BOC 1",
      slug: "boc-1",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "Raskeste fellesgruppe, 33–37 km/t. Intervaller tirsdag, BOC Tivoli torsdag og lagsykling søndag.",
      description: "For deg som er vant til å sykle i felt og tåler høy fart over tid. Tirsdag er det intervaller på FTP og VO2max, torsdag BOC Tivoli med korte, harde intervaller, og søndag lagsykling med tempoturer eller langturer. Målet for 2026 er et lag som sykler smart i ritt, med makkerpar som drar sammen.",
      seasonFocus: "Vätternrunden",
      coverPhotoId: "b-ph-boc-fast-hero",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet"],
      externalLinks: spond("BOC 1 i Spond"),
    }),
    node({
      id: "b-boc2",
      firstTraining: { pace: "30–33 km/t" },
      parentId: "b-landevei",
      kind: "team",
      name: "BOC 2",
      slug: "boc-2",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "30–33 km/t. Tirsdag og torsdag, og langtur søndag.",
      coverPhotoId: "b-ph-boc2",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet"],
      description: "Bakkeintervaller, lagtempo og rulle, på begge sider av fjorden. Målet for 2026 er Vätternrunden med over 37 km/t i snitt, med Enebakk Rundt og Randsfjorden Rundt som oppkjøring.",
      seasonFocus: "Vätternrunden",
      externalLinks: spond("BOC 2 i Spond"),
    }),
    node({
      id: "b-boc3",
      firstTraining: { pace: "27–30 km/t" },
      parentId: "b-landevei",
      kind: "team",
      /* BOC T-O, the team for Trondheim–Oslo, rides at BOC 3's level and
         trains with it, so the site shows them as one group rather than
         two offers competing for the same riders. */
      name: "BOC 3 / BOC T-O",
      slug: "boc-3",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "27–30 km/t. Tirsdag og torsdag, og langtur søndag. En del av gruppa sykler mot Trondheim–Oslo.",
      description:
        "En stabil gjeng erfarne ryttere med god tone. En del av gruppa har Styrkeprøven fra Trondheim til Oslo som mål og trener ekstra på rulle, i lange perioder låst, og på lange søndagsturer i rolig tempo. Enebakk Rundt og Randsfjorden Rundt kjører vi sammen.",
      coverPhotoId: "b-ph-boc3",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet"],
    }),
    node({
      id: "b-boc4",
      firstTraining: {
        pace: "24–27 km/t, rolig tempo",
        bring: "Landeveissykkel, hjelm og noe å drikke.",
        keepUp: "Ingen blir sykla av, og ingen sykler alene hjem.",
      },
      parentId: "b-landevei",
      kind: "team",
      name: "BOC 4",
      slug: "boc-4",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "24–27 km/t, rolig tempo og ingen som blir sykla av. Tirsdag og torsdag, og langtur søndag.",
      description: "Klubbens innstegsgruppe, for deg som er ny på landevei eller vil sykle sosialt, og for erfarne som er fornøyd med moderat fart. Vi legger særlig til rette for at kvinner skal kunne sykle med oss, og vi starter sesongen med rulleopplæring. Vi stopper for kaffe, og ingen sykler alene hjem.",
      joinInfo: "Møt opp på Bekkestua torg en tirsdag eller torsdag kl. 18.00, eller på søndagsturen fra Sandvika, og sjekk Spond for endringer. Du trenger landeveissykkel, hjelm og noe å drikke.",
      coverPhotoId: "b-ph-boc4",
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
        "Ungdomsgruppa drives sammen med BSV Triatlon i Bærumsvømmerne: BOC-ungdom fra 13 til 23 år kan bli med på deres intervalløkter, teknikk og langturer, og står i treningsgruppa deres i Spond. Om vinteren er det innendørs sykling på Gnist Gjettum og løping og styrke i idrettsparken.",
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
      firstTraining: { bring: "Sykkel og godkjent hjelm." },
      levelOptions: {
        ny: { label: "Ny på sti", hint: "Du har syklet lite i terrenget" },
        litt: { label: "Sykler grusvei og enkle stier", hint: "Du har syklet en del, men lite på teknisk sti" },
        aktiv: { label: "Vant til teknisk sti", hint: "Du sykler røtter, stein og bratte partier, og trener jevnlig" },
      },
      parentId: "b-sykkel",
      kind: "discipline",
      name: "Terreng",
      slug: "terreng",
      summary: "Barn, unge, turgruppe, seniorgruppe og downhill.",
      description:
        "Terrenggruppene sykler på stiene i Vestmarka, på Eineåsen og rundt Kolsås. Vi legger vekt på teknikk og trygg kjøring før fart, og arrangerer spesialtreninger og turer gjennom sesongen. Siste uke før skolestart holder vi Terrengsykkelskolen for 9–13 år, med klubbens egne ungdommer som instruktører.",
      coverPhotoId: "b-ph-terreng",
      venueIds: ["b-eineasen", "b-vestmarka", "b-kolsas"],
    }),
    node({
      id: "b-terrengskolen",
      firstTraining: { bring: "Sykkel og hjelm. Hjelm er påbudt, og klubben låner ut sykkel til dem som trenger det." },
      parentId: "b-terreng",
      kind: "team",
      name: "Terreng Barn",
      slug: "terreng-barn",
      ageLabel: "6–10 år",
      ageRange: [6, 10],
      summary: "Mestring og sykkelglede på sti. Mandager på Eineåsen.",
      joinInfo: "Møt opp på parkeringen ved Eineåsen en mandag. Hjelm er påbudt, og klubben låner ut sykkel til dem som trenger det. Treningsavgiften for 2026 er 1 200 kr.",
      coverPhotoId: "b-ph-terrengskolen",
      venueIds: ["b-eineasen"],
    }),
    node({
      id: "b-terreng-barn",
      parentId: "b-terreng",
      kind: "team",
      name: "Terreng Unge",
      slug: "terreng-unge",
      ageLabel: "Fra 11 år",
      ageRange: [11, 19],
      summary: "Mandager på Eineåsen med Terreng Barn, og torsdager i Vestmarka med mye enduro.",
      joinInfo: "Treningsavgiften for 2026 er 1 800 kr. Påmelding og beskjeder kommer i Spond.",
      coverPhotoId: "b-ph-terreng-ungdom",
      venueIds: ["b-vestmarka", "b-eineasen"],
      externalLinks: spond("Terreng Unge i Spond"),
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
      /* From bmxParticipation: a recruit day first, then membership and a licence. */
      firstTraining: {
        signUp: "Vil du prøve BMX, meld deg på en rekruttdag i Spond.",
        bring: "Til rekruttdagen har klubben noe utstyr til utlån. Til fast trening trenger du BMX-racingsykkel, helhjelm med visir og hakebeskytter, langermet trøye og bukse, sko med flat såle og sykkelhansker.",
        trial: "Du kan prøve på en rekruttdag. Vil du trene fast, melder du deg inn i BOC og skaffer lisens fra Norges Cykleforbund, som er gratis til og med 12 år.",
      },
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
      firstTraining: {
        signUp: "Start med et introkurs. Kursdatoer og påmelding står i BOC Velodrom-gruppen i Spond.",
        bring: "Sjekk Spond for utstyr. Medlemstilbudene har hatt sykkel, hjelm og eventuelle sko med i egenandelen.",
        trial: "Kursdato, pris og medlemspris står i BOC Velodrom-gruppen i Spond.",
      },
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
      // The menu shows Innendørs with Zwift's hero, the programme most of the winter rides on.
      identityPhotoId: "b-ph-zwift",
      venueIds: ["b-gjonneshallen"],
    }),
    node({
      id: "b-zwift",
      firstTraining: {
        bring: "Zwift-konto og smartrulle eller wattmåler.",
        signUp: "Følg Jakob Jølstad i Zwift Companion og aksepter Meetup-invitasjonen når den kommer.",
      },
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
    node({
      id: "b-spinning",
      firstTraining: { arrive: "10 minutter før, så hjelper instruktøren deg å stille inn sykkelen.", trial: "Timene er gratis for medlemmer." },
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

/* The site owner's own Strava profile, standing in for the demo riders'
   until real members add theirs (Person.stravaUrl). */
const DEMO_STRAVA = "https://www.strava.com/athletes/2461653";

const person = (p: Omit<Person, "privacy"> & { privacy?: Partial<Person["privacy"]> }): Person => ({
  ...p,
  privacy: { status: "visible", photoConsent: "granted", ...p.privacy },
});

/**
 * Staff and volunteers follow the roles published on the club's own site;
 * riders and guardians are invented for the demo, so no real member's data
 * (least of all a child's) lives in the prototype.
 *
 * One exception: the BMX riders named in the club's own NorgesCup 2026
 * report (b-a-norgescup-bmx), published here in full at the club's say-so.
 * They are real people, so they are ordinary Person records — their names
 * appear only as mentions and can be anonymised like anyone else's. Photo
 * consent is left "unknown": nobody here has recorded it.
 */
function people({ d }: SeedCtx): Person[] {
  return [
    person({
      id: "bp-christian",
      firstName: "Christian U.",
      lastName: "Adriaenssens",
      memberships: [{ nodeId: "b-boc", role: "boardChair", title: "Styreleder" }],
      publicContact: { email: "post@baerumock.no", phone: "480 88 568" },
      userId: "bu-christian",
      portraitPhotoId: "b-ph-christian",
    }),
    person({
      id: "bp-silje",
      firstName: "Silje",
      lastName: "Jørgensen",
      memberships: [{ nodeId: "b-boc", role: "generalManager", title: "Nestleder" }],
      publicContact: { email: "post@baerumock.no", phone: "951 78 223" },
    }),
    person({
      id: "bp-erik-haga",
      firstName: "Erik",
      lastName: "Haga",
      memberships: [
        { nodeId: "b-boc", role: "generalManager", title: "Styremedlem" },
        { nodeId: "b-boc3", role: "coach", title: "Road Captain" },
      ],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-henrik-munthe",
      firstName: "Henrik",
      lastName: "Munthe",
      memberships: [{ nodeId: "b-boc", role: "generalManager", title: "Styremedlem" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-william-ring-andersen",
      firstName: "William",
      lastName: "Ring-Andersen",
      memberships: [{ nodeId: "b-boc", role: "generalManager", title: "Styremedlem" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-jorgen-kirkelund",
      firstName: "Jørgen",
      lastName: "Kirkelund",
      memberships: [{ nodeId: "b-boc", role: "generalManager", title: "Styremedlem" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-petter-thoresen",
      firstName: "Petter",
      lastName: "Thoresen",
      memberships: [{ nodeId: "b-boc", role: "generalManager", title: "Varamedlem" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    /* Kontrollutvalg og valgkomité: tillitsverv, ikke driftskontakter, så de
       får role "volunteer" — samme som andre verv som ikke skal vises i
       kontaktlistene (contactsFor filtrerer på staffRoles). */
    person({
      id: "bp-bjorn-amdal",
      firstName: "Bjørn Kåre",
      lastName: "Amdal",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Kontrollutvalget, leder" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-lisa-axman",
      firstName: "Lisa Christin",
      lastName: "Axman",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Kontrollutvalget" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-jan-nagell",
      firstName: "Jan",
      lastName: "Nagell",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Kontrollutvalget, vara" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-ole-jorgen-kvarsvik",
      firstName: "Ole-Jørgen",
      lastName: "Kvarsvik",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Valgkomité, leder" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-stein-arne-lie",
      firstName: "Stein Arne",
      lastName: "Lie",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Valgkomité" }],
      publicContact: { email: "post@baerumock.no" },
      portraitPhotoId: "b-ph-stein-arne-lie",
    }),
    person({
      id: "bp-gunhild-berntsen",
      firstName: "Gunhild",
      lastName: "Berntsen",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Valgkomité" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-kurt-tryaire-haugen",
      firstName: "Kurt Tryaire",
      lastName: "Haugen",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Valgkomité, vara" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-eivind",
      firstName: "Eivind",
      lastName: "Lundstrøm",
      memberships: [{ nodeId: "b-terreng", role: "sectionLead", title: "Leder terreng" }],
      publicContact: { email: "terreng@boc.no", phone: "992 77 517" },
      userId: "bu-eivind",
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
      publicContact: { email: "post@baerumock.no", phone: "934 33 476" },
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
      memberships: [{ nodeId: "b-terrengskolen", role: "headCoach", title: "Ansvarlig Terreng Barn" }],
      publicContact: { email: "terrengskolen@boc.no", phone: "920 15 774" },
      userId: "bu-anders-h",
    }),
    person({
      id: "bp-erik-schmidt",
      firstName: "Erik",
      lastName: "Schmidt",
      memberships: [{ nodeId: "b-boc1", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no", phone: "995 76 457" },
      portraitPhotoId: "b-ph-erik-schmidt",
    }),
    person({
      id: "bp-franco-maggi",
      firstName: "Franco",
      lastName: "Maggi",
      memberships: [{ nodeId: "b-boc1", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-hans-raavand",
      firstName: "Hans",
      lastName: "Raavand",
      memberships: [{ nodeId: "b-boc2", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-esten-oversjoen",
      firstName: "Esten",
      lastName: "Øversjøen",
      memberships: [{ nodeId: "b-boc2", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no" },
      portraitPhotoId: "b-ph-esten-oversjoen",
    }),
    person({
      id: "bp-reidar-kveine",
      firstName: "Reidar",
      lastName: "Kveine",
      memberships: [{ nodeId: "b-boc3", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no", phone: "986 94 570" },
      portraitPhotoId: "b-ph-reidar-kveine",
    }),
    person({
      id: "bp-steinar-hillestad",
      firstName: "Steinar",
      lastName: "Hillestad",
      memberships: [{ nodeId: "b-boc3", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-trond-vidar-thomson",
      firstName: "Trond Vidar",
      lastName: "Thomson",
      memberships: [{ nodeId: "b-boc4", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no", phone: "901 60 606" },
      portraitPhotoId: "b-ph-trond-vidar-thomson",
    }),
    person({
      id: "bp-jorgen-lervik-astrom",
      firstName: "Jørgen Lervik",
      lastName: "Åström",
      memberships: [{ nodeId: "b-boc3", role: "coach", title: "Road Captain, Trondheim–Oslo" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-knut-aanonsen",
      firstName: "Knut",
      lastName: "Aanonsen",
      memberships: [{ nodeId: "b-boc3", role: "coach", title: "Road Captain, Trondheim–Oslo" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-lorenzo-williams",
      firstName: "Lorenzo",
      lastName: "Williams",
      memberships: [{ nodeId: "b-boc4", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no" },
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
      id: "bp-eystein",
      firstName: "Eystein",
      lastName: "Westgaard",
      memberships: [{ nodeId: "b-banegruppa", role: "coach", title: "Baneansvarlig" }],
      publicContact: { email: "post@baerumock.no", phone: "918 50 044" },
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
    person({ id: "bp-lars-holt", firstName: "Lars", lastName: "Holt", birthYear: 1974, memberships: [{ nodeId: "b-boc3", role: "athlete" }] }),
    person({ id: "bp-anne-berg", firstName: "Anne", lastName: "Bergli", birthYear: 1983, memberships: [{ nodeId: "b-boc3", role: "athlete" }] }),
    person({ id: "bp-jon-sunde", firstName: "Jon", lastName: "Sunde", birthYear: 1969, memberships: [{ nodeId: "b-boc3", role: "athlete" }] }),
    person({ id: "bp-mari-lie", firstName: "Mari", lastName: "Lien", birthYear: 1987, memberships: [{ nodeId: "b-boc3", role: "athlete" }] }),
    person({ id: "bp-per-dahl", firstName: "Per", lastName: "Dahlberg", birthYear: 1961, memberships: [{ nodeId: "b-boc3", role: "athlete" }] }),
    person({ id: "bp-kristin-moe", firstName: "Kristin", lastName: "Moe", birthYear: 1978, memberships: [{ nodeId: "b-boc3", role: "athlete" }] }),
    person({ id: "bp-ida-foss", firstName: "Ida", lastName: "Foss", birthYear: 1995, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-erik-vang", firstName: "Erik", lastName: "Vang", birthYear: 1972, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-hilde-sand", firstName: "Hilde", lastName: "Sand", birthYear: 1981, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-ole-haug", firstName: "Ole", lastName: "Haugland", birthYear: 1965, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-nina-bakke", firstName: "Nina", lastName: "Bakken", birthYear: 1990, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-arne-lund", firstName: "Arne", lastName: "Lundby", birthYear: 1958, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-tone", firstName: "Tone", lastName: "Krogh", memberships: [{ nodeId: "b-terreng-barn", role: "volunteer", title: "Foreldrekontakt" }], publicContact: { phone: "938 76 410" }, userId: "bu-tone" }),
    person({ id: "bp-rune", firstName: "Rune", lastName: "Fjeld", memberships: [], userId: "bu-rune" }),
    /* The riders behind the front page's example quotes (Club.testimonials):
       invented like the rest, with illustrated or stock portraits. */
    person({ id: "bp-demo-sander", firstName: "Sander", lastName: "Wold", birthYear: 2014, memberships: [{ nodeId: "b-bmx-voksen", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-sander" }),
    person({ id: "bp-demo-silje", firstName: "Silje", lastName: "Nordby", birthYear: 1992, memberships: [{ nodeId: "b-boc1", role: "athlete" }, { nodeId: "b-terreng-senior", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-silje" }),
    person({
      id: "bp-demo-robin",
      firstName: "Robin",
      lastName: "Lunde",
      birthYear: 1990,
      memberships: [
        { nodeId: "b-zwift", role: "athlete" },
        { nodeId: "b-boc1", role: "athlete" },
      ],
      stravaUrl: DEMO_STRAVA,
      portraitPhotoId: "b-ph-demo-robin",
    }),
    person({ id: "bp-demo-magnus", firstName: "Magnus", lastName: "Berg", birthYear: 2010, memberships: [{ nodeId: "b-downhill", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-magnus" }),
    person({ id: "bp-demo-rebekka", firstName: "Rebekka", lastName: "Solvang", birthYear: 2009, memberships: [{ nodeId: "b-junior", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-rebekka" }),
    person({ id: "bp-demo-trond", firstName: "Trond", lastName: "Sæbø", birthYear: 1968, memberships: [{ nodeId: "b-boc2", role: "athlete" }, { nodeId: "b-boc3", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-trond" }),
    person({ id: "bp-demo-camilla", firstName: "Camilla", lastName: "Holm", birthYear: 1989, memberships: [{ nodeId: "b-boc4", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-camilla" }),
    ...(
      [
        ["bp-jorgen-lillemoen", "Jørgen", "Lillemoen"],
        ["bp-valters-zabelis", "Valters", "Zabelis"],
        ["bp-ludvig-lier-tonne", "Ludvig", "Lier Tønne"],
        ["bp-nikolai-houge-haaland", "Nikolai", "Houge-Haaland"],
        ["bp-elias-haveland", "Elias", "Haveland"],
        ["bp-marcus-haugen", "Marcus", "Haugen"],
        ["bp-ulrik-krydsby", "Ulrik", "Krydsby"],
      ] as const
    ).map(([id, firstName, lastName]) =>
      person({ id, firstName, lastName, memberships: [{ nodeId: "b-bmx", role: "athlete" }], privacy: { photoConsent: "unknown" } }),
    ),
  ].map((p) => ({ ...p, privacy: { ...p.privacy, consentUpdatedAt: p.privacy.photoConsent === "granted" ? d(-260) : undefined } }));
}

const users = (): User[] => [
  {
    id: "bu-christian",
    name: "Christian Adriaenssens",
    email: "post@baerumock.no",
    authProviders: ["google"],
    personId: "bp-christian",
    guardianOfPersonIds: [],
    roles: [{ role: "clubAdmin", nodeId: "b-boc" }],
  },
  {
    id: "bu-eivind",
    name: "Eivind Lundstrøm",
    email: "terreng@boc.no",
    authProviders: ["email"],
    personId: "bp-eivind",
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
  tall?: Photo["tall"];
}

const shot = (p: PhotoDef): Photo => ({
  id: p.id,
  src: `https://images.unsplash.com/${p.ref}`,
  width: p.width,
  height: p.height,
  focal: p.focal ?? { x: 50, y: 50 },
  ...(p.tall && { tall: p.tall }),
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
  /* Behind «Bli med» on every group page: the club riding away down a
     forest road, in club kit. */
  {
    id: "b-ph-join",
    src: joinPhoto.src,
    width: joinPhoto.width,
    height: joinPhoto.height,
    focal: { x: 48, y: 58 },
    // On the wide band, closer and from the left edge: the riders land about
    // two thirds across, clear of the text on the left.
    mdFocal: { x: 0, y: 58 },
    mdZoom: 1.35,
    tone: "#5f6b4a",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet bortover en skogsvei, sett bakfra",
    caption: [text("Fellestrening")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* Portraits for the example member quotes on the front page: illustrated
     riders in club kit supplied by the site owner, and one stock photograph
     (Unsplash). Not club members; see Club.testimonials. */
  {
    id: "b-ph-demo-sander",
    src: demoSanderPhoto.src,
    width: demoSanderPhoto.width,
    height: demoSanderPhoto.height,
    focal: { x: 50, y: 42 },
    tone: "#6f7f63",
    alt: "Smilende gutt med sykkelhjelm og sort BOC-drakt",
    caption: [text("Eksempelbilde")],
    nodeId: "b-bmx-voksen",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-demo-silje",
    src: demoSiljePhoto.src,
    width: demoSiljePhoto.width,
    height: demoSiljePhoto.height,
    focal: { x: 55, y: 38 },
    tone: "#7f8f5a",
    alt: "Smilende kvinne med hjelm, solbriller og gul BOC-drakt ved et vann",
    caption: [text("Eksempelbilde")],
    nodeId: "b-boc1",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-demo-robin",
    src: demoRobinPhoto.src,
    width: demoRobinPhoto.width,
    height: demoRobinPhoto.height,
    focal: { x: 50, y: 36 },
    tone: "#7f8f5a",
    alt: "Smilende mann med hjelm, solbriller og gul BOC-drakt ved et vann",
    caption: [text("Eksempelbilde")],
    nodeId: "b-zwift",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  shot({
    id: "b-ph-demo-magnus",
    ref: "photo-1624831662357-97d6af9055b2",
    width: 4351,
    height: 6424,
    tone: "#4f5a44",
    photographer: "Nathanaël Desmeules",
    focal: { x: 50, y: 30 },
    alt: "Tenåring med fullface-hjelm skjøvet opp i pannen smiler i skogen",
    nodeId: "b-downhill",
    caption: "Eksempelbilde",
  }),
  {
    id: "b-ph-demo-rebekka",
    src: demoRebekkaPhoto.src,
    width: demoRebekkaPhoto.width,
    height: demoRebekkaPhoto.height,
    focal: { x: 55, y: 36 },
    tone: "#5d6b6e",
    alt: "Ung kvinne med hjelm, solbriller og sort BOC-drakt",
    caption: [text("Eksempelbilde")],
    nodeId: "b-junior",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-demo-trond",
    src: demoTrondPhoto.src,
    width: demoTrondPhoto.width,
    height: demoTrondPhoto.height,
    focal: { x: 50, y: 36 },
    tone: "#5d6b6e",
    alt: "Smilende mann med grått skjegg, hjelm og sort BOC-drakt ved et vann",
    caption: [text("Eksempelbilde")],
    nodeId: "b-boc3",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-demo-camilla",
    src: demoCamillaPhoto.src,
    width: demoCamillaPhoto.width,
    height: demoCamillaPhoto.height,
    focal: { x: 52, y: 38 },
    tone: "#7f8f5a",
    alt: "Smilende kvinne med hjelm og gul BOC-drakt ved et vann",
    caption: [text("Eksempelbilde")],
    nodeId: "b-boc4",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* The club's own photograph of Ulrik Gerner on the podium in the
     NorgesCup, for its report on the result. A tall frame, so the focal
     point holds the BOC rider on the top step in a wide crop. */
  {
    id: "b-ph-ulrik-gerner",
    src: ulrikGernerPhoto.src,
    width: ulrikGernerPhoto.width,
    height: ulrikGernerPhoto.height,
    focal: { x: 32, y: 36 },
    tone: "#6e8fb0",
    alt: "BOC-rytter i sort og gul drakt øverst på pallen i NorgesCupen i utfor, med to andre ryttere på pallen ved siden av",
    caption: [text("Pallen i NorgesCupen i utfor")],
    nodeId: "b-downhill",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* The club's own photograph from NorgesCup 2026, from its news report.
     Nobody in it is tagged: which rider is which is not recorded. */
  {
    id: "b-ph-bmx-norgescup",
    src: bmxNorgescupPhoto.src,
    width: bmxNorgescupPhoto.width,
    height: bmxNorgescupPhoto.height,
    focal: { x: 50, y: 52 },
    tone: "#6f7a5c",
    alt: "Seks BMX-ryttere i gule BOC-drakter står ved syklene sine med pokaler og diplomer foran BOC BMX-teltet",
    caption: [text("BOC BMX etter sesongavslutningen i NorgesCupen på Sviland")],
    nodeId: "b-bmx",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
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
  /* A taller portrait cut of the same Styrkeprøven photograph, shot for the
     front page's mobile hero: the group sits in the upper third with a long
     stretch of empty road below them, room enough for the statement to sit
     on the photograph itself instead of on a band beneath it. */
  {
    id: "b-ph-hero-mobile",
    src: heroMobilePhoto.src,
    width: heroMobilePhoto.width,
    height: heroMobilePhoto.height,
    focal: { x: 50, y: 20 },
    tone: "#728171",
    alt: "BOC-ryttere i gul klubbdrakt sykler i kolonne på en fjellvei, med mye vei i forgrunnen",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* The hero's two cuts at dusk, with the riders' lights on, for the
     visitor's dark mode (see the front page's hero). Same framing as the
     daylight cuts, so the statement sits in the same place on both. */
  {
    id: "b-ph-hero-dark",
    src: heroWideDarkPhoto.src,
    width: heroWideDarkPhoto.width,
    height: heroWideDarkPhoto.height,
    focal: { x: 40, y: 58 },
    tone: "#1c2533",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet på en fjellvei i skumringen, med lys på syklene",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-hero-mobile-dark",
    src: heroMobileDarkPhoto.src,
    width: heroMobileDarkPhoto.width,
    height: heroMobileDarkPhoto.height,
    focal: { x: 50, y: 20 },
    tone: "#1c2533",
    alt: "BOC-ryttere i gul klubbdrakt sykler i kolonne på en fjellvei i skumringen, med lys på syklene",
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
  /* BOC 1 takes the same cut a little further right: its cover is mostly
     seen as a tall card (the carousel), where the Landevei crop cuts the
     riders off at the right edge. */
  {
    id: "b-ph-boc-fast-hero",
    src: styrkeprovenNarrow.src,
    width: styrkeprovenNarrow.width,
    height: styrkeprovenNarrow.height,
    focal: { x: 55, y: 100 },
    zoom: 1.3,
    tall: { focal: { x: 50, y: 100 }, zoom: 1.45 },
    tone: "#728171",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet på en fjellvei under Styrkeprøven",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  /* Group photos for BOC 2–4, the riders standing in a row: the focal
     point is the middle of the row, so a tall card keeps the faces. On the
     tall cards (Photo.tall) they are lifted clear of the card text. */
  {
    id: "b-ph-boc2",
    src: boc2Photo.src,
    width: boc2Photo.width,
    height: boc2Photo.height,
    focal: { x: 50, y: 45 },
    tall: { focal: { x: 50, y: 100 }, zoom: 1.15 },
    tone: "#7f8c5c",
    alt: "Rundt tjue ryttere i gul BOC-drakt stiller opp på plenen foran et murbygg",
    caption: [text("BOC 2 samlet")],
    nodeId: "b-boc2",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-boc3",
    src: boc3Photo.src,
    width: boc3Photo.width,
    height: boc3Photo.height,
    focal: { x: 50, y: 58 },
    tall: { focal: { x: 50, y: 100 }, zoom: 1.3 },
    tone: "#8b9096",
    alt: "Ryttere i gul BOC-drakt smiler til kamera med brusflasker i hendene, på en parkeringsplass under blå himmel",
    caption: [text("BOC 3 samlet")],
    nodeId: "b-boc3",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-boc4",
    src: boc4Photo.src,
    width: boc4Photo.width,
    height: boc4Photo.height,
    focal: { x: 50, y: 55 },
    tall: { focal: { x: 50, y: 100 }, zoom: 1.2 },
    tone: "#6f7c5f",
    alt: "Ryttere i gul BOC-drakt og andre klubbdrakter på gresset ved en bensinstasjon, med åser og blå himmel bak",
    caption: [text("BOC 4 samlet")],
    nodeId: "b-boc4",
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
    tall: { focal: { x: 42, y: 100 }, zoom: 1.13 },
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
    tall: { focal: { x: 37, y: 100 }, zoom: 1.18 },
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
    caption: "Terreng Barn på Eineåsen",
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
  /* Road Captains' own portraits, and ones from the board and the
     valgkomité, uploaded by the club like Jakob's. */
  {
    id: "b-ph-erik-schmidt",
    src: erikSchmidtPhoto.src,
    width: erikSchmidtPhoto.width,
    height: erikSchmidtPhoto.height,
    focal: { x: 50, y: 38 },
    tone: "#b9ab93",
    alt: "Portrett av Road Captain i BOC 1",
    nodeId: "b-boc1",
    people: [{ personId: "bp-erik-schmidt", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-reidar-kveine",
    src: reidarKveinePhoto.src,
    width: reidarKveinePhoto.width,
    height: reidarKveinePhoto.height,
    focal: { x: 53, y: 35 },
    tone: "#8c8a52",
    alt: "Portrett av Road Captain i BOC 3",
    nodeId: "b-boc3",
    people: [{ personId: "bp-reidar-kveine", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-trond-vidar-thomson",
    src: trondVidarThomsonPhoto.src,
    width: trondVidarThomsonPhoto.width,
    height: trondVidarThomsonPhoto.height,
    focal: { x: 50, y: 38 },
    tone: "#a8a39a",
    alt: "Portrett av Road Captain i BOC 4",
    nodeId: "b-boc4",
    people: [{ personId: "bp-trond-vidar-thomson", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-esten-oversjoen",
    src: estenOversjoenPhoto.src,
    width: estenOversjoenPhoto.width,
    height: estenOversjoenPhoto.height,
    focal: { x: 55, y: 30 },
    tone: "#7d97a8",
    alt: "Portrett av Road Captain i BOC 2",
    nodeId: "b-boc2",
    people: [{ personId: "bp-esten-oversjoen", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-christian",
    src: christianPhoto.src,
    width: christianPhoto.width,
    height: christianPhoto.height,
    focal: { x: 50, y: 40 },
    tone: "#b9b3a6",
    alt: "Portrett av styrelederen",
    nodeId: "b-boc",
    people: [{ personId: "bp-christian", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-stein-arne-lie",
    src: steinArneLiePhoto.src,
    width: steinArneLiePhoto.width,
    height: steinArneLiePhoto.height,
    focal: { x: 55, y: 38 },
    tone: "#8f9a5a",
    alt: "Portrett av et medlem av valgkomiteen",
    nodeId: "b-boc",
    people: [{ personId: "bp-stein-arne-lie", region: null }],
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
    /* BOC 1–4: Tuesday and Thursday at 18.00 from Bekkestua torg
       (årsberetningen 2025), and the Sunday long ride at 10.00 from
       Kaffebrenneriet in Sandvika, where
       everyone meets and each group rides its own. Every week from April to
       September except July, the club's fellesferie — so each session is
       two series, April–June and August–September, and the week view, the
       club year and the group page all leave July empty. */
    ...["b-boc1", "b-boc2", "b-boc3", "b-boc4"].flatMap((nodeId) =>
      [
        { key: "tir", weekday: 2, title: "Fellestrening", start: "18:00", end: "20:00", venueId: "b-bekkestua" },
        { key: "tor", weekday: 4, title: "Fellestrening", start: "18:00", end: "20:00", venueId: "b-bekkestua" },
        { key: "son", weekday: 7, title: "Langtur", start: "10:00", end: "13:00", venueId: "b-kaffebrenneriet" },
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
      title: "Terreng Barn",
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
    /* Terreng Unge rides with Terreng Barn on Mondays at Eineåsen, and on
       its own on Thursdays, mostly around Steinskogen and Gardlaushøgda in
       Vestmarka (årsberetningen 2025). */
    s({ id: "bs-terreng-barn-man", nodeId: "b-terreng-barn", title: "Terrengtrening", weekday: 1, start: "17:30", end: "18:45", venueId: "b-eineasen", from: on(3, 1), to: on(11, 30), seasonal: true, clubYearGroupId: "b-terreng", clubYearLabel: "Terreng" }),
    s({ id: "bs-terreng-barn", nodeId: "b-terreng-barn", title: "Terrengtrening", weekday: 4, start: "17:30", end: "19:00", venueId: "b-vestmarka", from: on(3, 1), to: on(11, 30), seasonal: true, clubYearGroupId: "b-terreng", clubYearLabel: "Terreng" }),
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
  ];
}

/* ── Races ────────────────────────────────────────────────────────────────
   The races members ride together, most of them in the turritt or master
   classes. Dates are the organisers' own for the latest edition published
   (checked September 2026 in EQ Timing and on the race sites); the club year
   projects next season's edition from them. Genus Open is the club's own
   race and follows the seeded season like the rest of the club's dates. */

/* The rides each road group trains towards and enters together, from the
   groups' plans for 2026 in årsberetningen 2025. */
const BOC_1_TO_3 = ["b-boc1", "b-boc2", "b-boc3"];

function races({ on }: SeedCtx): Race[] {
  const road = (r: Omit<Race, "nodeId">): Race => ({ nodeId: "b-landevei", ...r });
  const mtb = (r: Omit<Race, "nodeId">): Race => ({ nodeId: "b-terreng", ...r });
  return [
    road({ id: "r-enebakk", name: "Enebakk Rundt", date: "2026-05-01", place: "Skullerud – Enebakk", organiser: "IK Hero", groupIds: BOC_1_TO_3 }),
    road({ id: "r-follo", name: "Follorittet", date: "2026-05-10", place: "Ås", organiser: "Follo Sykkelklubb" }),
    road({ id: "r-ceres", name: "Ceresrittet", date: "2026-05-10", place: "Romerike", organiser: "SK Ceres" }),
    road({ id: "r-nordmarka", name: "Nordmarka Rundt", date: "2026-05-24", place: "Årvoll skole, Oslo" }),
    road({ id: "r-randsfjorden", name: "Randsfjorden Rundt", date: "2026-05-30", place: "Brandbu", groupIds: BOC_1_TO_3 }),
    road({ id: "r-tyrifjorden", name: "Tyrifjorden Rundt", date: "2026-06-07", place: "Sandvika – rundt Tyrifjorden", organiser: "Oslo Klassikerne", groupIds: ["b-boc3", "b-boc4"] }),
    road({
      id: "r-vattern",
      name: "Vätternrunden",
      date: "2026-06-13",
      place: "Motala, rundt Vättern",
      url: "https://www.vatternrundan.se",
      groupIds: ["b-boc1", "b-boc2"],
    }),
    /* Styrkeprøven is several distances in one weekend; the groups ride
       different ones. Both start on the Saturday around 20 June: in 2027,
       Saturday 19 June (the organiser's weekend is 18–20 June). */
    road({
      id: "r-styrkeproven-to",
      name: "Styrkeprøven Trondheim–Oslo",
      date: "2027-06-19",
      place: "Trondheim – Oslo",
      url: "https://styrkeproven.no",
      groupIds: ["b-boc3"],
    }),
    road({
      id: "r-styrkeproven-lo",
      name: "Styrkeprøven Lillehammer–Oslo",
      date: "2027-06-19",
      place: "Lillehammer – Oslo",
      url: "https://styrkeproven.no",
      groupIds: ["b-boc3", "b-boc4"],
    }),
    road({ id: "r-oyeren", name: "Øyeren Rundt", date: "2026-08-09", place: "Fjerdingby, Rælingen", groupIds: ["b-boc1"] }),
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

/* NorgesCup 2026: the results as the club reported them, retold for the
   prototype. Every rider is a mention, so anonymising one leaves the
   neutral phrase in their place. */
const norgescupBmx: Block[] = [
  para([t("Med sesongavslutningen på Sviland er NorgesCupen 2026 kjørt ferdig, og sammenlagtlista har flere BOC-ryttere helt i toppen.")]),
  { type: "heading", text: "Pallen sammenlagt" },
  {
    type: "list",
    items: [
      [m("bp-jorgen-lillemoen", "Jørgen Lillemoen", "En BOC-rytter"), t(" – 1. plass, og klassevinner")],
      [m("bp-valters-zabelis", "Valters Zabelis", "En BOC-rytter"), t(" – 2. plass")],
      [m("bp-ludvig-lier-tonne", "Ludvig Lier Tønne", "En BOC-rytter"), t(" – 3. plass")],
    ],
  },
  { type: "heading", text: "Like bak" },
  {
    type: "list",
    items: [
      [m("bp-nikolai-houge-haaland", "Nikolai Houge-Haaland", "En BOC-rytter"), t(" – 4. plass")],
      [m("bp-elias-haveland", "Elias Haveland", "En BOC-rytter"), t(" – 4. plass")],
      [m("bp-marcus-haugen", "Marcus Haugen", "En BOC-rytter"), t(" – 7. plass")],
    ],
  },
  para([
    t("Siste runde på Sviland ga også en fin avslutning for de yngre: i klassen 11–12 år kjørte "),
    m("bp-ulrik-krydsby", "Ulrik Krydsby", "en av våre ryttere"),
    t(" inn til 2. plass. Det lover godt for rytterne som kommer etter de etablerte."),
  ]),
  para([t("Gratulerer til alle BOC-rytterne med en sterk sesong i NorgesCupen!")]),
];

const NEWS: NewsInput[] = [
  {
    id: "b-a-norgescup-bmx",
    slug: "sammenlagt-norgescupen-bmx-2026",
    nodeId: "b-bmx",
    title: "Sterke sammenlagtresultater for BOC BMX i NorgesCupen 2026",
    lead: "Sesongen ble avsluttet på Sviland, og sammenlagt i NorgesCupen endte flere BOC-ryttere på pallen og like bak.",
    body: [],
    blocks: norgescupBmx,
    author: "bu-thelia",
    date: "2026-09-22",
    photo: "b-ph-bmx-norgescup",
    home: true,
  },
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
    author: "bu-eivind",
    date: "2026-09-01",
    photo: "b-ph-ulrik-gerner",
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
    author: "bu-eivind",
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
    author: "bu-eivind",
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

/* Member stories behind the front page's example quotes (Club.testimonials):
   one short portrait each, written for the prototype about the invented demo
   riders and marked as examples on the page. Every mention of the member is
   a mention, so anonymising them leaves the neutral phrase. Kept out of the
   news lists (Article.memberStory). */
interface MemberStoryInput {
  personId: string;
  slug: string;
  nodeId: string;
  photoId: string;
  date: string;
  name: string;
  neutral: string;
  title: string;
  lead: string;
  before: string;
  quote: string;
  after: string;
}

const MEMBER_STORIES: MemberStoryInput[] = [
  {
    personId: "bp-demo-silje",
    slug: "medlem-silje-boc1",
    nodeId: "b-boc1",
    photoId: "b-ph-demo-silje",
    date: "2026-09-15",
    name: "Silje",
    neutral: "En av rytterne på BOC 1",
    title: " holder følge i BOC 1",
    lead: " begynte å sykle landevei for tre år siden. I år tok hun steget opp til BOC 1, den raskeste fellesgruppa.",
    before: "BOC 1 holder 33–37 km/t og kjører ofte drag og rulling på flatt terreng. Gruppa trener tirsdag og torsdag fra Bekkestua torg, og kjører langtur fra Kaffebrenneriet i Sandvika på lørdager.",
    quote: "Jeg kom fra løping og trodde BOC 1 var for proffe for meg. Nå er drag og rulling på tirsdagene høydepunktet i uka.",
    after: "På onsdagene bytter hun til terrengsykkelen og kjører stitrening med Terreng Senior på Kolsås. Det er lett å være med i flere grupper samtidig.",
  },
  {
    personId: "bp-demo-trond",
    slug: "medlem-trond-boc3",
    nodeId: "b-boc3",
    photoId: "b-ph-demo-trond",
    date: "2026-09-13",
    name: "Trond",
    neutral: "En av rytterne på BOC 3",
    title: " fant tempoet i BOC 3",
    lead: " begynte å sykle i gruppe da han fylte femti. Nå møter han BOC 3 på Bekkestua to kvelder i uka.",
    before: "BOC 3 holder 27–30 km/t, for dem som har syklet en del og vil ha jevn fart i gruppe. Gruppa kjører tirsdag og torsdag fra Bekkestua torg, og langtur fra Kaffebrenneriet på lørdager.",
    quote: "Jeg trodde landevei i gruppe var for unge og raske. I BOC 3 er farten akkurat passe, og praten går hele veien.",
    after: "Når formen er god, kjører han med BOC 2 i stedet. Det er lett å bytte gruppe fra tur til tur, så man kan velge fart etter dagsformen.",
  },
  {
    personId: "bp-demo-rebekka",
    slug: "medlem-rebekka-junior",
    nodeId: "b-junior",
    photoId: "b-ph-demo-rebekka",
    date: "2026-09-02",
    name: "Rebekka",
    neutral: "En av juniorene",
    title: "s første ritt",
    lead: " sykler i juniorgruppa på Landevei, og stilte på sitt første ritt i sommer sammen med resten av gruppa.",
    before: "Juniorene trener intervaller fra Bærum Idrettspark på tirsdager og kjører langtur med resten av klubben i helgene. Mange av dem kom fra ungdomsgruppa.",
    quote: "Juniorgruppa ga meg både treningskompiser og mitt første ritt. Det hadde jeg aldri turt å stille på alene.",
    after: "På lørdagene sykler hun ofte langtur med BOC 2. Det er lett å bytte gruppe fra tur til tur, og ingen trenger å melde seg ut av den ene for å prøve den andre.",
  },
  {
    personId: "bp-demo-sander",
    slug: "medlem-sander-bmx",
    nodeId: "b-bmx-voksen",
    photoId: "b-ph-demo-sander",
    date: "2026-09-12",
    name: "Sander",
    neutral: "En av BMX-rytterne",
    title: " og startgrinda",
    lead: " begynte på BMX som sjuåring. I dag trener han med Gruppe 3 i Bærum Sykkelpark to kvelder i uka.",
    before: "Det første året handlet mest om å komme seg rundt banen uten å gå av sykkelen. Nå øver gruppa på starter, svinger og hopp, og trenerne deler inn etter hva hver enkelt er klar for.",
    quote: "Det beste er startgrinda. Når den faller, er det bare å tråkke så hardt du kan. Og etter treningen får vi is.",
    after: "Når klubben arrangerer RegionsCup på hjemmebane, står foreldrene som funksjonærer i depot og på kiosken, mens rytterne kjører heat etter heat.",
  },
  {
    personId: "bp-demo-robin",
    slug: "medlem-robin-zwift",
    nodeId: "b-zwift",
    photoId: "b-ph-demo-robin",
    date: "2026-09-05",
    name: "Robin",
    neutral: "En av rytterne på Zwift",
    title: " sykler sammen hele vinteren",
    lead: " sykler på Zwift med klubben fra november til mars, to kvelder i uka.",
    before: "Om vinteren arrangerer klubben Meetups på Zwift mandag og onsdag. «Stay together» er på, så alle holder sammen uansett watt.",
    quote: "Zwift om vinteren gjør at jeg holder formen uten å sykle alene. Med «Stay together» kommer vi i mål som en gruppe.",
    after: "Når sesongen starter igjen i april, bytter han til BOC 1 fra Bekkestua. Mange sykler i flere grupper gjennom året, og det er lett å bytte.",
  },
  {
    personId: "bp-demo-magnus",
    slug: "medlem-magnus-downhill",
    nodeId: "b-downhill",
    photoId: "b-ph-demo-magnus",
    date: "2026-09-08",
    name: "Magnus",
    neutral: "En av utforrytterne",
    title: " viser vei på Kolsås",
    lead: " kom til Downhill – Enduro fra terrenggruppa for barn og ungdom. Nå er han en av dem de nye følger etter.",
    before: "Utforgruppa trener på Kolsås og reiser på fellesturer til Drammen og Hafjell. Det tekniske lærer man best ved å kjøre bak noen som har kjørt linja før.",
    quote: "Jeg lærte å kjøre bratt sammen med folk som var litt bedre enn meg. Nå er det jeg som viser de nye linjene på Kolsås.",
    after: "Fullface-hjelm og beskyttelse er påbudt på alle utforøkter, og klubben har noe utstyr til utlån for dem som vil prøve først.",
  },
  {
    personId: "bp-demo-camilla",
    slug: "medlem-camilla-boc4",
    nodeId: "b-boc4",
    photoId: "b-ph-demo-camilla",
    date: "2026-08-20",
    name: "Camilla",
    neutral: "En av rytterne på BOC 4",
    title: " startet i BOC 4",
    lead: " kjøpte sin første landeveissykkel i fjor, og ble med i BOC 4 samme vår.",
    before: "BOC 4 holder 24–27 km/t og er gruppa for deg som er ny på landevei eller vil sykle sosialt. Gruppa møtes på Bekkestua torg tirsdag og torsdag, og kjører langtur fra Kaffebrenneriet på lørdager.",
    quote: "BOC 4 var perfekt da jeg var ny på landevei. Vi holder rolig tempo, stopper for kaffe, og ingen sykler alene hjem.",
    after: "Road Captain viser hvordan man sykler i gruppe, og det er lov å spørre om alt.",
  },
];

const memberStories = (): Article[] =>
  MEMBER_STORIES.map((s) => {
    const who = m(s.personId, s.name, s.neutral);
    return {
      id: `b-a-${s.slug}`,
      slug: s.slug,
      nodeId: s.nodeId,
      title: [who, text(s.title)],
      lead: [who, text(s.lead)],
      blocks: [
        para([text(s.before)]),
        { type: "quote", content: [text(s.quote)], attribution: [m(s.personId, s.name, "")], speakerPersonId: s.personId },
        para([text(s.after)]),
      ],
      heroPhotoId: s.photoId,
      status: "published" as const,
      authorUserId: "bu-gunhild",
      createdAt: `${s.date}T08:30`,
      publishedAt: `${s.date}T09:00`,
      onHomepage: false,
      memberStory: true,
      aboutPersonId: s.personId,
      example: true,
    };
  });

const articles = (): Article[] => [
  ...memberStories(),
  ...NEWS.map((n) => ({
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
  })),
];

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
