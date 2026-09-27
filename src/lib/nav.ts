import type { NavSection, NavSport } from "@/components/public/site-header";
import { photoById } from "@/lib/content";
import { ageBands } from "@/lib/finder";
import { LEVELS } from "@/lib/levels";
import type { Org } from "@/lib/org";
import type { Db, OrgNode } from "@/lib/types";

/** Add the useful discriminator in the menu without changing page titles. */
function menuGroupItem(branchId: string, group: OrgNode) {
  let audience: string | undefined;
  let requirement: string | undefined;
  if (branchId === "b-landevei") {
    const isAdultPaceGroup = ["b-boc1", "b-boc2", "b-boc3", "b-boc4"].includes(group.id);
    audience = isAdultPaceGroup ? LEVELS.find((level) => level.id === group.levels?.[0])?.label : group.ageLabel;
  } else if (branchId === "b-bmx" || branchId === "b-terreng") {
    audience = group.ageLabel;
  } else if (branchId === "b-innendors") {
    audience = "Alle nivåer";
  } else if (branchId === "b-bane") {
    audience = "Alle nivåer";
    requirement = "Krever kurs";
  }
  return { id: group.id, name: group.name, audience, requirement };
}

/** Two levels below each sport — enough to reach any age group in one step. */
function sectionsFor(org: Org, sportId: string): NavSection[] {
  const children = org.children(sportId);
  const loose = children.filter((c) => org.isLeaf(c.id));
  const sections: NavSection[] = children
    .filter((c) => !org.isLeaf(c.id))
    .map((c) => ({
      id: c.id,
      name: c.name,
      href: org.href(c.id),
      items: org.children(c.id).map((g) => ({ ...menuGroupItem(sportId, g), href: org.href(g.id) })),
    }));
  if (loose.length) {
    sections.unshift({
      id: `${sportId}-grupper`,
      name: sections.length ? null : "Grupper",
      items: loose.map((g) => ({ ...menuGroupItem(sportId, g), href: org.href(g.id) })),
    });
  }
  return sections;
}

/**
 * What the «Grupper»/«Idretter» menu lists, shared by the header and the
 * front page's «Finn din aktivitet» so the two never disagree. A multi-sport
 * club lists its sports; a club with one sport lists that sport's branches
 * instead, so the menu is about groups rather than about a choice the member
 * has already made.
 */
export function navSports(db: Db, org: Org, singleSport: boolean): NavSport[] {
  const branches = singleSport ? org.children(org.sports()[0].id).filter((c) => !org.isLeaf(c.id)) : [];
  const entries = (branches.length ? branches : org.sports()).filter((entry) => !entry.hideFromNavigation);
  return entries.map((s) => ({
    id: s.id,
    name: s.name,
    href: org.href(s.id),
    summary: s.summary,
    ages: ageBands(org.groups(s.id)),
    photo: photoById(db, s.identityPhotoId ?? s.coverPhotoId),
    sections: sectionsFor(org, s.id),
  }));
}
