import type { ExplorerGroup, ExplorerSport } from "@/components/public/activity-explorer";
import { photoById } from "./content";
import { formatTime, weekdayName } from "./dates";
import type { Org } from "./org";
import type { Db, ISODate, OrgNode } from "./types";
import { sessionsFor } from "./views";

const BANDS = [
  { label: "Barn", from: 0, to: 12 },
  { label: "Ungdom", from: 13, to: 19 },
  { label: "Voksne", from: 20, to: 99 },
];

/** "Barn · Ungdom · Voksne" — which life stages a set of groups covers. */
export function ageBands(groups: OrgNode[]): string {
  return BANDS.filter((b) => groups.some((g) => g.ageRange && g.ageRange[0] <= b.to && g.ageRange[1] >= b.from))
    .map((b) => b.label)
    .join(" · ");
}

/**
 * One scannable line for a group card: "Tirsdager og torsdager 18.00 ·
 * Voldsløkka kunstgress".
 *
 * The time and the place are only named when every session shares them.
 * BOC 1–4 train at 17.00 from Bekkestua on weekdays and ride a long ride
 * from Kaffebrenneriet at the weekend, so naming the first session's time
 * for all of them would be wrong; the days alone are true, and the group's
 * own page has the rest.
 */
export function scheduleSummary(db: Db, org: Org, nodeId: string, today: ISODate): string | undefined {
  const sessions = sessionsFor(db, org, nodeId, today).filter((s) => !s.shared);
  if (!sessions.length) return undefined;
  const days = [...new Set(sessions.map((s) => s.weekday))].map((d) => weekdayName(d, true));
  const dayText = days.length > 1 ? `${days.slice(0, -1).join(", ")} og ${days.at(-1)}` : days[0];

  const first = sessions[0];
  const placeOf = (s: (typeof sessions)[number]) => s.place.split(",")[0];
  const sameTime = sessions.every((s) => s.start === first.start && !!s.startApprox === !!first.startApprox);
  const samePlace = sessions.every((s) => placeOf(s) === placeOf(first));

  return [
    `${dayText.charAt(0).toUpperCase()}${dayText.slice(1)}${sameTime ? ` ${first.startApprox ? "ca. " : ""}${formatTime(first.start)}` : ""}`,
    samePlace ? placeOf(first) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Two ages decide what a parent is shown.
 *
 * A group is *for* children when its age range ends inside youth: BMX Rekrutt
 * (6–12), Ungdom (13–16), Junior (17–18). An open-ended group like BOC 3
 * ("fra 17 år" — really 17 to 99) is an adult group a late teenager may join,
 * and listing it as a children's group would be a lie of arrangement.
 *
 * Some mixed groups do take school-age members though — the track group and
 * downhill from 13, Zwift from 15 — and a parent of a fifteen-year-old wants
 * to know. They are kept apart as "also open to youth" rather than folded in.
 */
export const YOUTH_MAX_AGE = 19;
export const YOUTH_ENTRY_AGE = 16;

const isYouthGroup = (g: ExplorerGroup) => g.ageRange[1] <= YOUTH_MAX_AGE;
const isMixedGroup = (g: ExplorerGroup) => g.ageRange[1] > YOUTH_MAX_AGE && g.ageRange[0] <= YOUTH_ENTRY_AGE;

function narrow(sports: ExplorerSport[], keep: (g: ExplorerGroup) => boolean): ExplorerSport[] {
  return sports
    .map((sport) => {
      const branches = sport.branches.map((b) => ({ ...b, groups: b.groups.filter(keep) })).filter((b) => b.groups.length);
      const groups = branches.flatMap((b) => b.groups);
      return { ...sport, branches, groupCount: groups.length };
    })
    .filter((sport) => sport.branches.length);
}

/**
 * The club seen from a parent's side. `youth` is what the club runs for
 * children; `mixed` is the adult groups that also take someone young. A club
 * with nothing for children gets two empty lists and no page to fill.
 */
export function youthExplorer(db: Db, org: Org, today: ISODate): { youth: ExplorerSport[]; mixed: ExplorerSport[] } {
  const all = buildExplorer(db, org, today);
  return { youth: narrow(all, isYouthGroup), mixed: narrow(all, isMixedGroup) };
}

/**
 * Data for "Finn din aktivitet": every sport with its branches and the
 * groups people actually join. A leaf directly under a sport becomes its
 * own branch; a sport without any branches gets a single list.
 */
export function buildExplorer(db: Db, org: Org, today: ISODate): ExplorerSport[] {
  return org.sports().map((sport) => {
    const children = org.children(sport.id);
    const groups = org.groups(sport.id);

    const toGroup = (g: OrgNode, branchId: string): ExplorerGroup => {
      const photo = photoById(db, g.coverPhotoId);
      return {
        id: g.id,
        name: g.name,
        href: org.href(g.id),
        ageRange: g.ageRange ?? [0, 99],
        ageLabel: g.ageLabel,
        schedule: scheduleSummary(db, org, g.id, today) ?? g.summary ?? "",
        summary: g.summary,
        path: org
          .lineage(g.id)
          .slice(org.lineage(branchId).length, -1)
          .map((n) => n.name),
        photo: photo && !photo.withdrawn ? photo : undefined,
        levels: g.levels,
        recommendFirst: g.recommendFirst,
      };
    };

    const onlyLeaves = children.every((c) => org.isLeaf(c.id));
    const branches = onlyLeaves
      ? [{ id: sport.id, name: "Alle grupper", groups: groups.map((g) => toGroup(g, sport.id)) }]
      : children
          .map((c) =>
            org.isLeaf(c.id)
              ? { id: c.id, name: c.name, groups: [toGroup(c, sport.id)] }
              : { id: c.id, name: c.name, groups: org.groups(c.id).map((g) => toGroup(g, c.id)) },
          )
          // Stand-alone groups first (e.g. Fotballskolen), then the branches.
          .sort((a, b) => Number(b.groups.length === 1 && b.groups[0].id === b.id) - Number(a.groups.length === 1 && a.groups[0].id === a.id));

    const identity = photoById(db, sport.identityPhotoId ?? sport.coverPhotoId);
    return {
      id: sport.id,
      name: sport.name,
      href: org.href(sport.id),
      summary: sport.summary,
      ages: ageBands(groups),
      photo: identity && !identity.withdrawn ? identity : undefined,
      groupCount: groups.length,
      branchLabel: sport.levelLabels?.discipline ?? "Gren",
      branches,
    };
  });
}
