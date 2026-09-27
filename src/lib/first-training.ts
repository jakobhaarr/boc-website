import { contactsFor, fullName, membershipTitle } from "./content";
import type { Org } from "./org";
import { weeklySessions } from "./activities";
import type { Db, FirstTrainingFacts, ISODate } from "./types";
import { meetTimes } from "./views";

export interface FirstTrainingItem {
  id: string;
  label: string;
  value: string | string[];
}

const listOf = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} eller ${items.at(-1)}` : (items[0] ?? ""));
const minutes = (clock: string) => Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5));
/** 75 → «1 time og 15 min», 120 → «2 timer». */
const duration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return [h ? `${h} ${h === 1 ? "time" : "timer"}` : "", m ? `${m} min` : ""].filter(Boolean).join(" og ");
};

/**
 * «Før første trening»: the small questions someone has before turning up
 * to a group where they know nobody, answered from what the club has
 * published and nothing else. A fact the club has not given is left out.
 *
 * - Når og hvor: the weekly sessions merged per meeting point (meetTimes).
 * - Hvor lenge: from the sessions' start and end, as a span when they differ.
 * - Tempo, distanse, når du bør komme, påmelding, utstyr, medlemskap:
 *   OrgNode.firstTraining, the nearest level that sets each one.
 * - Se etter: firstTraining.lookFor where it is not a person (Zwift), or
 *   else the group's own coaches under the club's word for them (leadTitle,
 *   e.g. Road Captain).
 * - Hvis du ikke henger med: firstTraining.keepUp, or else the riding rule
 *   marked «wait» (BOC's «Ingen blir igjen»).
 */
export function firstTrainingFor(db: Db, org: Org, nodeId: string, today: ISODate): FirstTrainingItem[] {
  const lineage = org.lineage(nodeId).reverse();
  const fact = (key: keyof FirstTrainingFacts) => lineage.find((n) => n.firstTraining?.[key])?.firstTraining?.[key];

  const sessions = weeklySessions(db.series, org, nodeId, today);
  // «2–3 timer» when the sessions are whole hours, «75–90 min» when none runs past two hours, «1 time og 15 min til 3 timer» otherwise.
  const lengths = [...new Set(sessions.map((s) => minutes(s.end) - minutes(s.start)))].filter((m) => m > 0).sort((a, b) => a - b);
  const [shortest, longest] = [lengths[0], lengths.at(-1)];
  const length = !lengths.length
    ? undefined
    : shortest === longest
      ? duration(shortest)
      : shortest % 60 === 0 && longest! % 60 === 0
        ? `${shortest / 60}–${longest! / 60} timer`
        : longest! <= 120
          ? `${shortest}–${longest} min`
          : `${duration(shortest)} til ${duration(longest!)}`;

  const leadTitle = lineage.find((n) => n.leadTitle)?.leadTitle;
  const leads = contactsFor(db, org, nodeId).filter((c) => !c.inherited && ["headCoach", "coach", "teamManager"].includes(c.membership.role));
  const names = leads.map((c) => fullName(c.person));
  const lookFor = leads.length
    ? `${leadTitle ?? membershipTitle(leads[0].membership.role, leads[0].membership.title)}: ${listOf(names.slice(0, 3))}${names.length > 3 ? " og de andre i gruppa" : ""}`
    : undefined;

  const waitRule = lineage.find((n) => n.ridingRules?.some((r) => r.icon === "wait"))?.ridingRules?.find((r) => r.icon === "wait");

  const items: (FirstTrainingItem | undefined)[] = [
    sessions.length ? { id: "tid", label: "Når og hvor", value: meetTimes(db, org, nodeId, today) } : undefined,
    length ? { id: "varighet", label: "Hvor lenge", value: length } : undefined,
    ...(
      [
        ["pace", "Tempo"],
        ["distance", "Distanse"],
        ["arrive", "Når du bør komme"],
        ["signUp", "Påmelding"],
        ["bring", "Ta med"],
      ] as const
    ).map(([key, label]) => {
      const value = fact(key);
      return value ? { id: key, label, value } : undefined;
    }),
    fact("lookFor") || lookFor ? { id: "se-etter", label: "Se etter", value: fact("lookFor") ?? lookFor! } : undefined,
    fact("keepUp") || waitRule ? { id: "henger-med", label: "Hvis du ikke henger med", value: fact("keepUp") ?? waitRule!.text } : undefined,
    fact("trial") ? { id: "medlemskap", label: "Medlemskap", value: fact("trial")! } : undefined,
  ];
  return items.filter((i): i is FirstTrainingItem => !!i);
}

/** One fact for a compact summary (the finder's result): the nearest level's value. */
export function firstTrainingFact(org: Org, nodeId: string, key: keyof FirstTrainingFacts): string | undefined {
  return org
    .lineage(nodeId)
    .reverse()
    .find((n) => n.firstTraining?.[key])?.firstTraining?.[key];
}
