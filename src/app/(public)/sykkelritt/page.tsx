import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { NodeHero } from "@/components/public/node/hero";
import { ButtonLink } from "@/components/ui/button";
import { SplitSection } from "@/components/public/node/shared";
import { cn } from "@/lib/cn";
import { heroPhotoFor } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { formatDayMonth } from "@/lib/dates";
import { formatSpan, nextEdition } from "@/lib/club-year";

export const metadata: Metadata = {
  title: "Sykkelritt",
  description: "Rittene klubben kjører sammen, og Genus Open by BOC, som klubben arrangerer selv.",
};

/**
 * The races as one page: the club's own, Genus Open, first, with the film from
 * the 2022 edition, then the calendar of the rides members enter together.
 * Dates are the organisers' latest published edition; one that is over is
 * projected to next year and marked as not announced yet (nextEdition in
 * lib/club-year.ts), so the page never presents a guess as a date. Signing up
 * is done with each organiser, and the rides are for members.
 */
export default async function RittPage() {
  const { db, org, today } = await loadSite();
  const genus = db.races.find((r) => r.id === "r-genus-open");
  const genusActivity = db.activities.find((a) => a.page?.href === "/sykkelritt/genus-open");
  const rides = db.races
    .map((race) => ({ race, ...nextEdition(race, today) }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const byBranch = [...new Set(rides.map((r) => r.race.nodeId))]
    .map((id) => ({ node: org.get(id), items: rides.filter((r) => r.race.nodeId === id) }))
    .filter((g) => g.node)
    .sort((a, b) => a.node!.sortOrder - b.node!.sortOrder);
  const nextRide = rides.find((r) => r.race.id !== "r-genus-open");
  const genusNext = genus && nextEdition(genus, today);

  return (
    <>
      <NodeHero
        breadcrumb={[{ label: db.club.name, href: "/" }, { label: "Sykkelritt" }]}
        eyebrow="Ritt og konkurranser"
        title="Sykkelritt"
        description="De fleste av oss kjører turritt- eller masterklassen, så du trenger ikke være rask for å stille. Her er rittene klubben kjører sammen, og Genus Open, som klubben arrangerer selv."
        photo={heroPhotoFor(db, org, "b-landevei")}
        primaryHref="#kalender"
        primaryLabel="Se rittkalenderen"
        joinHref="/sykkelritt/genus-open"
        joinLabel="Genus Open by BOC"
        facts={[
          { value: `${rides.length} ritt`, label: "i kalenderen" },
          ...(nextRide ? [{ value: formatSpan(nextRide.start, nextRide.end), label: nextRide.race.name }] : []),
          ...(genusNext ? [{ value: formatSpan(genusNext.start, genusNext.end), label: "Genus Open by BOC" }] : []),
          { value: "Medlemmer", label: "påmelding hos arrangøren" },
        ]}
      />

      <div className="alternate">
        {genus && (
          <SplitSection id="genus-open" eyebrow="Klubbens eget ritt" title="Genus Open by BOC">
            <p className="max-w-[46ch] t-body-lg text-ink-2">{genusActivity?.description ?? "Genus Open er klubbens eget ritt."}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <ButtonLink href="/sykkelritt/genus-open" size="lg" arrow>
                Les mer og se filmen
              </ButtonLink>
              {genusNext && <span className="t-small text-ink-3">Neste utgave: {formatSpan(genusNext.start, genusNext.end)} {genusNext.start.slice(0, 4)}</span>}
            </div>
          </SplitSection>
        )}

        <SplitSection id="kalender" eyebrow="Kalender" title="Rittene vi kjører.">
          <p className="mb-8 max-w-[60ch] t-small text-ink-3">Datoene er arrangørenes, så langt de er kunngjort. Et ritt uten dato ennå står med «ca.» og forrige års dato.</p>
          <div className="space-y-10">
            {byBranch.map((g) => (
              <div key={g.node!.id}>
                <h3 className="t-h3">{g.node!.name}</h3>
                <ul className="mt-3 border-t border-line">
                  {g.items.map(({ race, start, end, confirmed, previous }) => {
                    const groups = (race.groupIds ?? []).map((id) => org.get(id)).filter((n) => !!n);
                    const body = (
                      <>
                        <div className="w-14 text-center leading-none">
                          {!confirmed && <div className="t-overline text-ink-3">ca.</div>}
                          <div className={cn("font-display text-[1.625rem] font-semibold tracking-[-0.012em]", confirmed ? "text-ink" : "mt-1 text-ink-3")}>{Number(start.slice(8))}</div>
                          <div className="mt-0.5 t-meta text-ink-3">{formatDayMonth(start).split(" ").at(-1)}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[15px] leading-snug font-semibold text-ink">{race.name}</span>
                            {race.ownEvent && <span className="rounded-xs bg-club-surface px-1.5 t-meta font-semibold text-on-club">Klubbens eget</span>}
                          </div>
                          <div className="mt-0.5 t-small text-ink-3">{[race.place, race.format, race.organiser].filter(Boolean).join(" · ")}</div>
                          {groups.length > 0 && (
                            <div className="mt-0.5 t-small text-ink-2">Gruppene våre: {groups.map((n) => n!.name).join(", ")}</div>
                          )}
                          {!confirmed && previous && <div className="mt-0.5 t-small text-ink-3">Dato ikke kunngjort ennå. Var {formatDayMonth(previous)} {previous.slice(0, 4)}.</div>}
                          {end && end !== start && <div className="mt-0.5 t-small text-ink-3">{formatSpan(start, end)}</div>}
                        </div>
                        {race.page ? <ArrowRight aria-hidden className="mt-1 size-4 text-ink-3" /> : race.url ? <ArrowUpRight aria-hidden className="mt-1 size-4 text-ink-3" /> : <span />}
                      </>
                    );
                    const cls = "grid grid-cols-[3.5rem_minmax(0,1fr)_1.25rem] items-start gap-x-4 border-b border-line px-1 py-4 sm:gap-x-6";
                    return (
                      <li key={race.id}>
                        {race.page ? (
                          <Link href={race.page.href} className={cn(cls, "transition-colors hover:bg-sunken")}>
                            {body}
                          </Link>
                        ) : race.url ? (
                          <a href={race.url} target="_blank" rel="noreferrer noopener" className={cn(cls, "transition-colors hover:bg-sunken")}>
                            {body}
                          </a>
                        ) : (
                          <div className={cls}>{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </SplitSection>

        <SplitSection id="pamelding" eyebrow="Påmelding" title="Slik melder du deg på.">
          <div className="max-w-[60ch] space-y-4 t-body-lg text-ink-2">
            <p>Ritt er for medlemmer, og påmelding skjer hos arrangøren av hvert ritt. Trykk på et ritt i kalenderen for å komme til arrangørens side.</p>
            <p>
              Ikke medlem ennå? <Link href="/bli-med" className="link text-ink">Slik blir du medlem</Link>.
            </p>
          </div>
        </SplitSection>
      </div>
    </>
  );
}
