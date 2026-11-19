/**
 * «Virksomhetsidé og strategi 2027–2030», the draft after BOC's strategy meeting on 19 November 2026, as shown on the
 * working page /strategi/2027-2030 (src/app/(public)/strategi/2027-2030/page.tsx). This file is the only place the text
 * lives: change the wording, move a point or add one here.
 *
 * Every point people can discuss has an explicit `id`. It is the key of its comment thread (the table strategy_comments,
 * lib/strategy-comments.ts) and the anchor of its direct link (/strategi/2027-2030#kommunikasjon-sesonginformasjon).
 * Rules, so threads and shared links survive edits:
 *   - Correct the text freely; keep the id.
 *   - Move a point (to another place or another goal) by moving the whole object, id included.
 *   - Never reuse an id for a different point. If an id really must change, put the old one in `formerIds`: its thread
 *     and old links then lead to the point under its new id.
 * Changing the content in substance? Change STRATEGY.version too, so earlier approvals no longer count for the new text.
 * Goal numbers («Mål 3») come from the order of GOALS, so the document, the contents list and the open questions'
 * references always agree.
 */

export interface StrategyPoint {
  id: string;
  text: string;
  formerIds?: string[];
}

export interface StrategyGoal {
  id: string;
  title: string;
  subgoals: StrategyPoint[];
  measures: StrategyPoint[];
  formerIds?: string[];
}

export interface StrategyQuestion {
  id: string;
  title: string;
  /** The id of the goal the question belongs to (its number is looked up, never written here). */
  goal: string;
  body: string[];
  formerIds?: string[];
}

export const STRATEGY = {
  /** The key all comments on this document are stored under. */
  docId: "strategi-2027-2030",
  path: "/strategi/2027-2030",
  club: "Bærum og Omegn Cykleklubb",
  title: "Virksomhetsidé og strategi 2027–2030",
  draft: "Utkast etter strategimøtet 19. november 2026",
  motto: "«Det er gøy å sykle – det er ekstra gøy å sykle sammen!»",
  /**
   * The version people approve («Godkjenn dokumentet slik det er», lib/strategy-comments.ts). Change it when the content
   * changes in substance (a point added, moved or reworded so it means something else), not for a typo: approvals of an
   * earlier version are then shown as such, and everyone is asked to approve again. `versionLabel` says which text it was.
   */
  version: "utkast-2026-11-19",
  versionLabel: "utkastet etter strategimøtet 19. november 2026",
  /** False closes the page for new comments and approvals (reading stays open). */
  open: true,
  /** Those who may sign a comment: the participants of the strategy meeting, spelt as they want it. */
  names: ["Eivind Lundstrøm", "Jørgen Krydsby", "Henrik Munthe", "Steinar Hillestad", "Jakob Jølstad"],
} as const;

export const IDEA: StrategyPoint & { heading: string; paragraphs: string[] } = {
  id: "virksomhetside",
  heading: "Virksomhetsidé",
  text: "Virksomhetsidé",
  paragraphs: [
    "BOC skal være en sykkelklubb for alle. Vi skal hjelpe medlemmene med å nå sine egne mål, enten de vil stå på pallen eller ha gode turer sammen med andre. Gjennom ritt, treninger og andre aktiviteter skal BOC være en synlig klubb som bidrar til et bredt og aktivt sykkelmiljø i Norge.",
  ],
};

export const VALUES: StrategyPoint & { heading: string; paragraphs: string[] } = {
  id: "verdier",
  heading: "Verdier",
  text: "Verdier",
  paragraphs: [
    "BOC bygger på norsk idretts verdier om idrettsglede, fellesskap, helse og ærlighet, og på organisasjonsverdiene frivillighet, demokrati, lojalitet og likeverd.",
    "I BOC skal medlemmene føle seg velkomne og trygge, oppleve mestring og kunne glede seg over egen prestasjon. Vi skal ta vare på fellesskapet i gruppene og på tvers av klubben.",
  ],
};

