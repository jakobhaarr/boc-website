import { headline, KIND_LABEL, peopleFor, result, weeklySessions } from "./activities";
import { articleHref, authorLine, photoById } from "./content";
import { relativeTime, weekdayName } from "./dates";
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
    subtitle: h.subtitle,
    trail: node?.kind === "club" ? "" : trailLabel(org, a.nodeId, { includeSelf: a.kind !== "training" && a.kind !== "match" }),
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
