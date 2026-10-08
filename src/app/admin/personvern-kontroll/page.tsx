import { uploadedAt } from "@/lib/photo-src";
import { FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { PhotoCheckActions } from "@/components/admin/photo-check-actions";
import { CompleteContact } from "@/components/admin/privacy-contact-actions";
import { chipClass, EmptyState, Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { articleHref, articlePhotoIds, fullName, heroPhotoFor, personById, userById } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { formatDateFull } from "@/lib/dates";
import { trailLabel } from "@/lib/org";
import { canAnonymise } from "@/lib/permissions";
import { ON_BEHALF_LABEL, WANT_LABEL } from "@/lib/privacy-contact";
import { plain } from "@/lib/rich-text";
import type { Db, LocalDateTime, Person } from "@/lib/types";

export const metadata = { title: "Personvern-kontroll" };

/** «6. oktober 2026 kl. 21.53»; a date alone where no time was kept. */
const stamp = (at?: string) => (!at ? "Ikke registrert" : at.length > 10 ? `${formatDateFull(at.slice(0, 10))} kl. ${at.slice(11, 16).replace(":", ".")}` : formatDateFull(at));

/** A name for the register: never the name of someone who has been anonymised. */
const nameOf = (p?: Person) => (!p ? "Ukjent person" : p.privacy.status === "anonymised" ? "Anonymisert person" : fullName(p));

type View = "alle" | "opplastet" | "kontroll" | "skjult" | "uten-fotograf" | "uten-tagget";
const VIEWS: { id: View; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "opplastet", label: "Lastet opp i admin" },
  { id: "kontroll", label: "Venter på kontroll" },
  { id: "skjult", label: "Skjult" },
  { id: "uten-fotograf", label: "Uten fotograf" },
  { id: "uten-tagget", label: "Ingen tagget" },
];

/**
 * Privacy check. One page for what the club has to be able to answer: every picture, where it stands, who put it up and when,
 * who is tagged in it, and every request about privacy, with when it came and whether it is dealt with. A picture can be hidden, shown again or deleted
 * here (components/admin/photo-check-actions.tsx); the requests are handled under Personvern, a person's pictures under Medlemmer.
 */
export default async function PrivacyCheckPage({ searchParams }: { searchParams: Promise<{ vis?: string }> }) {
  const { vis } = await searchParams;
  const view: View = VIEWS.some((v) => v.id === vis) ? (vis as View) : "alle";
  const { db, org, user } = await loadAdmin();
  if (!canAnonymise(user)) redirect("/admin");

  // Where each picture is used on the site.
  const usage = new Map<string, { label: string; href?: string }[]>();
  const use = (photoId: string | undefined, label: string, href?: string) => {
    if (photoId) usage.set(photoId, [...(usage.get(photoId) ?? []), { label, href }]);
  };
  for (const n of db.nodes) {
    use(n.coverPhotoId, `Gruppe: ${n.name}`, org.href(n.id));
    use(n.identityPhotoId, `Profilbilde for ${n.name}`);
    // A page with no cover of its own shows the nearest picture (see heroPhotoFor), and that picture is in use there too.
    if (n.kind !== "club") {
      const shownHere = heroPhotoFor(db, org, n.id);
      if (shownHere && shownHere.id !== n.coverPhotoId) use(shownHere.id, `Hovedbilde på siden for ${n.name}`, org.href(n.id));
    }
  }
  use(db.club.heroPhotoId, "Forsiden (hovedbildet)", "/");
  use(db.club.joinPhotoId, "«Bli med»-båndet på gruppesidene");
  use(db.club.youthPhotoId, "Barn og ungdom", "/barn-og-ungdom");
  use(db.club.kit?.photoId, "Klubbdrakten på forsiden", "/");
  for (const v of db.venues) use(v.photoId, `Arena: ${v.name}`);
  for (const p of db.people) use(p.portraitPhotoId, "Portrett i medlemsregisteret");
  for (const r of db.races) use(r.photoId, `Ritt: ${r.name}`);
  for (const a of db.articles) for (const id of articlePhotoIds(a)) use(id, `Innlegg: ${plain(a.title)}`, a.status === "published" ? articleHref(a) : undefined);

  const photos = db.photos
    .map((p) => {
      const taggedPeople = p.people.map((t) => personById(db, t.personId)).filter((x): x is Person => !!x);
      const uploader = userById(db, p.review?.uploadedByUserId);
      const hidden = !!p.withdrawn || !!p.awaitingConsent?.length;
      return { p, taggedPeople, uploader, hidden, pending: p.review?.status === "pending", uploaded: !!p.review?.uploadedAt, noCredit: !p.photographer && !p.credit, noTags: p.people.length === 0 };
    })
    .sort((a, b) => (b.p.review?.uploadedAt ?? "").localeCompare(a.p.review?.uploadedAt ?? ""));
  const matches = (x: (typeof photos)[number], v: View) =>
    v === "opplastet" ? x.uploaded : v === "kontroll" ? x.pending : v === "skjult" ? x.hidden : v === "uten-fotograf" ? x.noCredit : v === "uten-tagget" ? x.noTags : true;
  // The table below scrolls inside a box (both ways), so its column headings can stay in view, sticky, while the rows move.
  const shown = photos.filter((x) => matches(x, view));
  const countOf = (v: View) => photos.filter((x) => matches(x, v)).length;

  // Everyone tagged anywhere, with their pictures.
  const tagged = new Map<string, { person: Person | undefined; photos: string[] }>();
  for (const p of db.photos) for (const t of p.people) {
    const row = tagged.get(t.personId) ?? { person: personById(db, t.personId), photos: [] };
    row.photos.push(p.id);
    tagged.set(t.personId, row);
  }
  const taggedRows = [...tagged.values()].sort((a, b) => b.photos.length - a.photos.length || nameOf(a.person).localeCompare(nameOf(b.person), "nb"));

  // Every request about privacy, newest first.
  const requests = [
    ...db.privacyContacts.map((c) => ({
      id: c.id,
      at: c.receivedAt as LocalDateTime | string,
      kind: "Skjema på nettsiden",
      from: `${c.fromName} (${c.fromEmail})`,
      about: `${ON_BEHALF_LABEL[c.onBehalfOf]}${c.subjectName ? `: ${c.subjectName}` : ""}`,
      detail: [c.where && `Lag eller gruppe: ${c.where}`, c.message].filter(Boolean).join("\n"),
      email: c.fromEmail as string | undefined,
      contactId: c.id as string | undefined,
      personId: undefined as string | undefined,
      /** The names to look for in the register: the person it concerns, else the sender (who asks about themselves). */
      lookup: (c.onBehalfOf === "self" || !c.subjectName ? c.fromName : c.subjectName) as string | undefined,
      wants: c.wants.map((w) => WANT_LABEL[w]).join(", "),
      done: c.status === "completed",
      doneAt: c.completedAt,
    })),
    ...db.privacyRequests.map((r) => ({
      id: r.id,
      at: r.receivedAt as LocalDateTime | string,
      kind: "Anonymisering",
      from: `${r.fromName} (${r.relation})`,
      about: "Person i registeret",
      detail: r.message,
      email: undefined as string | undefined,
      contactId: undefined as string | undefined,
      personId: r.personId as string | undefined,
      lookup: undefined as string | undefined,
      wants: "Anonymisering",
      done: r.status === "completed",
      doneAt: r.completedAt,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const openCount = requests.filter((r) => !r.done).length;

  /** Persons in the register that a request may be about: the one it points at, else those whose full name equals the name written (ignoring accents and case). */
  const key = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zæøå ]/g, " ").replace(/\s+/g, " ").trim();
  const reportCandidates = (lookup: string | undefined, personId: string | undefined) => {
    if (personId) {
      const p = db.people.find((x) => x.id === personId);
      return p ? [{ id: p.id, name: fullName(p) }] : [];
    }
    if (!lookup) return [];
    const wanted = key(lookup);
    return db.people.filter((x) => key(fullName(x)) === wanted).slice(0, 3).map((x) => ({ id: x.id, name: fullName(x) }));
  };

  const stats = [
    { n: db.photos.length, label: "bilder i alt" },
    { n: db.photos.filter((p) => p.people.length > 0).length, label: "med tagget person" },
    { n: photos.filter((x) => x.hidden).length, label: "skjult nå" },
    { n: openCount, label: openCount === 1 ? "åpen henvendelse" : "åpne henvendelser", warn: openCount > 0 },
  ];

  const th = "px-4 py-2 text-left t-meta font-semibold text-ink-3 first:sm:pl-5 last:sm:pr-5";
  const td = "px-4 py-3 align-top first:sm:pl-5 last:sm:pr-5";

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Personvern-kontroll"
        description="Alle bilder, hvor de står, hvem som la dem ut og når, og hvem som er tagget. Øverst er registeret over henvendelser om personvern, med tidspunkt og om de er løst: sjekk at det er riktig person før du gir ut noe, svar på e-post og merk som behandlet. Under kan du skjule, vise igjen og slette bilder, og finne personen under Medlemmer for å anonymisere."
      />

      <ul className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label} className={cn("rounded-lg border border-line bg-surface px-4 py-3", s.warn && "border-warning bg-warning-surface")}>
            <p className="font-display text-[1.75rem] leading-none font-medium tnum">{s.n}</p>
            <p className="mt-1 t-small text-ink-2">{s.label}</p>
          </li>
        ))}
      </ul>

      <div className="grid gap-6">
        <Panel id="henvendelser" title={`Henvendelser (${requests.length})`} accent={openCount ? "warning" : 2} action={<span className="t-small text-ink-3">Skjemaet under Personvern på Om klubben</span>}>
          {requests.length === 0 ? (
            <p className="px-5 py-6 t-small text-ink-2">Ingen henvendelser er registrert.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] t-small">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>Mottatt</th>
                    <th className={th}>Fra</th>
                    <th className={th}>Gjelder</th>
                    <th className={th}>Ber om</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td className={cn(td, "whitespace-nowrap")}>{stamp(r.at)}</td>
                      <td className={td}>
                        {r.from}
                        {r.email && (
                          <a href={`mailto:${r.email}`} className="link block t-meta text-ink-2">
                            Svar på e-post
                          </a>
                        )}
                        <span className="block t-meta text-ink-3">{r.kind}</span>
                      </td>
                      <td className={cn(td, "max-w-[22rem]")}>
                        {r.about}
                        {r.detail && <span className="mt-1 block whitespace-pre-wrap t-meta text-ink-3">{r.detail}</span>}
                        {/* The access report: for the person in the register whose name matches, to hand over once the sender is checked. */}
                        {reportCandidates(r.lookup, r.personId).map((c) => (
                          <Link key={c.id} href={`/admin/personer/${c.id}/innsyn`} className="mt-2 flex items-center gap-1.5 t-small font-medium text-club hover:text-club-hover">
                            <FileText aria-hidden className="size-3.5" />
                            Innsynsrapport for {c.name}
                          </Link>
                        ))}
                      </td>
                      <td className={td}>{r.wants}</td>
                      <td className={cn(td, "whitespace-nowrap")}>
                        {r.done ? <Status tone="success">Løst</Status> : <Status tone="warning">Åpen</Status>}
                        {r.done && <span className="mt-1 block t-meta text-ink-3">{stamp(r.doneAt)}</span>}
                        {!r.done && r.contactId && (
                          <div className="mt-2">
                            <CompleteContact id={r.contactId} />
                          </div>
                        )}
                        {!r.done && r.personId && (
                          <Link href={`/admin/personer/${r.personId}`} className="mt-2 inline-flex t-small font-medium text-club hover:text-club-hover">
                            Åpne personen
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel id="bilder" title={`Bilder (${shown.length})`} accent={5}>
          <nav aria-label="Filter" className="flex flex-wrap gap-1.5 border-b border-line px-4 py-3 sm:px-5">
            {VIEWS.map((v) => (
              <Link key={v.id} href={`/admin/personvern-kontroll?vis=${v.id}#bilder`} aria-current={v.id === view ? "page" : undefined} className={chipClass(v.id === view)}>
                {v.label} <span className="tnum opacity-70">{countOf(v.id)}</span>
              </Link>
            ))}
          </nav>
          {shown.length === 0 ? (
            <EmptyState className="m-5">Ingen bilder i dette utvalget.</EmptyState>
          ) : (
            <div className="max-h-[calc(100dvh-9rem)] overflow-auto">
              <table className="w-full min-w-[64rem] t-small">
                <thead className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_var(--border)]">
                  <tr>
                    <th className={th}>Bilde</th>
                    <th className={th}>Hvor</th>
                    <th className={th}>Lastet opp av, og når</th>
                    <th className={th}>Personer tagget</th>
                    <th className={th}>Status</th>
                    <th className={th}>Handling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map(({ p, taggedPeople, uploader, hidden, pending }) => (
                    <tr key={p.id}>
                      <td className={td}>
                        {/* A plain img: the source may be a data address. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={uploadedAt(p.src, 256)} alt={p.alt} loading="lazy" className="h-14 w-20 rounded-md object-cover ring-1 ring-line" />
                      </td>
                      <td className={cn(td, "max-w-[18rem]")}>
                        <span className="font-medium">{trailLabel(org, p.nodeId, { includeSelf: true })}</span>
                        <ul className="mt-1 grid gap-0.5 t-meta text-ink-3">
                          {(usage.get(p.id) ?? []).length === 0 && <li>Ikke i bruk på siden</li>}
                          {(usage.get(p.id) ?? []).map((u, i) => (
                            <li key={i}>{u.href ? <Link href={u.href} className="link">{u.label}</Link> : u.label}</li>
                          ))}
                        </ul>
                      </td>
                      <td className={td}>
                        {uploader ? <span className="font-medium">{uploader.name}</span> : <span className="text-ink-2">{p.source.provider === "unsplash" ? "Demobilde (Unsplash)" : "Ikke registrert"}</span>}
                        <span className="block t-meta text-ink-3">{stamp(p.review?.uploadedAt)}</span>
                        {p.photographer && <span className="block t-meta text-ink-3">Foto: {p.photographer.name}</span>}
                      </td>
                      <td className={td}>
                        {taggedPeople.length ? (
                          <ul className="grid gap-0.5">
                            {taggedPeople.map((t) => (
                              <li key={t.id}>{nameOf(t)}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-ink-3">{p.noPeople ? "Ingen kan kjennes igjen" : "Ingen tagget"}</span>
                        )}
                        {p.coveredPersonIds?.length ? (
                          <span className="mt-1 block t-meta text-ink-3">Sladdet: {p.coveredPersonIds.map((id) => nameOf(personById(db, id))).join(", ")}</span>
                        ) : !!p.censored ? (
                          <span className="mt-1 block t-meta text-ink-3">{p.censored === 1 ? "1 person sladdet" : `${p.censored} personer sladdet`}</span>
                        ) : null}
                      </td>
                      <td className={td}>
                        <span className="flex flex-wrap gap-1">
                          {hidden && <Status tone="danger">Skjult</Status>}
                          {pending && <Status tone="warning">Venter på kontroll</Status>}
                          {!hidden && !pending && <Status tone="success">Vises</Status>}
                        </span>
                        {p.awaitingConsent?.length ? <span className="mt-1 block t-meta text-ink-3">Venter på svar fra {p.awaitingConsent.length}</span> : null}
                        {p.withdrawn && <span className="mt-1 block t-meta text-ink-3">{p.withdrawn.reason}</span>}
                      </td>
                      <td className={td}>
                        <Link href={`/admin/personvern-kontroll/bilde/${p.id}`} className="mb-1.5 inline-flex t-small font-medium text-club hover:text-club-hover">
                          Åpne og rett
                        </Link>
                        <PhotoCheckActions photoId={p.id} hidden={hidden} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel id="tagget" title={`Tagget i bilder (${taggedRows.length} personer)`} accent={4}>
          {taggedRows.length === 0 ? (
            <p className="px-5 py-6 t-small text-ink-2">Ingen er tagget i noe bilde.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] t-small">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>Person</th>
                    <th className={th}>Bilder</th>
                    <th className={th}>Samtykke til bilder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {taggedRows.map((r) => (
                    <tr key={r.person?.id ?? r.photos.join()}>
                      <td className={td}>
                        {r.person && r.person.privacy.status !== "anonymised" ? (
                          <Link href={`/admin/personer/${r.person.id}`} className="link font-medium">
                            {nameOf(r.person)}
                          </Link>
                        ) : (
                          <span className="font-medium">{nameOf(r.person)}</span>
                        )}
                      </td>
                      <td className={td}>{r.photos.length}</td>
                      <td className={td}>
                        {r.person?.privacy.status === "anonymised" ? "Anonymisert" : { granted: "Gitt", declined: "Nei", unknown: "Ikke svart" }[r.person?.privacy.photoConsent ?? "unknown"]}
                        {r.person?.privacy.status === "restricted" && <span className="block t-meta text-ink-3">Ikke publiser</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
