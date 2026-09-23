import type { ReactNode } from "react";
import { LiveRefresh } from "@/components/public/live-refresh";
import { SiteFooter } from "@/components/public/site-footer";
import { SlantGuides } from "@/components/ui/slant-guides";
import { SiteHeader, type NavSection, type NavSport } from "@/components/public/site-header";
import { photoById } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { ageBands, youthExplorer } from "@/lib/finder";
import { LEVELS } from "@/lib/levels";
import type { Org } from "@/lib/org";
import type { OrgNode } from "@/lib/types";

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

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const { db, org, singleSport, theme, today } = await loadSite();

  /**
   * What the menu lists. A multi-sport club lists its sports; a club with one
   * sport lists that sport's branches instead, so the menu is about groups
   * rather than about a choice the member has already made.
   */
  const branches = singleSport ? org.children(org.sports()[0].id).filter((c) => !org.isLeaf(c.id)) : [];
  const entries = (branches.length ? branches : org.sports()).filter((entry) => !entry.hideFromNavigation);
  const sports: NavSport[] = entries.map((s) => ({
    id: s.id,
    name: s.name,
    href: org.href(s.id),
    summary: s.summary,
    ages: ageBands(org.groups(s.id)),
    photo: photoById(db, s.identityPhotoId ?? s.coverPhotoId),
    sections: sectionsFor(org, s.id),
  }));
  const menuLabel = singleSport ? "Grupper" : "Idretter";
  // Only clubs that run groups for children have a barn-og-ungdom page to link to.
  const hasYouth = youthExplorer(db, org, today).youth.length > 0;

  return (
    <>
      <a
        href="#innhold"
        className="sr-only z-[60] rounded-md bg-inverse px-4 py-2 text-ink-inverse focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Hopp til innhold
      </a>
      <SiteHeader
        clubName={db.club.name}
        letters={db.club.shortName}
        logo={db.club.logo}
        sports={sports}
        menuLabel={menuLabel}
        hasYouth={hasYouth}
        darkHeader={!!theme.header}
        contact={{ email: db.club.email, phone: db.club.phone }}
      />
      <main id="innhold">{children}</main>
      <SlantGuides />
      <SiteFooter club={db.club} sports={sports.map((s) => ({ name: s.name, href: s.href }))} sportsLabel={menuLabel} hasYouth={hasYouth} />
      <LiveRefresh version={db.version} />
    </>
  );
}
