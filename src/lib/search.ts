import { articleHref, publishedArticles } from "./content";
import { formatDateFull } from "./dates";
import { formatSpan } from "./club-year";
import { trailLabel } from "./org";
import type { Org } from "./org";
import { plain } from "./rich-text";
import type { Db } from "./types";

export type SearchCategory = "Sider" | "Ritt" | "Grupper" | "Nyheter";

export interface SearchEntry {
  id: string;
  category: SearchCategory;
  title: string;
  /** Where it belongs, e.g. a group's path or an article's date. */
  subtitle?: string;
  href: string;
}

/**
 * Everything the site-wide search (site-search.tsx) can point at: the fixed
 * pages, the club's own information pages, the rides in the calendar, every branch
 * and group in the hierarchy, and published news. Built server-side per request, like the
 * rest of the public site, so admin edits and anonymisation are reflected
 * immediately. Filtering happens client-side, since the whole index is small
 * enough to ship with the page.
 */
export function buildSearchIndex(db: Db, org: Org, { hasYouth }: { hasYouth: boolean }): SearchEntry[] {
  const pages: SearchEntry[] = [
    { id: "forside", category: "Sider", title: "Forside", href: "/" },
    { id: "aktiviteter", category: "Sider", title: "Aktiviteter", href: "/aktiviteter" },
    { id: "treningsaret", category: "Sider", title: "Treningsåret", href: "/aktiviteter/treningsaret" },
    { id: "sykkelritt", category: "Sider", title: "Sykkelritt", href: "/sykkelritt" },
    { id: "mallorca", category: "Sider", title: "Mallorca-tur", href: "/mallorca" },
    ...(hasYouth ? [{ id: "barn-og-ungdom", category: "Sider" as const, title: "Barn og ungdom", href: "/barn-og-ungdom" }] : []),
    { id: "nyheter", category: "Sider", title: "Nyheter", href: "/nyheter" },
    { id: "om-klubben", category: "Sider", title: "Om klubben", href: "/om-klubben" },
    { id: "styret", category: "Sider", title: "Styret", href: "/styret" },
    { id: "bli-med", category: "Sider", title: "Bli medlem", href: "/bli-med" },
    { id: "personvern", category: "Sider", title: "Personvernerklæring", href: "/personvern" },
    ...(db.club.pages ?? []).map((p) => ({
      id: `side-${p.slug}`,
      category: "Sider" as const,
      title: p.navLabel,
      subtitle: "Om klubben",
      href: `/klubben/${p.slug}`,
    })),
  ];

  const groups: SearchEntry[] = org.nodes
    .filter((n) => n.kind !== "club" && !n.hideFromNavigation)
    .map((n) => ({
      id: n.id,
      category: "Grupper",
      title: n.name,
      subtitle: trailLabel(org, n.id) || undefined,
      href: org.href(n.id),
    }));

  // A ride is in the calendar once per edition; the search lists it once, by name, and points at its own page when it
  // has one (Genus Open, Styrkeprøven), otherwise at the calendar on /sykkelritt.
  const rides = new Map<string, SearchEntry>();
  for (const r of [...db.races].sort((a, b) => a.date.localeCompare(b.date))) {
    const title = r.slug === "styrkeproven" ? "Styrkeprøven" : r.name;
    const href = r.slug ? `/sykkelritt/${r.slug}` : (r.page?.href ?? "/sykkelritt#kalender");
    const entry: SearchEntry = { id: `ritt-${r.id}`, category: "Ritt", title, subtitle: [r.place, formatSpan(r.date, r.endDate)].filter(Boolean).join(" · "), href };
    const known = rides.get(title);
    if (!known || (r.slug && !known.href.startsWith("/sykkelritt/"))) rides.set(title, entry);
  }

  const news: SearchEntry[] = publishedArticles(db).map((a) => ({
    id: a.id,
    category: "Nyheter",
    title: plain(a.title),
    subtitle: a.publishedAt ? formatDateFull(a.publishedAt) : undefined,
    href: articleHref(a),
  }));

  return [...pages, ...rides.values(), ...groups, ...news];
}