export const GOALS: StrategyGoal[] = [
  {
    id: "trening-og-aktivitet",
    title: "Trening og aktivitet",
    subgoals: [
      { id: "trening-helarstilbud", text: "Medlemmene skal ha et treningstilbud gjennom hele året og innenfor de fleste sykkelgrener." },
      { id: "trening-finne-gruppe", text: "Både nye og etablerte medlemmer skal kunne finne en gruppe som passer deres nivå og ambisjoner." },
      { id: "trening-kompetanse", text: "Gruppeledere skal ha kompetansen de trenger for å lede gruppene sine, og barn og unge skal ha tilgang til dyktige trenere." },
    ],
    measures: [
      {
        id: "trening-gruppebeskrivelser",
        text: "Beskrive gruppenes nivå, hvem treningene passer for, og hva deltakerne kan forvente. Gjøre beskrivelsene tilgjengelige både innad i klubben og for dem som vurderer å bli med.",
      },
      {
        id: "trening-faglig-oppfolging",
        text: "Gi gruppeledere faglig oppfølging. Utdanne trenere og hjelpetrenere blant medlemmene, utvikle ungdomstrenere og knytte til klubben profesjonell trenerkompetanse ved behov.",
      },
      { id: "trening-konkurransegruppe", text: "Ha en konkurransegruppe for ryttere som ønsker å satse." },
      {
        id: "trening-representasjon-ritt",
        text: "Sørge for at BOC er representert i egne arrangementer og i ritt som er viktige for klubben, blant annet Tyrifjorden Rundt, Styrkeprøven, norgescup, masterscup, NM og regionale ritt for barn og unge.",
      },
      { id: "trening-uformelle-ritt", text: "Gjøre det enkelt for gruppene å arrangere uformelle ritt og aktiviteter for både medlemmer og ikke-medlemmer." },
    ],
  },
  {
    id: "rekruttering-og-medlemsutvikling",
    title: "Rekruttering og medlemsutvikling",
    subgoals: [
      { id: "rekruttering-kvinneandel", text: "Øke kvinneandelen i klubben." },
      { id: "rekruttering-aldersgrupper", text: "Få flere deltakere i aldersgrupper som i dag er svakt representert." },
      {
        id: "rekruttering-frafall",
        text: "Redusere frafallet blant ungdoms- og seniorryttere. Det skal være mulig å fortsette i klubben også når egne ambisjoner endrer seg.",
      },
    ],
    measures: [
      { id: "rekruttering-barn-og-unge", text: "Rekruttere barn og unge under 19 år, blant annet gjennom skolene." },
      { id: "rekruttering-10-19-ar", text: "Styrke treningstilbudet for medlemmer mellom 10 og 19 år." },
      {
        id: "rekruttering-ambisjonsnivaer",
        text: "Tilrettelegge for ulike ambisjonsnivåer i ungdoms- og seniorklassene, slik at både konkurranseryttere og dem som først og fremst vil sykle sammen, finner et miljø i klubben.",
      },
      {
        id: "rekruttering-jenter-og-kvinner",
        text: "Utvikle treningstilbud som appellerer til jenter og kvinner. Bygge videre på BOC4s erfaringer med å få flere kvinner med på trening.",
      },
    ],
  },
  {
    id: "sykkelpark-og-klubbhus",
    title: "Bærum Sykkelpark og klubbhuset",
    subgoals: [
      { id: "sykkelpark-arena", text: "Bærum Sykkelpark skal være en attraktiv sykkelarena for medlemmer i alle aldre og et trygt sted å trene for barn og unge." },
      { id: "sykkelpark-naermiljo", text: "Sykkelparken skal også komme nærmiljøet til gode." },
      { id: "klubbhuset-samlingspunkt", text: "Klubbhuset skal være et samlingspunkt for medlemmene og sykkelmiljøet i Bærum." },
    ],
    measures: [
      { id: "sykkelpark-trygg-trening", text: "Videreutvikle parken med særlig vekt på trygg trening for de yngre medlemmene." },
      { id: "sykkelpark-naermiljo-bruk", text: "Legge til rette for at også nærmiljøet kan bruke sykkelparken." },
      { id: "klubbhuset-moteplass", text: "Utvikle klubbhuset som møteplass for klubbens medlemmer og det lokale sykkelmiljøet." },
    ],
  },
  {
    id: "kommunikasjon",
    title: "Kommunikasjon",
    subgoals: [
      {
        id: "kommunikasjon-finne-aktiviteter",
        text: "Medlemmer og potensielle deltakere skal enkelt kunne finne ut hva som skjer i BOC, hvem aktivitetene passer for, og hvordan de kan bli med.",
      },
      {
        id: "kommunikasjon-sjeldne-deltakere",
        text: "Medlemmer som sjelden deltar, skal få relevant informasjon og kjenne seg velkomne uten å oppleve press om å møte opp.",
      },
      {
        id: "kommunikasjon-familier",
        text: "Familier skal kjenne til familiemedlemskapet og vite hvilken verdi det har også for familiemedlemmer som deltar sjelden.",
      },
    ],
    measures: [
      {
        id: "kommunikasjon-sesonginformasjon",
        text: "Lage en felles mal for gruppenes sesonginformasjon. Hver gruppe skal beskrive hvem tilbudet passer for, når og hvor gruppen møtes, og hvordan nye deltakere blir med.",
      },
      { id: "kommunikasjon-opplaering", text: "Gi gruppelederne jevnlig opplæring i klubbens kommunikasjonsverktøy." },
      { id: "kommunikasjon-oppdateringer", text: "Sørge for at alle grupper deler oppdateringer om egne aktiviteter gjennom sesongen." },
      {
        id: "kommunikasjon-familiemedlemskap",
        text: "Gjøre familiemedlemskapet bedre kjent og forklare fordelene for både aktive og mindre aktive familiemedlemmer.",
      },
    ],
  },
  {
    id: "drift-og-okonomi",
    title: "Drift og økonomi",
    subgoals: [
      { id: "drift-veldrevet", text: "BOC skal være en veldrevet sykkelklubb med sunn økonomi." },
      { id: "drift-kontinuitet", text: "Klubben skal ha kontinuitet i organisasjonsarbeidet og være rustet til å ta imot flere medlemmer." },
      { id: "drift-oppsparte-midler", text: "Klubbens oppsparte midler skal komme medlemmene til gode over tid." },
    ],
    measures: [
      { id: "drift-videreforing", text: "Sørge for at kunnskap og ansvar blir videreført når tillitsvalgte og frivillige skifter roller." },
      {
        id: "drift-plan-oppsparte-midler",
        text: "Lage en langsiktig plan for bruk av oppsparte midler. Planen bør angi hvor mye klubben trenger i reserve, hvilke satsinger midlene kan brukes til, og hvordan eventuell avkastning skal disponeres.",
      },
    ],
  },
  {
    id: "rammevilkar-for-sykling",
    title: "Rammevilkår for sykling",
    subgoals: [{ id: "rammevilkar-bedre-vilkar", text: "BOC skal bidra til bedre vilkår for sykling generelt og for sykkelsporten på Østlandet spesielt." }],
    measures: [
      { id: "rammevilkar-fora", text: "Representere klubben i relevante fora for sykling og sykkelsport." },
      { id: "rammevilkar-myndigheter", text: "Holde løpende kontakt med offentlige myndigheter, særlig politikere og administrasjonen i Bærum kommune." },
    ],
  },
];

