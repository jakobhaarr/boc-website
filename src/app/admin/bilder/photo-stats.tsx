import Link from "next/link";
import { fullName } from "@/lib/content";
import type { Org } from "@/lib/org";
import type { Db } from "@/lib/types";
import { photographerName } from "./all-photos";

/** A table of names with a count and a bar, the biggest first; every row links to the pictures behind the number. */
function Ranking({ title, rows, empty, note }: { title: string; rows: { key: string; label: string; n: number; href?: string; indent?: number; sub?: string }[]; empty: string; note?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section aria-label={title} className="overflow-hidden rounded-lg border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-3 t-label font-semibold sm:px-5">{title}</h2>
      {note && <p className="border-b border-line px-4 py-2.5 t-small text-ink-3 sm:px-5">{note}</p>}
      {rows.length === 0 ? (
        <p className="px-4 py-6 t-small text-ink-3 sm:px-5">{empty}</p>
      ) : (
        <ul className="max-h-[32rem] divide-y divide-line overflow-y-auto">
          {rows.map((r) => {
            const body = (
              <>
                <span className="min-w-0 flex-1" style={{ paddingLeft: `${(r.indent ?? 0) * 1.1}rem` }}>
                  <span className="block truncate t-small font-medium text-ink">{r.label}</span>
                  {r.sub && <span className="block truncate t-meta text-ink-3">{r.sub}</span>}
                </span>
                <span aria-hidden className="hidden h-2 w-28 shrink-0 overflow-hidden rounded-full bg-sunken sm:block">
                  <span className="block h-full rounded-full bg-club" style={{ width: `${Math.max(4, (r.n / max) * 100)}%` }} />
                </span>
                <span className="w-9 shrink-0 text-right tnum t-small font-semibold text-ink">{r.n}</span>
              </>
            );
            return (
              <li key={r.key}>
                {r.href ? (
                  <Link href={r.href} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-sunken sm:px-5">
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-2.5 sm:px-5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * How many pictures there are: in each group (counting the groups beneath it), of each person (tagged in it), and by
 * each photographer. Counts are of the pictures in the project, hidden ones included, so the numbers match what the
 * list under «Alle bilder» shows when a number is followed.
 */
export function PhotoStats({ db, org }: { db: Db; org: Org }) {
  const photos = db.photos;

  const groupRows = org.nodes
    .map((n) => {
      const ids = org.subtree(n.id);
      const total = photos.filter((p) => ids.has(p.nodeId)).length;
      const own = photos.filter((p) => p.nodeId === n.id).length;
      return { n, total, own, depth: org.lineage(n.id).length - 1 };
    })
    .filter((x) => x.total > 0)
    .map((x) => ({
      key: x.n.id,
      label: x.n.name,
      n: x.total,
      indent: x.depth,
      sub: x.own !== x.total && x.own > 0 ? `${x.own} direkte på siden` : undefined,
      href: `/admin/bilder?status=alle&gruppe=${x.n.id}`,
    }));

  const perPerson = new Map<string, number>();
  for (const p of photos) for (const t of new Set(p.people.map((x) => x.personId))) perPerson.set(t, (perPerson.get(t) ?? 0) + 1);
  const personRows = [...perPerson]
    .map(([id, n]) => ({ person: db.people.find((x) => x.id === id), n }))
    .filter((x): x is { person: NonNullable<typeof x.person>; n: number } => !!x.person && x.person.privacy.status !== "anonymised")
    .sort((a, b) => b.n - a.n || fullName(a.person).localeCompare(fullName(b.person), "nb"))
    .map((x) => ({ key: x.person.id, label: fullName(x.person), n: x.n, sub: x.person.privacy.photoConsent === "granted" ? undefined : "Mangler samtykke til bilder", href: `/admin/bilder?status=alle&person=${x.person.id}` }));

  const perPhotographer = new Map<string, number>();
  for (const p of photos) {
    const name = photographerName(p);
    perPhotographer.set(name, (perPhotographer.get(name) ?? 0) + 1);
  }
  const photographerRows = [...perPhotographer]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "nb"))
    .map(([name, n]) => ({ key: name || "__ingen", label: name || "Ikke oppgitt", n, href: `/admin/bilder?status=alle&fotograf=${encodeURIComponent(name || "__ingen")}` }));

  const noPeople = photos.filter((p) => p.noPeople).length;
  const untagged = photos.filter((p) => p.people.length === 0 && !p.noPeople && !p.censored).length;
  const hidden = photos.filter((p) => p.withdrawn).length;
  const totals = [
    { n: photos.length, label: "bilder i alt" },
    { n: photos.filter((p) => p.people.length > 0).length, label: "med personer tagget" },
    { n: noPeople, label: "uten identifiserbare personer" },
    { n: untagged, label: "uten svar om personer" },
    { n: photos.filter((p) => !photographerName(p)).length, label: "uten fotograf" },
    { n: hidden, label: "skjult nå" },
  ];

  return (
    <div className="mt-4 grid gap-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {totals.map((t) => (
          <div key={t.label} className="rounded-lg border border-line bg-surface px-4 py-3">
            <dd className="font-display text-[1.75rem] leading-none font-semibold tnum text-ink">{t.n}</dd>
            <dt className="mt-1.5 t-meta text-ink-3">{t.label}</dt>
          </div>
        ))}
      </dl>
      <div className="grid gap-4 lg:grid-cols-2">
        <Ranking title="Bilder per gruppe" rows={groupRows} empty="Ingen bilder ennå." note="Tallet for en gruppe teller også bildene i gruppene under den." />
        <div className="grid content-start gap-4">
          <Ranking title="Bilder per person" rows={personRows} empty="Ingen er tagget i bilder ennå." note="Hvor mange bilder hver person er tagget i." />
          <Ranking title="Bilder per fotograf" rows={photographerRows} empty="Ingen bilder ennå." />
        </div>
      </div>
    </div>
  );
}
