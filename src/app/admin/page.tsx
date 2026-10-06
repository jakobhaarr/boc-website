import { Camera, Check, FileClock, House, Images as ImageIcon, ShieldAlert, UserRoundX } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { QuickPublish } from "@/components/admin/quick-publish";
import { RoleChip } from "@/components/admin/role-chip";
import { accentVars, ROLE_HUE, type Hue } from "@/components/admin/sections";
import { buttonClass } from "@/components/ui/button";
import { Status } from "@/components/ui/primitives";
import { canAnywhere, PERMISSIONS } from "@/lib/access";
import { cn } from "@/lib/cn";
import { contactsFor, fullName, userById } from "@/lib/content";
import { formatDateLong, formatDayMonth, relativeTime } from "@/lib/dates";
import { loadAdmin } from "@/lib/data/queries";
import {
  canAnonymise,
  canApprove,
  canFeatureOnHomepage,
  canSeePeople,
  isClubAdmin,
  peopleInScope,
  scopeSummary,
  suggestedTarget,
} from "@/lib/permissions";
import { PHOTO_REVIEW_DAYS, pendingPhotos, reviewState } from "@/lib/photo-meta";
import { plain } from "@/lib/rich-text";

export const metadata = { title: "Oversikt" };

/** The colour a role is shown in (RoleChip uses the same). */
const ROLE_HUE_OF = (role: keyof typeof ROLE_HUE): Hue => ROLE_HUE[role];

function Attention({
  icon,
  tone,
  hue,
  title,
  children,
  href,
  action,
}: {
  icon: ReactNode;
  tone: "danger" | "warning" | "neutral";
  /** The colour of the part of admin it is about, for items that are neither urgent nor a warning. */
  hue?: Hue;
  title: string;
  children: ReactNode;
  href: string;
  action: string;
}) {
  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="flex min-w-0 flex-1 gap-3.5">
        <span
          style={hue ? accentVars(hue) : undefined}
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md [&_svg]:size-4",
            tone === "danger" && "bg-danger-surface text-danger",
            tone === "warning" && "bg-warning-surface text-warning",
            tone === "neutral" && (hue ? "bg-[var(--accent-bg)] text-[var(--accent)]" : "bg-sunken text-ink-2"),
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="t-label font-semibold text-ink">{title}</p>
          <div className="mt-0.5 t-small text-ink-2">{children}</div>
        </div>
      </div>
      <Link href={href} className={cn(buttonClass({ variant: "secondary", size: "sm" }), "self-start sm:self-center")}>
        {action}
      </Link>
    </li>
  );
}