export const QUESTIONS_INTRO = "Disse spørsmålene sto åpne etter strategimøtet. Legg gjerne inn erfaringer og forslag under det aktuelle punktet.";

export const QUESTIONS: StrategyQuestion[] = [
  {
    id: "sporsmal-maling-medlemsutvikling",
    title: "Hvordan skal vi måle medlemsutviklingen?",
    goal: "rekruttering-og-medlemsutvikling",
    body: [
      "Hvordan er medlemmene fordelt på kjønn og alder i dag? Skal vi måle alle registrerte medlemmer eller dem som faktisk deltar i aktivitetene? Før klubben setter konkrete vekstmål, trenger vi et utgangspunkt og en avklaring av om vi skal følge antall, andel eller begge deler.",
    ],
  },
  {
    id: "sporsmal-boc4",
    title: "Hva kan andre grupper lære av BOC4?",
    goal: "rekruttering-og-medlemsutvikling",
    body: [
      "I møtet ble BOC4 trukket fram som en gruppe som har fått flere kvinner med. Har gruppen også fått tidligere passive medlemmer i aktivitet? Hvilke konkrete grep kan andre grupper lære av?",
    ],
  },
  {
    id: "sporsmal-lokale-sykkelgrupper",
    title: "Skal vi ta kontakt med lokale sykkelgrupper?",
    goal: "rekruttering-og-medlemsutvikling",
    body: [
      "Et forslag er å invitere Team Sykkeljentene og You Never Bike Alone til en samtale om muligheten for å drive gruppene som en del av BOC. Ønsker klubben å gå videre med dette?",
    ],
  },
  {
    id: "sporsmal-spinning",
    title: "Hva gjør vi med spinningtilbudet?",
    goal: "trening-og-aktivitet",
    body: ["Forslaget er å avvente styrets beslutning om hva klubben skal gjøre når dagens leieperiode utløper. Deretter kan klubben ta stilling til det videre spinningtilbudet."],
  },
  {
    id: "sporsmal-oppsparte-midler",
    title: "Hvem skal behandle planen for oppsparte midler?",
    goal: "drift-og-okonomi",
    body: [
      "Steinar Hillestad foreslår at styret utarbeider planen for reserve, satsinger og bruk av eventuell avkastning, og at planen legges fram for årsmøtet til vedtak. Skal klubben følge denne prosessen?",
    ],
  },
  {
    id: "sporsmal-samarbeid-klubber",
    title: "Skal samarbeid med andre klubber inn som et fast tiltak?",
    goal: "rammevilkar-for-sykling",
    body: [
      "Forslaget er å utveksle erfaringer med andre sykkelklubber om organisering, administrasjon, trening og aktivitet. ACK og Rye ble nevnt som mulige samarbeidspartnere. Ønsker klubben å ta dette inn som et tiltak under mål 6?",
    ],
  },
];

