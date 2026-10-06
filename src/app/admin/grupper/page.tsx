import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { Status } from "@/components/ui/primitives";
import { loadAdmin } from "@/lib/data/queries";
import { relativeTime } from "@/lib/dates";
import { trailLabel } from "@/lib/org";
import { can } from "@/lib/access";
import type { NodeKind } from "@/lib/types";

export const metadata = { title: "Grupper" };

/** The levels whose own fields a group admin edits (see updateGroup). */
const EDITABLE: NodeKind[] = ["discipline", "ageGroup", "team"];

/**
 * «Mine grupper»: the groups the signed-in user runs, one card each. A group
 * leader sees only theirs and goes straight in; a club administrator sees
 * them all, grouped by where they sit.
 */
export default async function GroupsPage() {
  const { db, org, user, now } = await loadAdmin();
  const mine = org.nodes.filter((n) => EDITABLE.includes(n.kind) && can(user, org, n.id, "edit_group"));

  const sections = new Map<string, typeof mine>();
  for (const node of mine) {
    const parent = node.parentId ? org.get(node.parentId) : undefined;
    const label = parent && parent.kind !== "club" ? trailLabel(org, parent.id, { includeSelf: true }) : "Klubben";
    sections.set(label, [...(sections.get(label) ?? []), node]);
  }
  const nameOf = (id?: string) => db.users.find((u) => u.id === id)?.name;

  return (
    <div className="page pb-16">
      <AdminHeader
        title={mine.length === 1 ? mine[0].name : "Mine grupper"}
        description={
          mine.length
            ? "Velg en gruppe for å endre teksten på siden, første trening og tempo. Endringer er synlige på nettsiden med en gang, og du kan alltid gå tilbake til en tidligere versjon."
            : "Du har ikke tilgang til å redigere noen grupper ennå. Be styret om å gi deg tilgang."
        }
      />
      <div className="grid gap-6">
        {[...sections].map(([label, nodes]) => (
          <Panel key={label} id={`gruppe-${label}`} title={label}>
            <ul className="divide-y divide-line">
              {nodes.map((n) => (
                <li key={n.id}>
                  <Link href={`/admin/grupper/${n.id}`} className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-sunken sm:px-5">
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{n.name}</span>
                        {n.ageLabel && <Status>{n.ageLabel}</Status>}
                      </span>
                      <span className="mt-1 line-clamp-2 block t-small text-ink-2">{n.summary || "Ingen kort beskrivelse ennå."}</span>
                      <span className="mt-1 block t-meta text-ink-3">
                        {n.updatedByUserId && nameOf(n.updatedByUserId) ? `Sist endret av ${nameOf(n.updatedByUserId)}, ${relativeTime(n.updatedAt, now)}` : `Sist endret ${relativeTime(n.updatedAt, now)}`}
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );
}