export default async function AdminOverview() {
  const { db, org, user, today, now } = await loadAdmin();
  const inScope = (nodeId: string) => user.roles.some((r) => org.contains(r.nodeId, nodeId));
  const admin = canSeePeople(user);
  const hour = Number(now.slice(11, 13));
  const greeting = hour < 10 ? "God morgen" : hour < 18 ? "Hei" : "God kveld";
  const scope = scopeSummary(user, org);
  const topRole = [...user.roles].sort((a, b) => a.role.localeCompare(b.role))[0];

  const requests = canAnonymise(user) ? db.privacyRequests.filter((r) => r.status === "open") : [];
  const privacyContacts = canAnonymise(user) ? db.privacyContacts.filter((c) => c.status === "open") : [];
  const pending = db.articles.filter((a) => a.status === "pending" && canApprove(user, org, a.nodeId));
  const myPending = db.articles.filter((a) => a.status === "pending" && a.authorUserId === user.id);
  const homepage = canFeatureOnHomepage(user) ? db.articles.filter((a) => a.status === "published" && a.homepageRequested && !a.onHomepage) : [];
  const consentGaps = admin
    ? peopleInScope(user, org, db).filter((p) => p.privacy.status === "visible" && p.privacy.photoConsent === "unknown")
    : [];
  const noContacts = admin
    ? org.nodes.filter((n) => n.kind !== "club" && org.isLeaf(n.id) && inScope(n.id) && contactsFor(db, org, n.id, { inherit: false }).length === 0)
    : [];
  // Pictures a club administrator still has to check; they are live already, so only the wait matters.
  const photosToCheck = isClubAdmin(user) ? pendingPhotos(db) : [];
  const quotesToApprove = isClubAdmin(user) ? org.nodes.flatMap((n) => (n.quotes ?? []).filter((q) => q.front === "requested").map(() => n.name)) : [];
  const photosOverdue = photosToCheck.filter((p) => reviewState(p, now) === "overdue");
  const recent = db.articles
    .filter((a) => inScope(a.nodeId) || a.authorUserId === user.id)
    .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt))
    .slice(0, 6);
  const changed = org.nodes
    .filter((n) => n.updatedNote && inScope(n.id))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4);
  const log = (isClubAdmin(user) ? db.audit : db.audit.filter((e) => e.actorUserId === user.id)).slice(0, 5);
  const target = suggestedTarget(user, org);

  const attentionCount = requests.length + privacyContacts.length + pending.length + homepage.length + (consentGaps.length ? 1 : 0) + (noContacts.length ? 1 : 0) + (photosToCheck.length ? 1 : 0) + (quotesToApprove.length ? 1 : 0) + myPending.length;
  const names = (list: string[]) => (list.length > 2 ? `${list.slice(0, 2).join(", ")} og ${list.length - 2} til` : list.join(" og "));

  return (
    <div className="page pb-16">
      <AdminHeader
        eyebrow={
          <p className="t-small text-ink-3">{formatDateLong(today).replace(/^./, (c) => c.toUpperCase())}</p>
        }
        title={`${greeting}, ${user.name.split(" ")[0]}`}
        description={`${scope.role} · ${scope.scope}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Panel
            id="oppmerksomhet"
            accent={requests.length > 0 || photosOverdue.length > 0 ? "danger" : attentionCount > 0 ? "warning" : 2}
            title="Trenger oppmerksomhet"
            action={attentionCount > 0 ? <span className="t-meta text-ink-3 tnum">{attentionCount}</span> : undefined}
          >
            {attentionCount === 0 ? (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-6">
                <p className="t-small text-ink-2">Alt er i orden. Ingenting venter på deg nå.</p>
                {target && (
                  <Link href="/admin/publiser" className={buttonClass({ variant: "secondary", size: "sm" })}>
                    Skriv et innlegg
                  </Link>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {privacyContacts.length > 0 && (
                  <Attention icon={<ShieldAlert />} tone="danger" title="Personvernhenvendelser" href="/admin/personvern" action="Se henvendelsene">
                    {privacyContacts.length === 1 ? "1 åpen henvendelse" : `${privacyContacts.length} åpne henvendelser`} fra skjemaet på Om klubben: innsyn, sletting eller anonymisering.
                  </Attention>
                )}
                {requests.map((r) => {
                  const person = db.people.find((p) => p.id === r.personId);
                  const group = person ? org.get(person.memberships[0]?.nodeId) : undefined;
                  return (
                    <Attention
                      key={r.id}
                      icon={<ShieldAlert />}
                      tone="danger"
                      title="Forespørsel om anonymisering"
                      href={`/admin/personer/${r.personId}`}
                      action="Behandle"
                    >
                      {r.fromName} ({r.relation.toLowerCase()}) ber om at {person ? fullName(person) : "en person"}
                      {group ? `, ${group.name},` : ""} ikke lenger skal kunne kjennes igjen på nettsiden. Mottatt {formatDayMonth(r.receivedAt)}.
                    </Attention>
                  );
                })}
                {pending.map((a) => (
                  <Attention key={a.id} icon={<FileClock />} tone="warning" title="Innlegg venter på godkjenning" href="/admin/innhold" action="Se innlegget">
                    «{plain(a.title)}» fra {userById(db, a.authorUserId)?.name} til {org.get(a.nodeId)?.name}, {relativeTime(a.createdAt, now)}.
                  </Attention>
                ))}
                {myPending.map((a) => (
                  <Attention key={a.id} icon={<FileClock />} tone="neutral" hue={1} title="Ditt innlegg venter på godkjenning" href="/admin/innhold" action="Se status">
                    «{plain(a.title)}» til {org.get(a.nodeId)?.name}.
                  </Attention>
                ))}
                {homepage.map((a) => (
                  <Attention key={a.id} icon={<House />} tone="neutral" hue="club" title="Foreslått til forsiden" href="/admin/innhold?status=forsiden" action="Vurder">
                    {userById(db, a.authorUserId)?.name} foreslår «{plain(a.title)}».
                  </Attention>
                ))}
                {photosToCheck.length > 0 && (
                  <Attention
                    icon={<ImageIcon />}
                    tone={photosOverdue.length > 0 ? "danger" : "warning"}
                    title={photosToCheck.length === 1 ? "1 bilde venter på kontroll" : `${photosToCheck.length} bilder venter på kontroll`}
                    href="/admin/bilder"
                    action="Kontroller"
                  >
                    {photosOverdue.length > 0
                      ? `${photosOverdue.length === 1 ? "1 har" : `${photosOverdue.length} har`} ventet i over ${PHOTO_REVIEW_DAYS} dager. Bildene er allerede på nettsiden.`
                      : "Bildene er allerede på nettsiden. Se over hvem som tok dem og hvem som er med."}
                  </Attention>
                )}
                {quotesToApprove.length > 0 && (
                  <Attention
                    icon={<ImageIcon />}
                    tone="warning"
                    title={quotesToApprove.length === 1 ? "1 sitat venter på godkjenning for forsiden" : `${quotesToApprove.length} sitater venter på godkjenning for forsiden`}
                    href="/admin/sitater"
                    action="Se sitater"
                  >
                    Foreslått av {names([...new Set(quotesToApprove)])}. Først når du godkjenner, står de på forsiden.
                  </Attention>
                )}
                {consentGaps.length > 0 && (
                  <Attention icon={<Camera />} tone="neutral" hue={5} title="Mangler fotosamtykke" href="/admin/personer?vis=samtykke" action="Se personer">
                    {names(consentGaps.map(fullName))} har ikke registrert samtykke til bilder.
                  </Attention>
                )}
                {noContacts.length > 0 && (
                  <Attention icon={<UserRoundX />} tone="neutral" hue={6} title="Grupper uten kontaktperson" href="/admin/struktur?mangler=kontaktperson" action="Se struktur">
                    {names(noContacts.map((n) => n.name))} viser ingen trener eller lagleder på nettsiden.
                  </Attention>
                )}
              </ul>
            )}
          </Panel>

          <Panel id="sist" accent={1} title="Sist publisert" action={<Link href="/admin/innhold" className="t-small text-ink-3 hover:text-ink">Alle innlegg</Link>}>
            <ul className="divide-y divide-line">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate t-label">{plain(a.title)}</p>
                    <p className="truncate t-small text-ink-3">
                      {org.get(a.nodeId)?.name} · {userById(db, a.authorUserId)?.name} · {relativeTime(a.publishedAt ?? a.createdAt, now)}
                    </p>
                  </div>
                  {a.status === "pending" && <Status tone="warning">Til godkjenning</Status>}
                  {a.status === "rejected" && <Status tone="neutral">Avvist</Status>}
                  {a.privacyEditedAt && <Status tone="ink">Personvernredigert</Status>}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <QuickPublish targetId={target} targetName={target ? org.get(target)?.name : undefined} />

          <Panel id="tilgang" accent={topRole ? ROLE_HUE_OF(topRole.role) : "neutral"} title="Din tilgang">
            <div className="px-4 py-4 sm:px-5">
              <RoleChip role={topRole?.role ?? "contributor"} className="!text-[13px] !px-2 !py-1">{scope.role}</RoleChip>
              <p className="mt-2 t-label">{scope.scope}</p>
              {/* What the person may do, ticked off the permissions they hold; reading what is in their area is always included. */}
              <ul className="mt-3 grid gap-1.5">
                {PERMISSIONS.filter((p) => canAnywhere(user, p.id) && !(p.id === "write_posts" && canAnywhere(user, "publish_posts"))).map((p) => (
                  <li key={p.id} className="flex gap-2 t-small text-ink-2">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                    {p.label}
                  </li>
                ))}
                <li className="flex gap-2 t-small text-ink-3">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0" />
                  Se alt innhold i området
                </li>
              </ul>
              <Link href="/admin/struktur" className="mt-3 inline-block t-small font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current">
                Se hvem som kan hva
              </Link>
            </div>
          </Panel>

          {changed.length > 0 && (
            <Panel id="endret" accent={6} title="Nylig endret">
              <ul className="divide-y divide-line">
                {changed.map((n) => (
                  <li key={n.id} className="px-4 py-3 sm:px-5">
                    <p className="t-label">
                      <Link href={`/admin/struktur?node=${n.id}`} className="hover:underline">
                        {n.name}
                      </Link>
                      <span className="font-normal text-ink-2"> · {n.updatedNote}</span>
                    </p>
                    <p className="t-small text-ink-3">
                      {userById(db, n.updatedByUserId)?.name ?? "Klubben"}, {relativeTime(n.updatedAt, now)}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {log.length > 0 && (
            <Panel id="logg" accent="neutral" title="Logg">
              <ul className="divide-y divide-line">
                {log.map((e) => (
                  <li key={e.id} className="px-4 py-3 sm:px-5">
                    <p className="t-small text-ink">{e.summary}</p>
                    <p className="t-meta text-ink-3">
                      {userById(db, e.actorUserId)?.name ?? "Via e-post"}, {relativeTime(e.at, now)}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}
