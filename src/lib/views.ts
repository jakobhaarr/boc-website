import { headline, KIND_LABEL, peopleFor, result, weeklySessions } from "./activities";
import { articleHref, authorLine, photoById } from "./content";
import { formatTime, relativeTime, weekdayName } from "./dates";
import { trailLabel, type Org } from "./org";
import { plain } from "./rich-text";
import type {
  Activity,
  ActivityKind,
  Article,
  ClockTime,
  Db,
  ExternalLink,
  ISODate,
  LocalDateTime,
  Photo,
} from "./types";

/**
 * Serializable view models shared by server-rendered pages and client
 * components (calendar filtering, composer preview).
 */

export const mapUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

function joinNames(parts: string[], hidden: number, noun: string): string {
  const all = [...parts];
  if (hidden > 0) all.push(parts.length ? (hidden === 1 ? "én til" : `${hidden} til`) : hidden === 1 ? `én ${noun}` : `${hidden} ${noun}er`);
  if (all.length <= 1) return all[0] ?? "";
  return `${all.slice(0, -1).join(", ")} og ${all[all.length - 1]}`;
}

export interface ActivityView {
  id: string;
  nodeId: string;
  lineage: string[];
  sportId?: string;
  sportName?: string;
  /** The branch (discipline) the activity sits under, when it has one. */
  branchName?: string;
  date: ISODate;
  /** Last day of a multi-day activity (cup, camp). */
  endDate?: ISODate;
  start: ClockTime;
  end?: ClockTime;
  /** The start is a window settled in Spond — see lib/timetable.ts. */
  startApprox?: boolean;
  meetTime?: ClockTime;
  kind: ActivityKind;
  kindLabel: string;
  title: string;
  subtitle: string;
  trail: string;
  nodeName: string;
  nodeHref: string;
  place?: { name: string; detail?: string; note?: string; mapUrl?: string };
  cancelled: boolean;
  statusNote?: string;
  recurring?: string;
  result?: { label: string; outcome: "win" | "loss" | "draw" };
  description?: string;
  people: { label: string; text: string }[];
  signup?: ExternalLink;
}

export function toActivityView(a: Activity, db: Db, org: Org): ActivityView {
  const node = org.get(a.nodeId);
  const venue = a.venueId ? db.venues.find((v) => v.id === a.venueId) : undefined;
  const h = headline(a, org);
  const series = a.seriesId ? db.series.find((s) => s.id === a.seriesId) : undefined;

  const people: ActivityView["people"] = [];
  const scorers = peopleFor(a, db, "scorer");
  if (scorers.named.length || scorers.hidden) {
    people.push({
      label: "Mål",
      text: joinNames(
        scorers.named.map((n) => (n.count && n.count > 1 ? `${n.name} (${n.count})` : n.name)),
        scorers.hidden,
        "spiller",
      ),
    });
  }
  const selected = peopleFor(a, db, "selected");
  if (selected.named.length || selected.hidden) {
    people.push({ label: "Tatt ut", text: joinNames(selected.named.map((n) => n.name), selected.hidden, "spiller") });
  }
  const duty = peopleFor(a, db, "duty");
  if (duty.named.length || duty.hidden) {
    people.push({ label: "Vakt", text: joinNames(duty.named.map((n) => n.name), duty.hidden, "spiller") });
  }

  return {
    id: a.id,
    nodeId: a.nodeId,
    lineage: org.lineage(a.nodeId).map((n) => n.id),
    sportId: org.sportOf(a.nodeId)?.id,
    sportName: org.sportOf(a.nodeId)?.name,
    branchName: org.lineage(a.nodeId).find((n) => n.kind === "discipline")?.name,
    date: a.date,
    endDate: a.endDate,
    start: a.start,
    end: a.end,
    startApprox: a.startApprox,
    meetTime: a.meetTime,
    kind: a.kind,
    kindLabel: a.kind === "match" ? "Kamp" : KIND_LABEL[a.kind],
    title: h.title,
    // In a one-sport club, something for the whole sport is for the whole club.
    subtitle: org.sports().length === 1 && h.subtitle === org.sports()[0].name ? "Hele klubben" : h.subtitle,
    // A one-sport club leaves the sport out: «Sykkel · Terreng» says nothing «Terreng» does not.
    trail:
      node?.kind === "club"
        ? ""
        : org.sports().length === 1
          ? trailLabel(org, a.nodeId, { includeSelf: a.kind !== "training" && a.kind !== "match" })
              .split(" · ")
              .filter((part) => part !== org.sports()[0].name)
              .join(" · ")
          : trailLabel(org, a.nodeId, { includeSelf: a.kind !== "training" && a.kind !== "match" }),
    nodeName: node?.name ?? "",
    nodeHref: org.href(a.nodeId),
    place: venue
      ? {
          name: venue.name,
          detail: [a.locationNote, venue.area].filter(Boolean).join(" · "),
          note: venue.note,
          mapUrl: mapUrl(venue.mapQuery),
        }
      : a.locationNote
        ? { name: a.locationNote, detail: a.home === false ? "Bortekamp" : undefined, mapUrl: mapUrl(`${a.locationNote}, Oslo`) }
        : undefined,
    cancelled: a.status === "cancelled",
    statusNote: a.statusNote,
    recurring: series ? `Fast trening hver ${weekdayName(series.weekday)}` : undefined,
    result: result(a) ?? undefined,
    description: a.description,
    people,
    signup: a.signup,
  };
}

