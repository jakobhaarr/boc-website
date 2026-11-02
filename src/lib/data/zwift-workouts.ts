/**
 * The ten workouts the Zwift group usually picks from, for its training-plan
 * presentation (/presentasjon/zwift-treningsplan).
 *
 * Source: the workout's own page on whatsonzwift.com (checked 2 November 2026),
 * the community site that mirrors Zwift's library. Typed in from it:
 *   · `folder` and `group`: where the page files the workout, which is the
 *     folder it sits in under Workouts in Zwift. Zwift moves workouts between
 *     folders now and then, so this is where to look first, not a promise.
 *   · `steps`: the page's list of intervals, word for word («2x 2min @ 90% FTP,
 *     2min @ 80% FTP»). The profile charts are drawn from them (parseSteps).
 *   · `stress` and `zones`: the page's «Stress points» and «Zone distribution»
 *     (minutes in Z1 to Z6), as the page shows them. Not computed here.
 *   · `summary`: written for the deck from the page's description, not copied.
 *
 * Derived (computed, not typed in):
 *   seconds = Σ the steps' durations (parseSteps), shown as hours and minutes
 *   zone of a step = the zone its % of FTP falls in (zoneOf)
 * Intensity is always % of FTP, so the plan works for every rider whatever
 * their FTP is; the Training window turns it into watts from the rider's own.
 */

export interface ZwiftWorkout {
  name: string;
  folder: string;
  /** A sub-heading inside the folder, where whatsonzwift has one. */
  group?: string;
  /** whatsonzwift's «Stress points». */
  stress: number;
  /** Minutes in Z1 to Z6, from whatsonzwift. */
  zones: [number, number, number, number, number, number];
  /** The page's intervals, one line per block, as written there. */
  steps: string[];
  /** What the workout is, in a sentence or two. */
  summary: string;
  /** What to look out for, short. */
  facts: string[];
  /** The page on whatsonzwift.com, without the host. */
  page: string;
}

