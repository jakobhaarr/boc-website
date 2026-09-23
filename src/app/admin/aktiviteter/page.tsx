import { redirect } from "next/navigation";
import { ActivityStatusToggle } from "@/components/admin/activity-status";
import { AdminHeader } from "@/components/admin/bits";
import { Status } from "@/components/ui/primitives";
import { groupByDate, headline, upcoming } from "@/lib/activities";
import { cn } from "@/lib/cn";
import { dayHeading, formatTimeRange } from "@/lib/dates";
import { loadAdmin } from "@/lib/data/queries";
import { canEditActivities, canSeePeople } from "@/lib/permissions";

export const metadata = { title: "Aktiviteter" };

export default async function AdminActivitiesPage() {
  const { db, org, user, today } = await loadAdmin();
  if (!canSeePeople(user)) redirect("/admin");

  const list = upcoming(
    db.activities.filter((a) => canEditActivities(user, org, a.nodeId)),
    today,
    13,
  );
  const days = groupByDate(list);

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Aktiviteter"
        description="De neste to ukene for gruppene du har ansvar for. Faste treninger kommer fra treningsplanen til hver gruppe; en avlysning vises med én gang i den offentlige kalenderen."
      />
      <div className="space-y-6">
        {days.map((day) => {
          const h = dayHeading(day.date, today);
          return (
            <section key={day.date} aria-label={`${h.primary} ${h.secondary}`} className="overflow-hidden rounded-lg border border-line bg-surface">
              <h2 className="flex items-baseline gap-2 border-b border-line bg-sunken/50 px-4 py-2.5 sm:px-5">
                <span className="t-label font-semibold">{h.primary}</span>
                <span className="t-small text-ink-3">{h.secondary}</span>
              </h2>
              <ul className="divide-y divide-line">
                {day.items.map((a) => {
                  const hl = headline(a, org);
                  const venue = db.venues.find((v) => v.id === a.venueId);
                  const cancelled = a.status === "cancelled";
                  return (
                    <li key={a.id} className="grid gap-x-4 gap-y-2 px-4 py-3 sm:px-5 md:grid-cols-[7rem_minmax(0,1fr)_minmax(0,14rem)_auto] md:items-center">
                      <span className={cn("t-small tnum", cancelled ? "text-ink-3 line-through" : "text-ink")}>{formatTimeRange(a.start, a.end)}</span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className={cn("t-label font-semibold", cancelled && "text-ink-3 line-through")}>{hl.title}</span>
                          {cancelled && <Status tone="danger">Avlyst</Status>}
                          {a.seriesId && !cancelled && <span className="t-meta text-ink-3">Fast</span>}
                        </span>
                        <span className="block truncate t-small text-ink-3">
                          {hl.subtitle} · {org.trail(a.nodeId).map((n) => n.name).join(" › ") || "Hele klubben"}
                        </span>
                        {cancelled && a.statusNote && <span className="block t-small text-danger">{a.statusNote}</span>}
                      </span>
                      <span className="truncate t-small text-ink-2">{venue?.name ?? a.locationNote}</span>
                      <ActivityStatusToggle activityId={a.id} cancelled={cancelled} title={hl.title} />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
