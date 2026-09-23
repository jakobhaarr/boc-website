import Link from "next/link";
import { Guides } from "@/components/ui/guides";
import type { Club } from "@/lib/types";
import { ClubCrest } from "./crest";
import { Sponsors } from "./sponsors";

/** Dark footer on the club's secondary colour; columns sit in the guide cells. */
export function SiteFooter({
  club,
  sports,
  sportsLabel = "Idretter",
  hasYouth,
}: {
  club: Club;
  sports: { name: string; href: string }[];
  sportsLabel?: string;
  /** The barn-og-ungdom page only exists for clubs that run groups for children. */
  hasYouth?: boolean;
}) {
  const heading = "t-meta text-white/45";
  const link = "text-white/80 transition-colors hover:text-white";
  return (
    <footer className="on-inverse relative isolate bg-club-2 text-on-club-2">
      <Guides variant="edges" className="guides--bands" />
      <div className="page relative pt-16 pb-10 lg:pt-20">
        <div className="grid-page gap-y-12">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            {/* The mark on top, level with the column headings, and the name under it. */}
            <Link href="/" className="inline-flex flex-col items-start gap-3">
              <ClubCrest letters={club.shortName} logo={club.logo} tone="dark" className={club.logo === "wordmark" ? "h-6 w-auto" : "h-9 w-auto"} />
              <span className="font-display text-[17px] leading-snug font-semibold tracking-[-0.02em]">{club.name}</span>
            </Link>
            <p className="mt-2 max-w-xs t-small text-white/60">Stiftet {club.founded}.</p>
          </div>

          <nav aria-label={sportsLabel} className="col-span-2 md:col-span-4 lg:col-span-3">
            <h2 className={heading}>{sportsLabel}</h2>
            <ul className="mt-4 space-y-2.5 t-small">
              {sports.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className={link}>
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Klubben" className="col-span-2 md:col-span-4 lg:col-span-3">
            <h2 className={heading}>Klubben</h2>
            <ul className="mt-4 space-y-2.5 t-small">
              {[
                ["/aktiviteter", "Aktiviteter"],
                ...(hasYouth ? [["/barn-og-ungdom", "Barn og ungdom"]] : []),
                ["/nyheter", "Nyheter"],
                ["/bli-med", "Bli medlem"],
                ["/om-klubben", "Om klubben"],
                ...(club.footerLinks ?? []).map((l) => [l.href, l.label]),
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className={link}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <h2 className={heading}>Kontakt</h2>
            <address className="mt-4 space-y-3 t-small not-italic text-white/80">
              <p>
                {club.address.street}
                <br />
                {club.address.postalCode} {club.address.city}
              </p>
              <p>
                <a href={`mailto:${club.email}`} className={link}>
                  {club.email}
                </a>
                <br />
                <a href={`tel:${club.phone.replace(/\s/g, "")}`} className={`${link} tnum`}>
                  {club.phone}
                </a>
              </p>
            </address>
          </div>
        </div>

        <Sponsors sponsors={club.sponsors} tone="inverse" className="mt-14 border-t border-white/10" />

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6 t-small text-white/50 md:flex-row md:items-center md:justify-between">
          <p>
            © {club.name} · Org.nr. <span className="tnum">{club.orgNumber}</span>
          </p>
          <p className="flex gap-5">
            <Link href="/om-klubben#personvern" className="hover:text-white">
              Personvern
            </Link>
            <Link href="/logg-inn" className="hover:text-white">
              Logg inn for lag og trenere
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