export const ZWIFT_WORKOUTS: ZwiftWorkout[] = [
  {
    name: "6x2 VO2 Max",
    folder: "VO2 Max",
    stress: 77,
    zones: [39, 2, 3, 2, 2, 14],
    steps: [
      "9min from 45 to 65% FTP",
      "3x 1min @ 85% FTP, 1min @ 55% FTP",
      "40sec @ 90% FTP",
      "40sec @ 105% FTP",
      "40sec @ 120% FTP",
      "2min @ 55% FTP",
      "40sec @ 90% FTP",
      "40sec @ 105% FTP",
      "40sec @ 120% FTP",
      "2min @ 55% FTP",
      "40sec @ 90% FTP",
      "40sec @ 105% FTP",
      "40sec @ 120% FTP",
      "2min @ 55% FTP",
      "3min @ 55% FTP",
      "2min @ 120% FTP",
      "2min @ 50% FTP",
      "5x 2min @ 120% FTP, 2min @ 50% FTP",
      "2min @ 50% FTP",
      "6min from 55 to 45% FTP",
    ],
    summary: "Seks drag på to minutter på 120 % av FTP, med to minutter pause mellom. De hardeste sammenhengende innsatsene i planen den er hentet fra.",
    facts: ["Hold kadensen høy, så ruller ikke trenaren deg ned", "Lang oppvarming med tre korte trappetrinn først"],
    page: "/workouts/vo2-max/6x2-vo2-max",
  },
  {
    name: "Chase the Chaise",
    folder: "60-90 minutes to burn",
    stress: 64,
    zones: [19, 0, 20, 23, 0, 0],
    steps: [
      "5min from 35 to 55% FTP",
      "5x 30sec @ 100% FTP, 30sec @ 55% FTP",
      "2x 2min @ 90% FTP, 2min @ 80% FTP",
      "2min @ 55% FTP",
      "2x 2min @ 90% FTP, 2min @ 80% FTP",
      "2min @ 55% FTP",
      "2x 2min @ 90% FTP, 2min @ 80% FTP",
      "2min @ 55% FTP",
      "2x 2min @ 90% FTP, 2min @ 80% FTP",
      "2min @ 55% FTP",
      "2x 2min @ 90% FTP, 2min @ 80% FTP",
      "3min from 50 to 30% FTP",
    ],
    summary: "En «opp og ned»-økt: to minutter litt over og to minutter litt under farten du kan holde på lange turer, fem ganger. Laget for gravel, men like god for terskelfarten.",
    facts: ["Fem blokker à åtte minutter", "Fem korte drag på 100 % i starten"],
    page: "/workouts/60-90-minutes-to-burn/chase-the-chaise",
  },
  {
    name: "FTP Development",
    folder: "Best of Zwift Academy",
    group: "ZA 2019",
    stress: 74,
    zones: [27, 6, 2, 11, 15, 0],
    steps: [
      "9min from 50 to 75% FTP",
      "2min @ 80% FTP",
      "30sec @ 104% FTP",
      "30sec @ 50% FTP",
      "30sec @ 106% FTP",
      "30sec @ 50% FTP",
      "30sec @ 108% FTP",
      "2min @ 50% FTP",
      "5min @ 103% FTP",
      "3min @ 45% FTP",
      "5min @ 103% FTP",
      "3min @ 45% FTP",
      "4min @ 105% FTP",
      "3min @ 45% FTP",
      "4min @ 105% FTP",
      "3min @ 45% FTP",
      "3min @ 107% FTP",
      "2min @ 45% FTP",
      "3min @ 107% FTP",
      "2min @ 40% FTP",
      "5min from 60 to 45% FTP",
    ],
    summary: "Lange intervaller på tre til fem minutter, rett over FTP: jo kortere drag, jo hardere. Økta ligger mellom terskel og VO2-max.",
    facts: ["Fra 103 % på fem minutter til 107 % på tre", "Bruker lang tid rett over terskel"],
    page: "/workouts/best-of-zwift-academy/za-2019-ftp-development",
  },
  {
    name: "Hang Ten",
    folder: "60-90 minutes to burn",
    stress: 65,
    zones: [10, 15, 20, 10, 5, 0],
    steps: [
      "5min from 25 to 60% FTP",
      "5min @ 60% FTP",
      "1min @ 90rpm, 95% FTP",
      "2min @ 90rpm, 80% FTP",
      "1min @ 90rpm, 110% FTP",
      "2min @ 90rpm, 80% FTP",
      "1min @ 90rpm, 95% FTP",
      "2min @ 85rpm, 60% FTP",
      "1min @ 60rpm, 95% FTP",
      "2min @ 60rpm, 80% FTP",
      "1min @ 60rpm, 110% FTP",
      "2min @ 60rpm, 80% FTP",
      "1min @ 60rpm, 95% FTP",
      "2min @ 85rpm, 60% FTP",
      "1min @ 90rpm, 95% FTP",
      "2min @ 90rpm, 80% FTP",
      "1min @ 90rpm, 110% FTP",
      "2min @ 90rpm, 80% FTP",
      "1min @ 90rpm, 95% FTP",
      "2min @ 85rpm, 60% FTP",
      "1min @ 60rpm, 95% FTP",
      "2min @ 60rpm, 80% FTP",
      "1min @ 60rpm, 110% FTP",
      "2min @ 60rpm, 80% FTP",
      "1min @ 60rpm, 95% FTP",
      "2min @ 85rpm, 60% FTP",
      "1min @ 100rpm, 95% FTP",
      "2min @ 80% FTP",
      "1min @ 110rpm, 110% FTP",
      "2min @ 80% FTP",
      "1min @ 90rpm, 95% FTP",
      "2min @ 85rpm, 60% FTP",
      "5min from 60 to 25% FTP",
    ],
    summary: "Intervaller som former en bølge: opp til 110 % i ett minutt, ned på 80 %, og tilbake igjen. Kadensen skifter mellom 60 og 110 rpm.",
    facts: ["Kadens fra 60 til 110 rpm", "Fem topper på 110 %"],
    page: "/workouts/60-90-minutes-to-burn/hang-ten",
  },
  {
    name: "Norseman workout: Geilo",
    folder: "Climbing",
    stress: 70,
    zones: [13, 22, 12, 9, 4, 2],
    steps: [
      "8min from 55 to 75% FTP",
      "4x 20sec @ 90% FTP, 40sec @ 55% FTP",
      "3min @ 50% FTP",
      "4min @ 65% FTP",
      "3min @ 81% FTP",
      "2min @ 95% FTP",
      "1min @ 109% FTP",
      "30sec @ 125% FTP",
      "4min @ 65% FTP",
      "3min @ 81% FTP",
      "2min @ 95% FTP",
      "1min @ 109% FTP",
      "30sec @ 125% FTP",
      "4min @ 65% FTP",
      "3min @ 81% FTP",
      "2min @ 95% FTP",
      "1min @ 109% FTP",
      "30sec @ 125% FTP",
      "4min @ 65% FTP",
      "3min @ 81% FTP",
      "2min @ 95% FTP",
      "1min @ 109% FTP",
      "30sec @ 125% FTP",
      "6min from 60 to 45% FTP",
    ],
    summary: "Fire stigninger på ti og et halvt minutt, der hver bygger seg opp og er hardest helt på slutten. Fra Norseman-serien, og en god økt for rolig og jevn sittende klatring.",
    facts: ["Hver stigning: 65, 81, 95, 109 og til slutt 125 %", "Øv på rolig pedaling og god sittestilling"],
    page: "/workouts/climbing/norseman-workout-geilo",
  },
  {
    name: "Going Up The Zones",
    folder: "60-90 minutes to burn",
    stress: 61,
    zones: [25, 4, 17, 12, 3, 0],
    steps: [
      "6min from 45 to 65% FTP",
      "4x 30sec @ 80% FTP, 30sec @ 60% FTP",
      "4min @ 80% FTP",
      "30sec @ 50% FTP",
      "3min @ 90% FTP",
      "30sec @ 50% FTP",
      "2min @ 100% FTP",
      "30sec @ 50% FTP",
      "1min @ 110% FTP",
      "5min @ 55% FTP",
      "4min @ 80% FTP",
      "15sec @ 50% FTP",
      "3min @ 90% FTP",
      "15sec @ 50% FTP",
      "2min @ 100% FTP",
      "15sec @ 50% FTP",
      "1min @ 110% FTP",
      "5min @ 55% FTP",
      "4min @ 77% FTP",
      "3min @ 85% FTP",
      "2min @ 95% FTP",
      "1min @ 105% FTP",
      "7min 45sec from 55 to 45% FTP",
    ],
    summary: "Trappetrinn opp til og over terskel: fire, tre, to og ett minutt, hver hardere enn den forrige. Pausene blir kortere for hver runde, og den siste runden har ingen.",
    facts: ["Pause på 30 sekunder, så 15, så ingen", "Typisk innsats i gravel-ritt"],
    page: "/workouts/60-90-minutes-to-burn/going-up-the-zones",
  },
  {
    name: "Lactate Shuttle #1",
    folder: "60-90 minutes to burn",
    stress: 76,
    zones: [20, 11, 5, 18, 7, 0],
    steps: [
      "3min @ 50% FTP",
      "1min @ 60% FTP",
      "1min @ 65% FTP",
      "1min @ 81% FTP",
      "1min @ 106% FTP",
      "2min @ 50% FTP",
      "4min @ 85% FTP",
      "3min @ 50% FTP",
      "3min @ 110% FTP",
      "1min @ 50% FTP",
      "6x 1min 30sec @ 103% FTP, 45sec @ 65% FTP",
      "5min @ 50% FTP",
      "3min @ 110% FTP",
      "1min @ 50% FTP",
      "6x 1min 30sec @ 103% FTP, 45sec @ 65% FTP",
      "5min @ 50% FTP",
    ],
    summary: "Et langt drag på 110 % etterfulgt av seks korte drag rett over FTP, to ganger. Trener kroppen til å tåle og bruke melkesyre over tid.",
    facts: ["To runder: tre minutter på 110 %, så 6 × 1:30 på 103 %", "Bare 45 sekunder pause mellom dragene"],
    page: "/workouts/60-90-minutes-to-burn/lactate-shuttle-1",
  },
  {
    name: "Sneaky",
    folder: "60-90 minutes to burn",
    stress: 56,
    zones: [18, 10, 24, 8, 0, 0],
    steps: [
      "5min from 40 to 60% FTP",
      "5min @ 95rpm, 60% FTP",
      "3min @ 90rpm, 80% FTP",
      "1min @ 90rpm, 95% FTP",
      "1min @ 85rpm, 55% FTP",
      "3min @ 60rpm, 80% FTP",
      "1min @ 60rpm, 95% FTP",
      "1min @ 85rpm, 55% FTP",
      "3min @ 90rpm, 80% FTP",
      "1min @ 90rpm, 95% FTP",
      "1min @ 85rpm, 55% FTP",
      "3min @ 60rpm, 80% FTP",
      "1min @ 60rpm, 95% FTP",
      "1min @ 85rpm, 55% FTP",
      "3min @ 90rpm, 80% FTP",
      "1min @ 90rpm, 95% FTP",
      "1min @ 85rpm, 55% FTP",
      "3min @ 60rpm, 80% FTP",
      "1min @ 60rpm, 95% FTP",
      "1min @ 85rpm, 55% FTP",
      "3min @ 90rpm, 80% FTP",
      "1min @ 90rpm, 95% FTP",
      "1min @ 85rpm, 55% FTP",
      "3min @ 60rpm, 80% FTP",
      "30sec @ 100rpm, 95% FTP",
      "30sec from 95 to 120% FTP",
      "1min @ 85rpm, 55% FTP",
      "5min @ 90rpm, 60% FTP",
      "5min from 60 to 40% FTP",
    ],
    summary: "Fem runder med tre minutter på 80 % og ett minutt på 95 %, vekselvis med 90 og 60 rpm. Den siste runden slutter i en sprint opp mot 120 %, og det er den som tar deg.",
    facts: ["Kadensen skifter mellom 90 og 60 rpm", "Siste drag stiger fra 95 til 120 %"],
    page: "/workouts/60-90-minutes-to-burn/sneaky",
  },
  {
    name: "The Egyptian",
    folder: "60-90 minutes to burn",
    stress: 74,
    zones: [20, 19, 16, 12, 3, 0],
    steps: [
      "7min from 44 to 75% FTP",
      "30sec @ 109% FTP",
      "3min @ 50% FTP",
      "30sec @ 109% FTP",
      "4min @ 50% FTP",
      "4min @ 65rpm, 75% FTP",
      "4min @ 110rpm, 81% FTP",
      "3min @ 95% FTP",
      "1min @ 70rpm, 109% FTP",
      "3min @ 95% FTP",
      "4min @ 81% FTP",
      "4min @ 75% FTP",
      "4min @ 50% FTP",
      "4min @ 65rpm, 75% FTP",
      "4min @ 110rpm, 81% FTP",
      "3min @ 95% FTP",
      "1min @ 70rpm, 109% FTP",
      "3min @ 95% FTP",
      "4min @ 81% FTP",
      "4min @ 75% FTP",
      "5min @ 50% FTP",
    ],
    summary: "En pyramide som bygger seg opp til ett minutt på 109 % ved 70 rpm, og ned igjen, to ganger. Fra Dirt Destroyer-planen. Trener utholdenhet og styrke.",
    facts: ["Toppen er ett minutt på 109 % ved 70 rpm", "Kadens fra 65 til 110 rpm"],
    page: "/workouts/60-90-minutes-to-burn/the-egyptian",
  },
  {
    name: "The McCarthy Special",
    folder: "60-90 minutes to burn",
    stress: 90,
    zones: [11, 22, 0, 9, 9, 9],
    steps: [
      "10min from 30 to 70% FTP",
      "3min @ 100% FTP",
      "3min @ 112% FTP",
      "3min @ 125% FTP",
      "9min @ 60% FTP",
      "3min @ 100% FTP",
      "3min @ 112% FTP",
      "3min @ 125% FTP",
      "9min @ 60% FTP",
      "3min @ 100% FTP",
      "3min @ 112% FTP",
      "3min @ 125% FTP",
      "5min from 70 to 30% FTP",
    ],
    summary: "Tre blokker med tre minutter på 100, 112 og 125 % av FTP, med ni minutter rolig imellom. Mye anaerobt arbeid som ligner slutten av et ritt.",
    facts: ["Høyest stresspoeng av de ti", "Ni minutter på 60 % mellom blokkene"],
    page: "/workouts/60-90-minutes-to-burn/the-mccarthy-special",
  },
];