export interface StoryView {
  id: string;
  href: string;
  title: string;
  lead?: string;
  kicker: string;
  kickerHref: string;
  date: string;
  publishedAt: LocalDateTime;
  author: string;
  photo?: Photo;
  nodeId: string;
  privacyEdited: boolean;
}

export function toStoryView(a: Article, db: Db, org: Org, now: LocalDateTime): StoryView {
  const node = org.get(a.nodeId);
  const sport = org.sportOf(a.nodeId);
  const photo = photoById(db, a.heroPhotoId);
  const kicker =
    !node || node.kind === "club" ? "Klubben" : sport && sport.id !== node.id ? `${sport.name} · ${node.name}` : node.name;
  return {
    id: a.id,
    href: articleHref(a),
    title: plain(a.title),
    lead: a.lead ? plain(a.lead) : undefined,
    kicker,
    kickerHref: org.href(a.nodeId),
    date: a.publishedAt ? relativeTime(a.publishedAt, now) : "",
    publishedAt: a.publishedAt ?? a.createdAt,
    author: authorLine(db, org, a),
    photo: photo && !photo.withdrawn ? photo : undefined,
    nodeId: a.nodeId,
    privacyEdited: !!a.privacyEditedAt,
  };
}

export interface SessionView {
  id: string;
  weekday: number;
  start: ClockTime;
  end: ClockTime;
  /** The start is a window settled in Spond — see lib/timetable.ts. */
  startApprox?: boolean;
  place: string;
  note?: string;
  shared?: string;
  cancelledNext?: string;
}

export function sessionsFor(db: Db, org: Org, nodeId: string, today: ISODate): SessionView[] {
  return weeklySessions(db.series, org, nodeId, today).map((s) => {
    const venue = db.venues.find((v) => v.id === s.venueId);
    const upcomingException = s.exceptions?.find((e) => e.date >= today);
    return {
      id: s.id,
      weekday: s.weekday,
      start: s.start,
      end: s.end,
      startApprox: s.startApprox,
      place: [venue?.name, s.locationNote?.toLowerCase()].filter(Boolean).join(", "),
      note: s.title !== "Trening" ? s.title : undefined,
      shared: s.nodeId !== nodeId ? `Felles for ${org.get(s.nodeId)?.name}` : undefined,
      cancelledNext: upcomingException?.date,
    };
  });
}

/* ─── «Sykle med …» ───────────────────────────────────────────────────── */

/**
 * A group's weekly sessions as sentences, merged per meeting point and start:
 * «Tirsdager og torsdager kl. 18.00 på Bekkestua torg». Used by «Sykle med»
 * on member stories and by «Før første trening» on group pages.
 */
