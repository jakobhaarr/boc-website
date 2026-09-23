import { minutesOf } from "./dates";
import type { Org } from "./org";
import type { Activity, ActivityKind, ActivityPerson, Db, ISODate, TrainingSeries } from "./types";

export const KIND_LABEL: Record<ActivityKind, string> = {
  training: "Trening",
  match: "Kamp",
  race: "Konkurranse",
  event: "Arrangement",
  volunteer: "Dugnad",
  camp: "Samling",
};

export const byStart = (a: Activity, b: Activity) =>
  a.date.localeCompare(b.date) || minutesOf(a.start) - minutesOf(b.start) || a.nodeId.localeCompare(b.nodeId);

/** Still to come — a multi-day cup counts as upcoming until its last day. */
export function upcoming(list: Activity[], today: ISODate, days?: number): Activity[] {
  const end = days === undefined ? "9999" : addDaysLoose(today, days);
  return list.filter((a) => (a.endDate ?? a.date) >= today && a.date <= end).sort(byStart);
}

export function past(list: Activity[], today: ISODate): Activity[] {
  return list.filter((a) => (a.endDate ?? a.date) < today).sort((a, b) => byStart(b, a));
}

function addDaysLoose(iso: ISODate, n: number): ISODate {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function groupByDate(list: Activity[]): { date: ISODate; items: Activity[] }[] {
  const out: { date: ISODate; items: Activity[] }[] = [];
  for (const a of [...list].sort(byStart)) {
    const last = out[out.length - 1];
    if (last?.date === a.date) last.items.push(a);
    else out.push({ date: a.date, items: [a] });
  }
  return out;
}

/** Activities on a node or anywhere below it. */
export function inSubtree(list: Activity[], org: Org, nodeId: string): Activity[] {
  const ids = org.subtree(nodeId);
  return list.filter((a) => ids.has(a.nodeId));
}

/**
 * What a member of a group should see: their own activities, anything below,
 * and shared sessions set up one level up (e.g. "Felles J16-trening" on J16-2).
 */
export function relevantTo(list: Activity[], org: Org, nodeId: string): Activity[] {
  const ids = org.subtree(nodeId);
  for (const n of org.lineage(nodeId)) if (n.kind === "ageGroup" || n.kind === "discipline") ids.add(n.id);
  return list.filter((a) => ids.has(a.nodeId));
}

export interface Headline {
  title: string;
  subtitle: string;
}

/** "J16-2 – Lyn" for matches; group name + session title for training. */
export function headline(a: Activity, org: Org): Headline {
  const node = org.get(a.nodeId);
  const name = node?.name ?? "";
  if (a.kind === "match" && a.opponent) {
    return {
      title: a.home ? `${name} – ${a.opponent}` : `${a.opponent} – ${name}`,
      subtitle: a.title,
    };
  }
  if (a.kind === "training") return { title: a.title === "Trening" ? name : a.title, subtitle: a.title === "Trening" ? "Trening" : name };
  return { title: a.title, subtitle: node?.kind === "club" ? "Hele klubben" : name };
}

export function result(a: Activity): { label: string; outcome: "win" | "loss" | "draw" } | null {
  if (!a.result) return null;
  const { us, them } = a.result;
  return {
    label: a.home ? `${us}–${them}` : `${them}–${us}`,
    outcome: us > them ? "win" : us < them ? "loss" : "draw",
  };
}

/** Named people in an activity slot, plus how many anonymous slots remain. */
export function peopleFor(a: Activity, db: Db, role: ActivityPerson["role"]) {
  const slots = (a.people ?? []).filter((p) => p.role === role);
  const named = slots.flatMap((p) => {
    const person = p.personId ? db.people.find((x) => x.id === p.personId) : undefined;
    return person && person.privacy.status === "visible"
      ? [{ name: `${person.firstName} ${person.lastName}`, count: p.count }]
      : [];
  });
  return { named, hidden: slots.length - named.length };
}

/** Weekly sessions for a group that are still running. */
export function weeklySessions(series: TrainingSeries[], org: Org, nodeId: string, today: ISODate) {
  const ids = new Set(org.lineage(nodeId).filter((n) => n.kind !== "club" && n.kind !== "sport").map((n) => n.id));
  return series
    .filter((s) => ids.has(s.nodeId) && s.to >= today)
    .sort((a, b) => a.weekday - b.weekday || minutesOf(a.start) - minutesOf(b.start));
}
