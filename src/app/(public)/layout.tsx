import type { ReactNode } from "react";
import { LiveRefresh } from "@/components/public/live-refresh";
import { SiteFooter } from "@/components/public/site-footer";
import { SlantGuides } from "@/components/ui/slant-guides";
import { GlossaryProvider } from "@/components/public/glossary";
import { SiteHeader } from "@/components/public/site-header";
import { loadSite } from "@/lib/data/queries";
import { youthExplorer } from "@/lib/finder";
import { glossaryFor } from "@/lib/glossary";
import { navSports } from "@/lib/nav";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const { db, org, singleSport, theme, today } = await loadSite();

  const sports = navSports(db, org, singleSport);
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
      <main id="innhold">
        <GlossaryProvider entries={glossaryFor(db, org)}>{children}</GlossaryProvider>
      </main>
      <SlantGuides />
      <SiteFooter club={db.club} sports={sports.map((s) => ({ name: s.name, href: s.href }))} sportsLabel={menuLabel} hasYouth={hasYouth} />
      <LiveRefresh version={db.version} />
    </>
  );
}
