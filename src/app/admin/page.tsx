import { CalendarX2, Camera, FileClock, House, ShieldAlert, UserRoundX } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { QuickPublish } from "@/components/admin/quick-publish";
import { buttonClass } from "@/components/ui/button";
import { Status } from "@/components/ui/primitives";
import { headline, upcoming } from "@/lib/activities";
import { cn } from "@/lib/cn";
import { contactsFor, fullName, userById } from "@/lib/content";
import { dayHeading, formatDateLong, formatDayMonth, formatTime, relativeTime } from "@/lib/dates";
import { loadAdmin } from "@/lib/data/queries";
import {
  canAnonymise,
  canApprove,
  canFeatureOnHomepage,
  canSeePeople,
  isClubAdmin,
  peopleInScope,
  ROLE_EXPLAINER,
  scopeSummary,
  suggestedTarget,
} from "@/lib/permissions";
import { plain } from "@/lib/rich-text";

export const metadata = { title: "Oversikt" };

function Attention({
  icon,
  tone,
  title,
  children,
  href,
  action,
}: {
  icon: ReactNode;
  tone: "danger" | "warning" | "neutral";
  title: string;
  children: ReactNode;
  href: string;
  action: string;
}) {
  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="flex min-w-0 flex-1 gap-3.5">
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md [&_svg]:size-4",
            tone === "danger" && "bg-danger-surface text-danger",
            tone === "warning" && "bg-warning-surface text-warning",
            tone === "neutral" && "bg-sunken text-ink-2",
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
  const pending = db.articles.filter((a) => a.status === "pending" && canApprove(user, org, a.nodeId));
  const myPending = db.articles.filter((a) => a.status === "pending" && a.authorUserId === user.id);
  const homepage = canFeatureOnHomepage(user) ? db.articles.filter((a) => a.status === "published" && a.homepageRequested && !a.onHomepage) : [];
  const consentGaps = admin
    ? peopleInScope(user, org, db).filter((p) => p.privacy.status === "visible" && p.privacy.photoConsent === "unknown")
    : [];
  const noContacts = admin
    ? org.nodes.filter((n) => n.kind !== "club" && org.isLeaf(n.id) && inScope(n.id) && contactsFor(db, org, n.id, { inherit: false }).length === 0)
    : [];
  const cancelled = upcoming(
    db.activities.filter((a) => inScope(a.nodeId) && a.status === "cancelled"),
    today,
    7,
  );

  const week = upcoming(
    db.activities.filter((a) => inScope(a.nodeId)),
    today,
    6,
  ).slice(0, 9);
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

  const attentionCount = requests.length + pending.length + homepage.length + (consentGaps.length ? 1 : 0) + (noContacts.length ? 1 : 0) + myPending.length;
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
            title="Trenger oppmerksomhet"
            action={attentionCount > 0 ? <span className="t-meta text-ink-3 tnum">{attentionCount}</span> : undefined}
          >
            {attentionCount === 0 ? (
              <p className="px-5 py-6 t-small text-ink-2">Ingenting venter på deg nå.</p>
            ) : (
              <ul className="divide-y divide-line">
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
                  <Attention key={a.id} icon={<FileClock />} tone="neutral" title="Ditt innlegg venter på godkjenning" href="/admin/innhold" action="Se status">
                    «{plain(a.title)}» til {org.get(a.nodeId)?.name}.
                  </Attention>
                ))}
                {homepage.map((a) => (
                  <Attention key={a.id} icon={<House />} tone="neutral" title="Foreslått til forsiden" href="/admin/innhold?status=forsiden" action="Vurder">
                    {userById(db, a.authorUserId)?.name} foreslår «{plain(a.title)}».
                  </Attention>
                ))}
                {consentGaps.length > 0 && (
                  <Attention icon={<Camera />} tone="neutral" title="Mangler fotosamtykke" href="/admin/personer?vis=samtykke" action="Se personer">
                    {names(consentGaps.map(fullName))} har ikke registrert samtykke til bilder.
                  </Attention>
                )}
                {noContacts.length > 0 && (
                  <Attention icon={<UserRoundX />} tone="neutral" title="Grupper uten kontaktperson" href="/admin/struktur" action="Se struktur">
                    {names(noContacts.map((n) => n.name))} viser ingen trener eller lagleder på nettsiden.
                  </Attention>
                )}
              </ul>
            )}
          </Panel>

          <Panel id="uken" title="Denne uken" action={admin ? <Link href="/admin/aktiviteter" className="t-small text-ink-3 hover:text-ink">Alle aktiviteter</Link> : undefined}>
            {week.length === 0 ? (
              <p className="px-5 py-6 t-small text-ink-2">Ingen aktiviteter de neste sju dagene.</p>
            ) : (
              <ul className="divide-y divide-line">
                {week.map((a, i) => {
                  const h = headline(a, org);
                  const day = dayHeading(a.date, today);
                  const firstOfDay = i === 0 || week[i - 1].date !== a.date;
                  return (
                    <li key={a.id} className="grid grid-cols-[4.5rem_3rem_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-2.5 t-small sm:grid-cols-[6rem_3.5rem_minmax(0,1fr)_auto] sm:px-5">
                      <span className={cn("truncate", firstOfDay ? "font-medium text-ink" : "text-transparent select-none")} aria-hidden={!firstOfDay}>
                        {day.primary}
                      </span>
                      <span className={cn("tnum", a.status === "cancelled" ? "text-ink-3 line-through" : "text-ink")}>{formatTime(a.start)}</span>
                      <span className="min-w-0 truncate">
                        <span className={cn("font-medium", a.status === "cancelled" && "text-ink-3 line-through")}>{h.title}</span>
                        <span className="text-ink-3"> · {h.subtitle}</span>
                      </span>
                      {a.status === "cancelled" ? <Status tone="danger">Avlyst</Status> : <span />}
                    </li>
                  );
                })}
              </ul>
            )}
            {cancelled.length > 0 && (
              <p className="flex items-center gap-2 border-t border-line px-5 py-3 t-small text-ink-3">
                <CalendarX2 aria-hidden className="size-4" />
                {cancelled.length === 1 ? "1 avlyst aktivitet" : `${cancelled.length} avlyste aktiviteter`} vises som avlyst i den offentlige kalenderen.
              </p>
            )}
          </Panel>

          <Panel id="sist" title="Sist publisert" action={<Link href="/admin/innhold" className="t-small text-ink-3 hover:text-ink">Alt innhold</Link>}>
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

          <Panel id="tilgang" title="Din tilgang">
            <div className="px-4 py-4 sm:px-5">
              <p className="t-label font-semibold">{scope.role}</p>
              <p className="t-small text-ink-2">{scope.scope}</p>
              {topRole && <p className="mt-2 t-small text-ink-3">{ROLE_EXPLAINER[[...user.roles].sort((a, b) => "cgsgc".indexOf(a.role[0]) - "cgsgc".indexOf(b.role[0]))[0].role]}</p>}
              <Link href="/admin/struktur" className="mt-3 inline-block t-small font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-current">
                Slik fungerer roller
              </Link>
            </div>
          </Panel>

          {changed.length > 0 && (
            <Panel id="endret" title="Nylig endret">
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
            <Panel id="logg" title="Logg">
              <ul className="divide-y divide-line">
                {log.map((e) => (
                  <li key={e.id} className="px-4 py-3 sm:px-5">
                    <p className="t-small text-ink">{e.summary}</p>
                    <p className="t-meta text-ink-3">
                      {userById(db, e.actorUserId)?.name}, {relativeTime(e.at, now)}
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
