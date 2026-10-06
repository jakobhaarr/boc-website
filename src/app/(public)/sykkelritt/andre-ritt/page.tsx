import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NodeHero } from "@/components/public/node/hero";
import { SplitSection } from "@/components/public/node/shared";
import { heroPhotoFor } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { formatSpan, nextEdition } from "@/lib/club-year";
import { formatDayMonth } from "@/lib/dates";
import { OTHER_RACE_NOTES } from "@/lib/data/seed/race-info";

export const metadata: Metadata = {
  title: "Andre ritt",
  description: "Rittene klubben kjører og som ikke har en egen side ennå, med dato, sted og arrangør.",
};

/**
 * The rides without a page of their own, one under each heading: date, place,
 * organiser, the groups that ride it and a link to the organiser. A ride with a
 * note (OTHER_RACE_NOTES) says a little more. Each ride has an anchor (its id),
 * which the calendar and the terminliste link to.
 */
export default async function OtherRidesPage() {
  const { db, org, today } = await loadSite();
  const rides = db.races
    .filter((r) => !r.slug && !r.ownEvent)
    .map((race) => ({ race, ...nextEdition(race, today) }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const first = rides[0];

  return (
    <>
      <NodeHero
        breadcrumb={[{ label: db.club.name, href: "/" }, { label: "Sykkelritt", href: "/sykkelritt" }, { label: "Andre ritt" }]}
        eyebrow="Ritt og konkurranser"
        title="Andre ritt"
        description="Rittene medlemmene kjører, og som ikke har en egen side ennå. Arrangørens side er stedet for dato, pris og påmelding."
        photo={heroPhotoFor(db, org, "b-landevei")}
        primaryHref="/sykkelritt#kalender"
        primaryLabel="Rittkalenderen"
        joinHref="/sykkelritt"
        joinLabel="Alle sykkelritt"
        facts={[
          { value: `${rides.length} ritt`, label: "på denne siden" },
          ...(first ? [{ value: `${formatDayMonth(first.start)} ${first.start.slice(0, 4)}`, label: first.race.name }] : []),
        ]}
      />

      <div className="alternate">
        {rides.map(({ race, start, end }) => {
          const note = OTHER_RACE_NOTES[race.id];
          const groups = (race.groupIds ?? []).map((id) => org.get(id)).filter((n) => !!n);
          const links = [...(note?.links ?? []), ...(race.url && !note?.links.some((l) => l.url === race.url) ? [{ label: "Arrangørens nettside", url: race.url }] : [])];
          return (
            <SplitSection key={race.id} id={race.id} eyebrow={race.nodeId === "b-terreng" ? "Terreng" : "Landevei"} title={race.name}>
              <dl className="grid max-w-[44rem] grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-2 t-body">
                <dt className="text-ink-3">Neste utgave</dt>
                <dd>{`${formatSpan(start, end)} ${start.slice(0, 4)}`}</dd>
                <dt className="text-ink-3">Sted</dt>
                <dd>{race.place}</dd>
                {race.format && (
                  <>
                    <dt className="text-ink-3">Format</dt>
                    <dd>{race.format}</dd>
                  </>
                )}
                {race.organiser && (
                  <>
                    <dt className="text-ink-3">Arrangør</dt>
                    <dd>{race.organiser}</dd>
                  </>
                )}
                {groups.length > 0 && (
                  <>
                    <dt className="text-ink-3">Gruppene våre</dt>
                    <dd>
                      {groups.map((g, i) => (
                        <span key={g!.id}>
                          {i > 0 && ", "}
                          <Link href={org.href(g!.id)} className="link text-ink">
                            {g!.name}
                          </Link>
                        </span>
                      ))}
                    </dd>
                  </>
                )}
              </dl>
              {note && (
                <ul className="mt-6 max-w-[60ch] space-y-2 t-body-lg text-ink-2">
                  {note.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
              {links.length > 0 && (
                <ul className="mt-6 max-w-[44rem] divide-y divide-line border-y border-line">
                  {links.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noreferrer noopener" className="flex items-center justify-between gap-4 py-3.5 font-medium text-ink transition-colors hover:text-club">
                        {l.label}
                        <ArrowUpRight aria-hidden className="size-4 shrink-0 text-ink-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </SplitSection>
          );
        })}
      </div>
    </>
  );
}