export interface Segment {
  /** Seconds the block lasts. */
  sec: number;
  /** % of FTP at the start and the end of the block (equal unless it is a ramp). */
  from: number;
  to: number;
  /** Cadence, where the page asks for one. */
  rpm?: number;
}

/** «7min 45sec», «40sec», «3min» to seconds. */
function seconds(text: string): number {
  const m = /^(?:(\d+)min)?\s*(?:(\d+)sec)?$/.exec(text.trim());
  if (!m || (m[1] === undefined && m[2] === undefined)) throw new Error(`Unreadable duration: «${text}»`);
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

/** One line of the interval list: the blocks in it and how many times over. */
export interface Block {
  count: number;
  parts: Segment[];
}

/**
 * One line of whatsonzwift's interval list to blocks. The shapes it has:
 *   «5min from 35 to 55% FTP»                      a ramp
 *   «2min @ 55% FTP»                               a steady block
 *   «1min @ 90rpm, 95% FTP»                        a steady block with a cadence
 *   «5x 30sec @ 100% FTP, 30sec @ 55% FTP»         the blocks after «Nx», N times over
 */
export function parseBlock(line: string): Block {
  const repeat = /^(\d+)x\s+(.*)$/.exec(line);
  const count = repeat ? Number(repeat[1]) : 1;
  const body = (repeat ? repeat[2] : line).replace(/%\s*FTP/g, "% FTP");
  // Parts are cut where the next one starts with a duration, so the comma in «90rpm, 95%» stays.
  const parts = body.split(/,\s+(?=\d+(?:min|sec))/).map((part): Segment => {
    const ramp = /^(.+?)\s+from\s+(\d+)\s+to\s+(\d+)% FTP$/.exec(part);
    if (ramp) return { sec: seconds(ramp[1]), from: Number(ramp[2]), to: Number(ramp[3]) };
    const flat = /^(.+?)\s+@\s+(?:(\d+)rpm,\s*)?(\d+)% FTP$/.exec(part);
    if (flat) return { sec: seconds(flat[1]), from: Number(flat[3]), to: Number(flat[3]), rpm: flat[2] ? Number(flat[2]) : undefined };
    throw new Error(`Unreadable interval: «${line}»`);
  });
  return { count, parts };
}

/** One line as the blocks it comes to, the repeats written out. */
export function parseStep(line: string): Segment[] {
  const { count, parts } = parseBlock(line);
  return Array.from({ length: count }, () => parts).flat();
}

export const parseSteps = (steps: string[]): Segment[] => steps.flatMap(parseStep);

export const workoutSeconds = (w: ZwiftWorkout) => parseSteps(w.steps).reduce((sum, s) => sum + s.sec, 0);

/**
 * Zwift's power zones as whatsonzwift's zone minutes count them (checked
 * against all ten pages): Z1 under 60 % of FTP, Z2 60–75, Z3 76–89, Z4 90–104,
 * Z5 105–119, Z6 120 and over. Zero-based, so Z1 is 0.
 */
export function zoneOf(pct: number): number {
  if (pct < 60) return 0;
  if (pct < 76) return 1;
  if (pct < 90) return 2;
  if (pct < 105) return 3;
  if (pct < 120) return 4;
  return 5;
}

/** The workout's name as an address: «Chase the Chaise» is «chase-the-chaise». Ids on the Zwift decks' slides and cards. */
export const workoutSlug = (w: ZwiftWorkout) => w.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Zone names for the key; the numbers are Zwift's. */
export const ZONE_NAMES = ["Rolig", "Utholdenhet", "Tempo", "Terskel", "VO2-max", "Anaerob"] as const;

/** Where to find the workout in Zwift: the steps under Workouts, in the order of the Training window. */
export const zwiftPath = (w: ZwiftWorkout) => ["Menu", "Workouts", w.folder, ...(w.group ? [w.group] : []), w.name];
