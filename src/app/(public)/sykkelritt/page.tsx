import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { NodeHero } from "@/components/public/node/hero";
import { JoinWizard } from "@/components/public/join-wizard";
import { Lagoon } from "@/components/public/lagoon";
import { Photo } from "@/components/public/photo";
import { ButtonLink } from "@/components/ui/button";
import { SplitSection } from "@/components/public/node/shared";
import { cn } from "@/lib/cn";
import { photoById } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { formatDayMonth } from "@/lib/dates";
import { formatSpan, nextEdition } from "@/lib/club-year";
import { LICENCE_INFO_URL, LICENCE_NOTES, LICENCE_UPDATED, LICENCES, RIDE_STEPS } from "@/lib/ride-licence";

export const metadata: Metadata = {
  title: "Sykkelritt",
  description: "Rittene klubben kjører sammen, og klubbens egne ritt: Genus Open, Tyrifjorden Rundt og Styrkeprøven.",
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
  const rideHero = photoById(db, "b-ph-styrkeproven-2023");
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
  // The club's own rides, a card each: Genus Open, Tyrifjorden Rundt, and Styrkeprøven (the club is the largest shareholder
  // in Styrkeprøven AS, which arranges it; its two distances are one card).
  const ownGroups = new Map<string, typeof db.races>();
  for (const r of db.races.filter((x) => x.ownEvent && x.page)) ownGroups.set(r.page!.href, [...(ownGroups.get(r.page!.href) ?? []), r]);
  const OWN_ORDER = ["r-genus-open", "r-tyrifjorden", "r-styrkeproven-to"];
  const own = [...ownGroups]
    .sort(([, a], [, b]) => (OWN_ORDER.indexOf(a[0].id) + 1 || 99) - (OWN_ORDER.indexOf(b[0].id) + 1 || 99))
    .flatMap(([href, group]) => {
    const first = group[0];
    const styrke = first.slug === "styrkeproven";
    const next = group.map((r) => nextEdition(r, today)).sort((a, b) => a.start.localeCompare(b.start))[0];
    const text = styrke
      ? "Verdens eldste og lengste turritt. Bærum og Omegn Cykleklubb er største aksjonær i Styrkeprøven AS, som arrangerer rittet, og klubbens grupper kjører Trondheim–Oslo og Lillehammer–Oslo."
      : first.id === "r-genus-open"
        ? (genusActivity?.description ?? "Genus Open er klubbens eget ritt.")
        : (first.info?.lead ?? first.place);
    return [
      {
        href,
        name: styrke ? "Styrkeprøven" : first.name,
        text,
        photo: photoById(db, first.photoId) ?? (styrke ? photoById(db, "b-ph-styrkeproven-2023") : undefined),
        when: next.confirmed ? `Neste utgave: ${formatSpan(next.start, next.end)} ${next.start.slice(0, 4)}` : `Neste utgave, ikke kunngjort: ca. ${formatSpan(next.start, next.end)} ${next.start.slice(0, 4)}`,
        label: first.id === "r-genus-open" ? "Les mer og se filmen" : `Les mer om ${styrke ? "Styrkeprøven" : first.name}`,
      },
    ];
  });

  return (
    <>
      <NodeHero
        breadcrumb={[{ label: db.club.name, href: "/" }, { label: "Sykkelritt" }]}
        eyebrow="Ritt og konkurranser"
        title="Sykkelritt"
        description="De fleste av oss kjører turritt- eller masterklassen, så du trenger ikke være rask for å stille. Her er rittene klubben kjører sammen, og klubbens egne ritt."
        photo={rideHero}
        primaryHref="#kalender"
        primaryLabel="Se rittkalenderen"
        joinHref="#egne-ritt"
        joinLabel="Klubbens egne ritt"
        facts={[
          { value: `${rides.length} ritt`, label: "i kalenderen" },
          ...(nextRide ? [{ value: formatSpan(nextRide.start, nextRide.end), label: nextRide.race.name }] : []),
          ...(genusNext ? [{ value: formatSpan(genusNext.start, genusNext.end), label: "Genus Open by BOC" }] : []),
          { value: "Medlemmer", label: "påmelding hos arrangøren" },
        ]}
      />

      <div className="alternate">
        {own.length > 0 && (
          <SplitSection id="egne-ritt" eyebrow="Klubben bak rittet" title="Klubbens egne ritt">
            <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {own.map((o) => (
                <li key={o.href} className="flex">
                  <Link href={o.href} className="group flex w-full flex-col overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line transition-shadow duration-200 hover:shadow-[0_10px_30px_-14px_rgb(13_26_43/0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action">
                    <div className="relative aspect-[3/2] overflow-hidden bg-sunken">
                      {o.photo ? (
                        <Photo photo={o.photo} ratio={3 / 2} sizes="(min-width: 1280px) 380px, (min-width: 768px) 50vw, 100vw" className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <Lagoon deep className="absolute inset-0" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-[1.5rem] leading-[1.15] font-medium tracking-[-0.015em]">{o.name}</h3>
                      <p className="mt-1 t-small text-ink-3">{o.when}</p>
                      <p className="mt-3 t-body text-ink-2">{o.text}</p>
                      <span className="mt-auto flex pt-5">
                        <span className="inline-flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-action px-[18px] text-[16px] font-medium text-on-action transition-colors group-hover:bg-action-hover sm:h-10 sm:w-fit sm:text-[14px]">
                          {o.label}
                          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </SplitSection>
        )}

        <SplitSection id="lisens" eyebrow="Slik blir du med" title="Medlemskap og lisens.">
          <p className="max-w-[60ch] t-body-lg text-ink-2">
            For å sykle et ritt i terminlista trenger du to ting: medlemskap i en klubb og lisens fra Norges Cykleforbund (NCF). Lisensen kan du ikke kjøpe før du er medlem. Å trene med klubben krever ingen av delene.
          </p>
          <div className="mt-8 max-w-[64rem]">
            <JoinWizard id="ritt-lisens" steps={RIDE_STEPS} />
          </div>
          <details className="mt-8 max-w-[64rem] rounded-lg bg-surface ring-1 ring-line">
            <summary className="cursor-pointer px-5 py-4 t-body font-medium text-ink">Lisenstypene og prisene i 2026</summary>
            <div className="border-t border-line px-5 py-5">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] t-small">
                  <thead>
                    <tr className="border-b border-line-strong text-left t-meta text-ink-3">
                      <th className="py-2 pr-4 font-semibold">Lisens</th>
                      <th className="py-2 pr-4 text-right font-semibold">Kr</th>
                      <th className="py-2 font-semibold">Ritt du kan kjøre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LICENCES.map((l) => (
                      <tr key={l.type} className="border-b border-line align-top">
                        <td className="py-2.5 pr-4 text-ink">{l.type}</td>
                        <td className="py-2.5 pr-4 text-right tnum text-ink">{l.price}</td>
                        <td className="py-2.5 text-ink-2">{l.rides.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 space-y-1.5 t-small text-ink-3">
                {LICENCE_NOTES.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <p className="mt-4 t-small text-ink-3">
                Fra NCFs lisenstabell, oppdatert {LICENCE_UPDATED}, og{" "}
                <a href={LICENCE_INFO_URL} target="_blank" rel="noreferrer noopener" className="link text-ink">
                  sykling.no
                </a>
                . NCFs sider gjelder for pris og regler.
              </p>
            </div>
          </details>
        </SplitSection>

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

        <SplitSection id="beredskap" eyebrow="Trygt av gårde" title="Beredskapsplan.">
          <div className="max-w-[60ch] space-y-4 t-body-lg text-ink-2">
            <p>Før du kjører ritt: ha navn og kontaktopplysninger til en pårørende med deg, og vit hvem som er leder i gruppa.</p>
            <p>BOC har en beredskapsplan for trening, ritt og reiser, hjemme og i utlandet.</p>
          </div>
          <ButtonLink href="/klubben/beredskapsplan" size="lg" variant="secondary" arrow className="mt-6">
            Les beredskapsplanen
          </ButtonLink>
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
