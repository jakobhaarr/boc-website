import type { Metadata } from "next";
import { ScheduleExplorer, type FilterNode } from "@/components/public/schedule-explorer";
import { Section } from "@/components/ui/guides";
import { addDays } from "@/lib/dates";
import { loadSite } from "@/lib/data/queries";
import { terminliste, timetable } from "@/lib/timetable";
import { toActivityView } from "@/lib/views";

export const metadata: Metadata = { title: "Aktiviteter" };

/**
 * The public schedule: the weekly rhythm the club keeps all season, and the
 * dates it has announced. Single sessions, sign-ups and last-minute changes
 * stay in Spond — see lib/timetable.ts for why the split runs where it does.
 */
export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ gruppe?: string }> }) {
  const { gruppe } = await searchParams;
  const { db, org, today, singleSport } = await loadSite();
  // A club with one sport filters from its branches; there is no sport to pick.
  const filterRoot = singleSport ? org.sports()[0].id : org.root.id;

  const entries = timetable(db, org, org.root.id, today);
  const events = terminliste(db.activities, today, addDays(today, 300)).map((a) => toActivityView(a, db, org));

  const nodes: FilterNode[] = org.nodes.map((n) => ({
    id: n.id,
    parentId: n.parentId,
    name: n.name,
    kind: n.kind,
    levelLabel: org.levelLabel(n),
    ageRange: n.ageRange,
  }));

  return (
    <Section guides="edges">
      <div className="page pt-8 pb-10 lg:pt-14 lg:pb-12">
        <div className="grid-page">
          <div className="col-span-4 md:col-span-8 lg:col-span-9">
            <p className="t-eyebrow">Aktiviteter</p>
            <h1 className="mt-3 t-h1">
              Hva som skjer, og når vi trener.{" "}
              <span className="text-ink-3">Velg {singleSport ? "disiplin" : "idrett"} eller gruppe, så ser du bare det som gjelder deg.</span>
            </h1>
          </div>
        </div>
      </div>
      <ScheduleExplorer entries={entries} events={events} nodes={nodes} rootId={filterRoot} today={today} initialNodeId={gruppe} />
    </Section>
  );
}