export function meetTimes(db: Db, org: Org, nodeId: string, today: ISODate): string[] {
  const sessions = weeklySessions(db.series, org, nodeId, today);
  const slots = new Map<string, { weekdays: Set<number>; start: string; place: string }>();
  for (const s of sessions) {
    const venue = db.venues.find((v) => v.id === s.venueId);
    const place = venue ? `${venue.preposition ?? "på"} ${venue.name}` : s.locationNote ? `, ${s.locationNote}` : "";
    const key = `${place}|${s.start}`;
    const slot = slots.get(key) ?? { weekdays: new Set<number>(), start: s.start, place };
    slot.weekdays.add(s.weekday);
    slots.set(key, slot);
  }
  return [...slots.values()].map((slot) => {
    const days = [...slot.weekdays].sort().map((w) => weekdayName(w, true));
    const dayText = days.length > 1 ? `${days.slice(0, -1).join(", ")} og ${days.at(-1)}` : days[0];
    const text = `${dayText} kl. ${formatTime(slot.start)}${slot.place.startsWith(",") ? slot.place : ` ${slot.place}`}`.trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
  });
}

export interface RideWithGroup {
  id: string;
  name: string;
  href: string;
  /** «Tirsdager og torsdager kl. 18.00 på Bekkestua torg» — one per meeting point and time. */
  times: string[];
  /** «april–september», «hele året»; only for groups that train in a season. */
  season?: string;
}

const MONTHS = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

/**
 * The months a group trains, over every seasonal series on it or a branch
 * above it, past parts of the year included: «april–september, unntatt juli»,
 * «oktober–mars», «hele året». The season starts after the longest run of
 * months without training; shorter breaks inside it are named.
 */
function seasonOf(db: Db, org: Org, nodeId: string): string | undefined {
  const ids = new Set(org.lineage(nodeId).map((n) => n.id));
  const on = new Set<number>();
  for (const s of db.series.filter((x) => ids.has(x.nodeId) && x.seasonal)) {
    let y = Number(s.from.slice(0, 4));
    let m = Number(s.from.slice(5, 7));
    const endY = Number(s.to.slice(0, 4));
    const endM = Number(s.to.slice(5, 7));
    for (let i = 0; i < 24 && (y < endY || (y === endY && m <= endM)); i++) {
      on.add(m);
      m = (m % 12) + 1;
      if (m === 1) y++;
    }
  }
  if (!on.size) return undefined;
  if (on.size === 12) return "hele året";
  // Longest run of months off, walking the year round.
  let best = { start: 0, len: 0 };
  for (let m = 1; m <= 12; m++) {
    const prev = ((m + 10) % 12) + 1;
    if (on.has(m) || !on.has(prev)) continue;
    let len = 0;
    while (!on.has(((m - 1 + len) % 12) + 1)) len++;
    if (len > best.len) best = { start: m, len };
  }
  const first = ((best.start - 1 + best.len) % 12) + 1;
  const last = ((best.start + 10) % 12) + 1;
  const breaks: number[] = [];
  for (let m = first; m !== last; m = (m % 12) + 1) if (!on.has(m)) breaks.push(m);
  return `${MONTHS[first - 1]}–${MONTHS[last - 1]}${breaks.length ? `, unntatt ${breaks.map((b) => MONTHS[b - 1]).join(" og ")}` : ""}`;
}

/**
 * When and where to ride with a member: each group they ride in (athlete
 * memberships), with the weekly sessions it has now or later this year,
 * shared ones from a branch included (weeklySessions), merged per meeting
 * point and time. A group without weekly sessions keeps an empty `times`,
 * and the page points to the group instead.
 */
export function rideWith(db: Db, org: Org, personId: string, today: ISODate): RideWithGroup[] {
  const person = db.people.find((p) => p.id === personId);
  if (!person) return [];
  return person.memberships
    .filter((m) => m.role === "athlete")
    .flatMap((m) => {
      const node = org.get(m.nodeId);
      if (!node) return [];
      const times = meetTimes(db, org, node.id, today);
      const season = seasonOf(db, org, node.id);
      // «BMX · Gruppe 3», as on the front page's quote cards.
      const discipline = org.lineage(node.id).find((n) => n.kind === "discipline" && n.id !== node.id);
      const name = discipline && !node.name.includes(discipline.name) ? `${discipline.name} · ${node.name}` : node.name;
      return [{ id: node.id, name, href: org.href(node.id), times, season }];
    });
}
