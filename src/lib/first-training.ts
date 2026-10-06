import { contactsFor, fullName, membershipTitle } from "./content";
import type { Org } from "./org";
import { relevantTo, weeklySessions } from "./activities";
import { addDays, minutesOf, weekdayOf } from "./dates";
import type { ClockTime, Db, FirstTrainingFacts, ISODate, LocalDateTime } from "./types";
import { meetTimes } from "./views";

export interface FirstTrainingItem {
  id: string;
  label: string;
  value: string | string[];
  /** A link under the answer: the Spond group, under «Spond før første trening». */
  action?: { href: string; label: string };
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
 * A group with its own join wizard (Zwift) gets no list: the wizard is it.
 *
 * - Når og hvor: the weekly sessions merged per meeting point (meetTimes).
 * - Hvor lenge: from the sessions' start and end, as a span when they differ.
 * - Tempo, distanse, når du bør komme, påmelding, utstyr, medlemskap:
 *   OrgNode.firstTraining, the nearest level that sets each one.
 * - Se etter: firstTraining.lookFor where it is not a person (Zwift), or
 *   else the group's own coaches under the club's word for them (leadTitle,
 *   e.g. Road Captain).
 * - Hvis du ikke henger med: firstTraining.keepUp only — what happens when
 *   the pace is too high. Never a fallback: an answer about punctures does
 *   not answer it.
 * Punctures and technical trouble are not repeated here: the riding rule
 * «Ingen blir igjen» further down the page answers it.
 */
export function firstTrainingFor(db: Db, org: Org, nodeId: string, today: ISODate): FirstTrainingItem[] {
  // A group that walks newcomers through joining step by step (participation.wizard, Zwift) has its answers there.
  if (org.get(nodeId)?.participation?.wizard) return [];
  const lineage = org.lineage(nodeId).reverse();
  // The nearest level that sets the fact wins; an empty string there means «not for this group» and stops the inheritance.
  const fact = (key: keyof FirstTrainingFacts) => lineage.find((n) => n.firstTraining?.[key] !== undefined)?.firstTraining?.[key] || undefined;

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

  // The Spond group the group's members are in, nearest first (its own link, or a joinGroup above it).
  const spondUrl = lineage.flatMap((n) => [...(n.externalLinks ?? []), ...(n.joinGroup ? [n.joinGroup] : [])]).find((l) => l.kind === "spond")?.url;

  const items: (FirstTrainingItem | undefined)[] = [
    sessions.length ? { id: "tid", label: "Når og hvor", value: meetTimes(db, org, nodeId, today) } : undefined,
    length ? { id: "varighet", label: "Hvor lenge", value: length } : undefined,
    ...(
      [
        ["pace", "Tempo"],
        ["distance", "Distanse"],
        ["arrive", "Når du bør komme"],
        ["signUp", "Påmelding"],
        ["spondFirstTime", "Spond før første trening"],
        ["bring", "Ta med"],
      ] as const
    ).map(([key, label]) => {
      const value = fact(key);
      if (!value) return undefined;
      return key === "spondFirstTime" && spondUrl ? { id: key, label, value, action: { href: spondUrl, label: "Se når og hvor på Spond" } } : { id: key, label, value };
    }),
    fact("lookFor") || lookFor ? { id: "se-etter", label: "Se etter", value: fact("lookFor") ?? lookFor! } : undefined,
    fact("keepUp") ? { id: "henger-med", label: "Hvis du ikke henger med", value: fact("keepUp")! } : undefined,
    fact("trial") ? { id: "medlemskap", label: "Medlemskap", value: fact("trial")! } : undefined,
  ];
  return items.filter((i): i is FirstTrainingItem => !!i);
}

/** One fact for a compact summary (the finder's result): the nearest level's value. */
export function firstTrainingFact(org: Org, nodeId: string, key: keyof FirstTrainingFacts): string | undefined {
  return (
    org
      .lineage(nodeId)
      .reverse()
      .find((n) => n.firstTraining?.[key] !== undefined)?.firstTraining?.[key] || undefined
  );
}

export interface NextTraining {
  date: ISODate;
  start: ClockTime;
  startApprox?: boolean;
  title: string;
  place?: string;
}

/**
 * «Neste trening»: the next ordinary session someone could come to as their
 * first, as distinct from the next activity (a race, a camp, Mallorca).
 *
 * Worked out from what the site already has, nothing added: the weekly
 * series (weekday, the dates it runs between, its cancellations) walked
 * forward from today, skipping today's session once it has started, and
 * any dated activity of kind «training». The earliest wins. A group with
 * neither gets none, and its page shows the next activity as before; so
 * does a group whose newcomers start with a course or a recruit day
 * (OrgNode.newcomersStartElsewhere).
 * Looks at most eight weeks ahead, so a group between seasons shows none
 * rather than one far off.
 */
export function nextTrainingFor(db: Db, org: Org, nodeId: string, today: ISODate, now: LocalDateTime): NextTraining | undefined {
  if (org.lineage(nodeId).some((n) => n.newcomersStartElsewhere)) return undefined;
  const clock = now.slice(11, 16);
  const venueName = (id?: string) => db.venues.find((v) => v.id === id)?.name;
  const candidates: NextTraining[] = [];

  const series = weeklySessions(db.series, org, nodeId, today);
  for (let i = 0; i < 56 && !candidates.length; i++) {
    const date = addDays(today, i);
    for (const s of series) {
      if (s.weekday !== weekdayOf(date) || date < s.from || date > s.to) continue;
      if (i === 0 && minutesOf(s.start) <= minutesOf(clock)) continue;
      candidates.push({ date, start: s.start, startApprox: s.startApprox, title: s.title, place: venueName(s.venueId) ?? s.locationNote });
    }
  }

  for (const a of relevantTo(db.activities, org, nodeId)) {
    if (a.kind !== "training" || a.date < today) continue;
    if (a.date === today && minutesOf(a.start) <= minutesOf(clock)) continue;
    candidates.push({ date: a.date, start: a.start, title: a.title, place: venueName(a.venueId) ?? a.locationNote });
  }

  return candidates.sort((a, b) => a.date.localeCompare(b.date) || minutesOf(a.start) - minutesOf(b.start))[0];
}
