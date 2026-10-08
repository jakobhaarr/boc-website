import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/bits";
import { BranchIcon } from "@/components/public/branch-icons";
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
  const mineIds = new Set(mine.map((n) => n.id));
  const childrenOf = (id: string) => mine.filter((n) => n.parentId === id);
  // The tops of what the user runs (for a club administrator, the disciplines); their groups open beneath them.
  const roots = mine.filter((n) => !n.parentId || !mineIds.has(n.parentId));
  const nameOf = (id?: string) => db.users.find((u) => u.id === id)?.name;
  // The icon is the discipline's, as in the menu on the site: the nearest discipline above or at the group.
  const iconName = (id: string) => [...org.lineage(id)].reverse().find((n) => n.kind === "discipline")?.name ?? org.get(id)?.name ?? "";
  const changed = (n: (typeof mine)[number]) =>
    n.updatedByUserId && nameOf(n.updatedByUserId) ? `Sist endret av ${nameOf(n.updatedByUserId)}, ${relativeTime(n.updatedAt, now)}` : `Sist endret ${relativeTime(n.updatedAt, now)}`;

  const sections = new Map<string, typeof mine>();
  for (const node of roots) {
    const parent = node.parentId ? org.get(node.parentId) : undefined;
    const label = parent && parent.kind !== "club" ? trailLabel(org, parent.id, { includeSelf: true }) : "Klubben";
    sections.set(label, [...(sections.get(label) ?? []), node]);
  }

  /** Every group beneath `id` that the user runs, in order, with how deep it sits. */
  const below = (id: string, depth = 0): { node: (typeof mine)[number]; depth: number }[] => childrenOf(id).flatMap((n) => [{ node: n, depth }, ...below(n.id, depth + 1)]);

  const Row = ({ n, depth = 0 }: { n: (typeof mine)[number]; depth?: number }) => (
    <Link href={`/admin/grupper/${n.id}`} style={{ paddingLeft: `calc(1rem + ${depth * 1.25}rem)` }} className="flex items-center gap-3 py-3.5 pr-4 transition-colors hover:bg-sunken sm:pr-5">
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{n.name}</span>
          {n.ageLabel && <Status>{n.ageLabel}</Status>}
        </span>
        <span className="mt-1 line-clamp-2 block t-small text-ink-2">{n.summary || "Ingen kort beskrivelse ennå."}</span>
        <span className="mt-1 block t-meta text-ink-3">{changed(n)}</span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-3" />
    </Link>
  );

  return (
    <div className="page pb-16">
      <AdminHeader
        title={mine.length === 1 ? mine[0].name : "Mine grupper"}
        description={
          mine.length
            ? "Åpne en disiplin for å se gruppene under den. Velg disiplinen eller en gruppe for å endre teksten på siden, første trening og tempo. Endringer er synlige på nettsiden med en gang, og du kan alltid gå tilbake til en tidligere versjon."
            : "Du har ikke tilgang til å redigere noen grupper ennå. Be styret om å gi deg tilgang."
        }
      />
      <div className="grid gap-6">
        {[...sections].map(([label, nodes]) => (
          <section key={label} aria-labelledby={`gruppe-${label}`} className="grid gap-3">
            {sections.size > 1 && (
              <h2 id={`gruppe-${label}`} className="t-label font-semibold text-ink-2">
                {label}
              </h2>
            )}
            {nodes.map((n) => {
              const groups = below(n.id);
              if (groups.length === 0)
                return (
                  <div key={n.id} className="overflow-hidden rounded-lg border border-line bg-surface">
                    <Row n={n} />
                  </div>
                );
              return (
                <details key={n.id} open={nodes.length === 1} className="group overflow-hidden rounded-lg border border-line bg-surface">
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 transition-colors hover:bg-sunken sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sunken text-ink">
                      <BranchIcon name={iconName(n.id)} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17px] font-semibold tracking-[-0.01em] text-ink">{n.name}</span>
                      <span className="mt-0.5 line-clamp-1 block t-small text-ink-2">{n.summary || "Ingen kort beskrivelse ennå."}</span>
                    </span>
                    <span className="hidden shrink-0 t-small text-ink-3 sm:block">{groups.length === 1 ? "1 gruppe" : `${groups.length} grupper`}</span>
                    <ChevronDown aria-hidden className="size-5 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="divide-y divide-line border-t border-line">
                    <Link href={`/admin/grupper/${n.id}`} className="flex items-center gap-3 bg-sunken/60 px-4 py-3 t-small font-medium text-club transition-colors hover:bg-sunken sm:px-5">
                      <Pencil aria-hidden className="size-4 shrink-0" />
                      Rediger siden for {n.name}
                      <span className="ml-auto text-ink-3">{changed(n)}</span>
                    </Link>
                    {groups.map(({ node, depth }) => (
                      <Row key={node.id} n={node} depth={depth} />
                    ))}
                  </div>
                </details>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
