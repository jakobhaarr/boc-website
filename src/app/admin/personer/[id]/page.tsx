import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PersonPrivacy, type PersonPrivacyData } from "@/components/admin/person-privacy";
import { Breadcrumb } from "@/components/ui/primitives";
import { fullName, membershipTitle, userById } from "@/lib/content";
import { formatDateFull, formatDayMonth, formatTime } from "@/lib/dates";
import { loadAdmin } from "@/lib/data/queries";
import { canAnonymise, canRecordConsent, canSeePeople, peopleInScope, scopeSummary } from "@/lib/permissions";
import { seasonOf } from "@/lib/seasons";
import { articleHref } from "@/lib/content";
import { ACTIVITY_ROLE_LABEL, publishedPresence, WHERE_LABEL } from "@/lib/privacy";
import { plain } from "@/lib/rich-text";
import { toActivityView } from "@/lib/views";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { db } = await loadAdmin();
  const p = db.people.find((x) => x.id === id);
  return { title: p ? fullName(p) : "Person" };
}

export default async function PersonPage({ params }: Props) {
  const { id } = await params;
  const { db, org, user, today } = await loadAdmin();
  if (!canSeePeople(user)) redirect("/admin");
  const person = peopleInScope(user, org, db).find((p) => p.id === id);
  if (!person) notFound();

  const presence = publishedPresence(db, org, person.id);
  const request = db.privacyRequests.find((r) => r.personId === person.id && r.status === "open");
  const audit = db.audit.find((e) => e.action === "anonymise" && e.personId === person.id);
  const guardians = (person.guardianUserIds ?? []).flatMap((gid) => db.users.filter((u) => u.id === gid));
  const ownUser = person.userId ? userById(db, person.userId) : undefined;
  const age = person.birthYear ? seasonOf(today) - person.birthYear : undefined;

  const data: PersonPrivacyData = {
    person: {
      id: person.id,
      name: fullName(person),
      firstName: person.firstName,
      birthYear: person.birthYear,
      status: person.privacy.status,
      consent: person.privacy.photoConsent,
      consentBy: person.privacy.consentBy,
      consentAt: person.privacy.consentUpdatedAt ? formatDateFull(person.privacy.consentUpdatedAt) : undefined,
    },
    memberships: person.memberships.map((m) => ({
      role: membershipTitle(m.role, m.title, org.sportOf(m.nodeId)?.id),
      path: org.trail(m.nodeId).map((n) => n.name).join(" › "),
      href: org.href(m.nodeId),
    })),
    account: {
      own: ownUser ? { email: ownUser.email, providers: ownUser.authProviders } : undefined,
    },
    guardianship: {
      personId: person.id,
      firstName: person.firstName,
      age,
      // Under 16 in the current season: age classes follow the calendar year.
      minor: age !== undefined && age < 16,
      groupName: org.get(person.memberships[0]?.nodeId ?? "")?.name,
      consent: person.privacy.photoConsent,
      consentBy: person.privacy.consentBy,
      consentAt: person.privacy.consentUpdatedAt ? formatDateFull(person.privacy.consentUpdatedAt) : undefined,
      canRecord: canRecordConsent(user, org, person),
      guardians: guardians.map((g) => ({ id: g.id, name: g.name, email: g.email, phone: g.phone, providers: g.authProviders })),
    },
    request: request
      ? { from: request.fromName, relation: request.relation, receivedAt: formatDayMonth(request.receivedAt), message: request.message }
      : undefined,
    presence: {
      photos: presence.photos.map((p) => ({ photo: p.photo, region: p.region, uses: p.uses })),
      text: presence.text.map((t) => ({ ...t, whereLabel: WHERE_LABEL[t.where] })),
      activities: presence.activities.map(({ activity, role }) => {
        const before = toActivityView(activity, db, org);
        const after = toActivityView(
          { ...activity, people: activity.people?.map((p) => (p.personId === person.id ? { ...p, personId: null } : p)) },
          db,
          org,
        );
        const label = role === "scorer" ? "Mål" : role === "selected" ? "Tatt ut" : "Vakt";
        return {
          id: activity.id,
          title: before.title,
          when: `${formatDayMonth(activity.date)} kl. ${formatTime(activity.start)}`,
          role: ACTIVITY_ROLE_LABEL[role],
          before: before.people.find((p) => p.label === label)?.text ?? "",
          after: after.people.find((p) => p.label === label)?.text ?? "",
          label,
        };
      }),
      articleCount: presence.articleIds.length,
      pageCount: new Set(presence.photos.flatMap((p) => p.uses.filter((u) => u.kind !== "article").map((u) => u.href))).size,
    },
    canAnonymise: canAnonymise(user),
    actorRole: scopeSummary(user, org).role,
    completed: audit
      ? {
          at: `${formatDateFull(audit.at.slice(0, 10))} kl. ${formatTime(audit.at.slice(11, 16))}`,
          by: userById(db, audit.actorUserId)?.name ?? "",
          summary: audit.summary,
          articles: (audit.report?.articlesChanged ?? []).flatMap((aid) =>
            db.articles.filter((a) => a.id === aid && a.status === "published").map((a) => ({ title: plain(a.title), href: articleHref(a) })),
          ),
        }
      : undefined,
  };

  return (
    <div className="page pb-16">
      <Breadcrumb className="pt-6 md:pt-8" items={[{ label: "Personer", href: "/admin/personer" }, { label: fullName(person) }]} />
      <PersonPrivacy data={data} />
    </div>
  );
}