export const GENERAL: StrategyPoint & { heading: string; paragraphs: string[] } = {
  id: "generelle-kommentarer",
  heading: "Generelle kommentarer",
  text: "Generelle kommentarer",
  paragraphs: ["Bruk denne tråden til innspill som gjelder strategien som helhet eller går på tvers av flere mål."],
};

/** «Mål 3 – Bærum Sykkelpark og klubbhuset»: the number is the goal's place in GOALS. */
export function goalNumber(goalId: string): number {
  return GOALS.findIndex((g) => g.id === goalId) + 1;
}

export function goalHeading(goal: StrategyGoal): string {
  return `Mål ${goalNumber(goal.id)} – ${goal.title}`;
}

/** Every point with a thread, in reading order, with the short label used above its thread and in the server check. */
export function strategyPoints(): { id: string; label: string; formerIds: string[] }[] {
  const out: { id: string; label: string; formerIds: string[] }[] = [];
  const add = (p: { id: string; formerIds?: string[] }, label: string) => out.push({ id: p.id, label, formerIds: p.formerIds ?? [] });
  add(IDEA, IDEA.heading);
  add(VALUES, VALUES.heading);
  for (const g of GOALS) {
    add(g, goalHeading(g));
    g.subgoals.forEach((p, i) => add(p, `Mål ${goalNumber(g.id)}, delmål ${i + 1}`));
    g.measures.forEach((p, i) => add(p, `Mål ${goalNumber(g.id)}, tiltak ${i + 1}`));
  }
  QUESTIONS.forEach((q, i) => add(q, `Spørsmål ${i + 1}`));
  add(GENERAL, GENERAL.heading);
  return out;
}

/** The current id for an id or a former one, or null when no point has it. */
export function resolvePointId(id: string): string | null {
  for (const p of strategyPoints()) if (p.id === id || p.formerIds.includes(id)) return p.id;
  return null;
}

/** Which goal a point belongs to (the goal's own id gives itself), for opening a folded goal on a direct link. */
export function goalOfPoint(id: string): string | null {
  for (const g of GOALS) if (g.id === id || g.subgoals.some((p) => p.id === id) || g.measures.some((p) => p.id === id)) return g.id;
  return null;
}
