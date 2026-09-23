import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ExplorerGroup } from "@/components/public/activity-explorer";
import { ContactPerson } from "@/components/public/people";
import { Photo } from "@/components/public/photo";
import { ButtonLink, ExternalButton, HoverArrow } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { Breadcrumb, SectionHeader, TextLink } from "@/components/ui/primitives";
import { fullName, membershipTitle, photoById } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { youthExplorer } from "@/lib/finder";
import type { Photo as PhotoRecord } from "@/lib/types";

/**
 * The club from a parent's side.
 *
 * A parent searching "sykkelklubb barn bærum" is looking, not deciding: they
 * know what they want and need a path to it. The front page has the opposite
 * job — it has to give an undecided adult a reason — and one hero cannot do
 * both without saying nothing. So this is its own page with its own title and
 * description, and the search engine sends each visitor to the right one.
 * That is the whole routing mechanism: a query never reaches us, so nothing
 * here is chosen at runtime.
 *
 * Everything on it is derived from the club's own structure, so a club with
 * no children's groups simply has no page to fill.
 */

const listOf = (parts: string[]) =>
  parts.length > 1 ? `${parts.slice(0, -1).join(", ")} og ${parts[parts.length - 1]}` : (parts[0] ?? "");

function YouthGroupCard({ group, fallbackPhoto }: { group: ExplorerGroup; fallbackPhoto?: PhotoRecord }) {
  const cardPhoto = group.photo ?? fallbackPhoto;
  return (
    <li className="h-full">
      <Link
        href={group.href}
        className="group flex h-full flex-col overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-raised"
      >
        {cardPhoto && (
          <Photo
            photo={cardPhoto}
            ratio={16 / 9}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
            className="rounded-none"
          />
        )}
        <span className="flex flex-1 flex-col p-5">
          <span className="flex items-start justify-between gap-3">
            <span className="flex items-center text-[16px] font-semibold tracking-[-0.01em] text-ink">
              {group.name}
              <HoverArrow />
            </span>
            <span className="shrink-0 pt-0.5 t-meta text-ink-2 tnum">{group.ageLabel}</span>
          </span>
          <span className="mt-2 block t-small text-ink-2">{group.schedule}</span>
        </span>
      </Link>
    </li>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { db, org, today } = await loadSite();
  const { youth } = youthExplorer(db, org, today);
  const groups = youth.flatMap((s) => s.branches.flatMap((b) => b.groups));
  if (!groups.length) return { title: "Barn og ungdom" };

  const from = Math.min(...groups.map((g) => g.ageRange[0]));
  const what = listOf(youth.map((s) => s.name));
  const branches = listOf(youth.flatMap((s) => s.branches.map((b) => b.name)));

  return {
    // Absolute, because the club name alone does not say what a parent searched for.
    title: { absolute: `${what} for barn og ungdom – ${db.club.name}` },
    description:
      `${db.club.shortName} har ${groups.length} grupper for barn og ungdom fra ${from} år: ${branches}. ` +
      "Alle kan prøve før innmelding.",
  };
}

export default async function YouthPage() {
  const { db, org, today } = await loadSite();
  const { club } = db;
  const { youth: sports, mixed } = youthExplorer(db, org, today);
  const groups = sports.flatMap((s) => s.branches.flatMap((b) => b.groups));
  const mixedGroups = mixed.flatMap((s) => s.branches.flatMap((b) => b.groups));
  const fromAge = groups.length ? Math.min(...groups.map((g) => g.ageRange[0])) : 0;
  const toAge = groups.length ? Math.max(...groups.map((g) => g.ageRange[1])) : 0;
  // The page's promise is to children, and a child is under 18; Junior reaching 18 does not change that.
  const childTo = Math.min(toAge, 17);
  const mixedFrom = mixedGroups.length ? Math.min(...mixedGroups.map((g) => g.ageRange[0])) : 0;
  const single = sports.length === 1;

  // A club with nothing for children has no page here, and the footer does not link to one.
  if (!groups.length) notFound();

  // The picture should show a child, so it comes from the youngest group that has one.
  const youngest = [...groups].sort((a, b) => a.ageRange[0] - b.ageRange[0]).find((g) => g.photo);
  const photo = youngest?.photo ?? photoById(db, club.heroPhotoId);
  // The top of the page can be the club's own pick; the group cards keep falling back to the youngest group's.
  const heroPhoto = photoById(db, club.youthPhotoId) ?? photo;

  /* Whoever runs a branch is the person a parent writes to. */
  const leads = db.people.flatMap((p) =>
    p.memberships
      .filter((m) => m.role === "sectionLead" || m.role === "coach")
      .filter((m) => sports.some((s) => s.branches.some((b) => b.id === m.nodeId || b.groups.some((g) => g.id === m.nodeId))))
      .map((m) => ({ person: p, membership: m })),
  );
  const contacts = leads.filter((c, i) => leads.findIndex((x) => x.person.id === c.person.id) === i).slice(0, 3);

  const steps = [
    {
      title: "Finn en gruppe",
      text: `Velg etter alder og ${single ? "disiplin" : "idrett"} nedenfor. Hver gruppe har sin egen side med treningstider, sted og hvem som er trener.`,
    },
    {
      title: "Bli med på en trening",
      text: "Ta kontakt med treneren, så kan barnet prøve før dere bestemmer dere.",
    },
    {
      title: "Meld dere inn",
      text: "Når dere vil fortsette, melder dere inn. Kontingenten faktureres én gang i året, og treningsavgift kommer i tillegg per disiplin.",
    },
  ];

  return (
    <>
      {/* Who this is for, and what the club has */}
      <Section className="pb-16 lg:pb-24">
        <div className="page pt-6 lg:pt-10">
          <Breadcrumb items={[{ label: club.name, href: "/" }, { label: "Barn og ungdom" }]} />
          <div className="mt-8 grid-page items-center gap-y-10 lg:mt-12">
            <div className="col-span-4 md:col-span-8 lg:col-span-6">
              <p className="t-eyebrow">Barn og ungdom</p>
              <h1 className="mt-3 t-display">
                Fra {fromAge}–{childTo} år. <span className="text-ink-3">Alle kan prøve gratis før man melder seg inn.</span>
              </h1>
              <p className="mt-6 max-w-[48ch] t-body-lg text-ink-2">
                {club.name} har {groups.length} grupper for barn og ungdom{single ? ` i ${listOf(sports[0].branches.map((b) => b.name))}` : ""}.
                Trenerne er frivillige fra klubben.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
                <ButtonLink href="#gruppene" size="lg" brand arrow>
                  Se gruppene
                </ButtonLink>
                <TextLink href="#kontingent" className="t-small">
                  Hva det koster
                </TextLink>
              </div>
            </div>
            {heroPhoto && (
              <div className="col-span-4 max-lg:order-first md:col-span-8 lg:col-span-6 lg:col-start-7">
                <Photo photo={heroPhoto} ratio={4 / 3} priority sizes="(min-width: 1024px) 640px, 100vw" className="rounded-lg md:rounded-xl" />
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* The navigational payload: every group a child can join, with its age */}
      <Section id="gruppene" labelledBy="gruppene-tittel" rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
        <div className="page">
          <SectionHeader
            id="gruppene-tittel"
            eyebrow="Gruppene"
            title={`${groups.length} grupper for barn og ungdom.`}
            titleMuted={`Fra ${fromAge} til ${toAge} år.`}
          />
          <div className="mt-12 space-y-14">
            {sports.map((sport) => (
              <div key={sport.id}>
                {!single && (
                  <h3 className="border-b border-guide pb-3 t-h3">
                    <Link href={sport.href} className="transition-colors hover:text-club">
                      {sport.name}
                    </Link>
                  </h3>
                )}
                <div className="grid gap-y-10 md:grid-cols-2 md:gap-x-[var(--grid-gap)] lg:grid-cols-3">
                  {sport.branches.map((branch) => (
                    <section key={branch.id} aria-labelledby={`gren-${branch.id}`} className={!single ? "mt-8" : ""}>
                      <h4 id={`gren-${branch.id}`} className="border-b border-guide pb-2.5 t-label font-semibold">
                        {branch.name}
                      </h4>
                      <ul className="mt-4 grid gap-4">
                        {branch.groups.map((g) => <YouthGroupCard key={g.id} group={g} fallbackPhoto={photo} />)}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Adult groups a teenager may join — kept apart, not folded in */}
      {mixedGroups.length > 0 && (
        <Section labelledBy="ogsa-tittel" rule="top" className="py-20 lg:py-28">
          <div className="page">
            <SectionHeader
              id="ogsa-tittel"
              eyebrow="Også åpne for ungdom"
              title={`${mixedGroups.length} grupper trener på tvers av alder.`}
              titleMuted={`Voksengrupper som tar imot ungdom fra ${mixedFrom} år.`}
            />
            <ul className="mt-10 grid gap-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-3">
              {mixedGroups.map((g) => <YouthGroupCard key={g.id} group={g} fallbackPhoto={photo} />)}
            </ul>
          </div>
        </Section>
      )}

      {/* How a family actually starts */}
      <Section labelledBy="steg-tittel" tone="sunken" rule="top" className="py-20 lg:py-28">
        <div className="page grid-page gap-y-10">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <p className="t-eyebrow">Tre steg</p>
            <h2 id="steg-tittel" className="mt-3 t-h2">
              Slik begynner dere
            </h2>
          </div>
          <ol className="col-span-4 grid gap-y-10 md:col-span-8 md:grid-cols-3 md:gap-x-[var(--grid-gap)] lg:col-span-9 lg:col-start-4">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t border-guide pt-5">
                <span className="font-display text-[2.75rem] leading-none font-medium tracking-[-0.04em] text-club tnum">{i + 1}</span>
                <h3 className="mt-5 t-h3">{s.title}</h3>
                <p className="mt-2 t-small text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* What it costs a family */}
      <Section id="kontingent" labelledBy="kontingent-tittel" rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
        <div className="page grid-page gap-y-10">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <p className="t-eyebrow">Kontingent</p>
            <h2 id="kontingent-tittel" className="mt-3 t-h2">
              Hva det koster
            </h2>
            <p className="mt-4 max-w-[36ch] t-small text-ink-2">{club.membership.note}</p>
            <TextLink href="/bli-med" className="mt-4 t-small">
              Alt om medlemskap
            </TextLink>
          </div>
          <dl className="col-span-4 grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line md:col-span-8 md:grid-cols-2 md:divide-x md:divide-line lg:col-span-9 lg:col-start-4">
            {(
              [
                ["Barn og ungdom", club.membership.youth, "Under 20 år"],
                ["Familie", club.membership.family, "Alle i samme husstand"],
              ] as const
            ).map(([label, amount, hint]) => (
              <div key={label} className="border-b border-line p-6 last:border-b-0 md:border-b-0">
                <dt className="t-small text-ink-2">{label}</dt>
                <dd className="mt-4 font-display text-[2.5rem] leading-none font-medium tracking-[-0.035em] tnum">
                  {amount} <span className="t-body tracking-normal text-ink-3">kr i året</span>
                </dd>
                <dd className="mt-2 t-small text-ink-3">{hint}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* A name to write to, and the way in */}
      <Section labelledBy="kontakt-tittel" tone="sunken" rule="top" className="py-20 lg:py-28">
        <div className="page grid-page gap-y-8">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <p className="t-eyebrow">Spørsmål?</p>
            <h2 id="kontakt-tittel" className="mt-3 t-h2">
              Ta kontakt
            </h2>
            <p className="mt-4 max-w-[34ch] t-small text-ink-2">
              Alt arbeid i klubben gjøres av frivillige. Spør gjerne før dere møter opp første gang.
            </p>
            {club.signupUrl && (
              <ExternalButton href={club.signupUrl} className="mt-6">
                Meld inn i {club.shortName}
                <ArrowUpRight aria-hidden />
              </ExternalButton>
            )}
          </div>
          <div className="col-span-4 grid grid-cols-[minmax(0,1fr)] md:col-span-8 md:grid-cols-3 md:gap-x-[var(--grid-gap)] lg:col-span-9 lg:col-start-4">
            {contacts.map((c) => (
              <div key={c.person.id} className="border-t border-guide">
                <ContactPerson
                  name={fullName(c.person)}
                  title={membershipTitle(c.membership.role, c.membership.title)}
                  phone={c.person.publicContact?.phone}
                  email={c.person.publicContact?.email}
                  className="pt-5"
                />
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
