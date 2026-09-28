import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { GlossaryText } from "@/components/public/glossary";
import { GroupBrowser } from "@/components/public/group-browser";
import { MemberDeck } from "@/components/public/member-deck";
import { ContactPerson } from "@/components/public/people";
import { Photo } from "@/components/public/photo";
import { StravaLink } from "@/components/public/strava-link";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { Breadcrumb, SectionHeader, TextLink } from "@/components/ui/primitives";
import { fullName, membershipTitle, photoById, portraitOf, testimonialsFor } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { youthExplorer } from "@/lib/finder";
import { groupBrowserEntries } from "@/lib/nav";

export const metadata: Metadata = { title: "Bli medlem" };

export default async function JoinPage() {
  const { db, org, singleSport, today } = await loadSite();
  const { club } = db;
  const photo = photoById(db, "ph-community");
  const groups = org.nodes.filter((n) => n.kind !== "club" && org.isLeaf(n.id));
  const leads = db.people.flatMap((p) =>
    p.memberships.filter((m) => m.role === "sectionLead").map((m) => ({ person: p, membership: m, sport: org.get(m.nodeId)?.name })),
  );
  const manager = db.people.find((p) => p.memberships.some((m) => m.nodeId === club.id && m.role === "generalManager"));
  const hasYouth = youthExplorer(db, org, today).youth.length > 0;
  // The faces from «Fra medlemmene», as a small deck beside the invitation.
  const faces = testimonialsFor(db, org, today).flatMap((t) => (t.photo && t.inDeck ? [{ photo: t.photo, shade: t.shade }] : []));

  const steps = [
    {
      title: "Finn en gruppe",
      text: `Velg ${singleSport ? "disiplin" : "idrett"} nedenfor. Hver gruppe har sin egen side med treningstider, sted og hvem som er trener.`,
    },
    {
      title: "Møt opp på en trening",
      text: "Tid og oppmøtested står på gruppesiden. Du trenger ikke være medlem for å bli med, og treneren eller laglederen svarer gjerne om du lurer på noe.",
    },
    {
      title: "Meld deg inn",
      text: `${club.membership.requiredFor ? `${club.membership.requiredFor} ` : ""}Innmeldingen er digital. Kontingenten faktureres én gang i året, og treningsavgift kommer i tillegg.`,
    },
  ];

  return (
    <>
      <Section className="pb-16 lg:pb-24">
        <div className="page pt-6 lg:pt-10">
          <Breadcrumb items={[{ label: club.name, href: "/" }, { label: "Bli medlem" }]} />
          <div className="mt-8 grid-page items-center gap-y-10 lg:mt-12">
            <div className="col-span-4 md:col-span-8 lg:col-span-6">
              <p className="t-eyebrow">Bli medlem</p>
              <h1 className="mt-3 t-display">
                Bare møt opp. <span className="text-ink-3">Meld deg inn når du vil være med på mer.</span>
              </h1>
              <p className="mt-6 max-w-[48ch] t-body-lg text-ink-2">
                Alle kan møte opp på en trening, uansett alder. Klubben har {groups.length} lag og grupper å velge mellom.
              </p>
              {hasYouth && (
                <p className="mt-4 t-small text-ink-2">
                  Leter du på vegne av et barn? <TextLink href="/barn-og-ungdom">Se gruppene for barn og ungdom</TextLink>
                </p>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
                {/* Clubs that sign members up elsewhere (BOC uses Spond) send
                    people straight there; the rest keep the internal flow. */}
                {club.signupUrl ? (
                  <>
                    <ExternalButton href={club.signupUrl} size="lg" brand>
                      Meld deg inn i {club.shortName}
                      <ArrowUpRight aria-hidden />
                    </ExternalButton>
                    <TextLink href="#finn-aktivitet" className="t-small">
                      Finn din aktivitet først
                    </TextLink>
                    {club.stravaClubUrl && <StravaLink url={club.stravaClubUrl}>{`Bli med i ${club.shortName} på Strava`}</StravaLink>}
                  </>
                ) : (
                  <>
                    <ButtonLink href="#finn-aktivitet" size="lg" brand arrow>
                      Finn din aktivitet
                    </ButtonLink>
                    <TextLink href="#kontingent" className="t-small">
                      Se kontingent
                    </TextLink>
                    {club.stravaClubUrl && <StravaLink url={club.stravaClubUrl}>{`Bli med i ${club.shortName} på Strava`}</StravaLink>}
                  </>
                )}
              </div>
            </div>
            {photo ? (
              <div className="relative col-span-4 max-lg:order-first md:col-span-8 lg:col-span-6 lg:col-start-7">
                <Photo photo={photo} ratio={4 / 3} priority sizes="(min-width: 1024px) 640px, 100vw" className="rounded-lg md:rounded-xl" />
                {faces.length > 1 && <MemberDeck cards={faces} className="absolute -bottom-10 left-6 max-sm:hidden" />}
              </div>
            ) : (
              faces.length > 1 && (
                <div className="col-span-4 flex justify-center py-6 md:col-span-8 lg:col-span-6 lg:col-start-7 lg:py-0">
                  <MemberDeck cards={faces} />
                </div>
              )
            )}
          </div>
        </div>
      </Section>

      <Section labelledBy="steg" tone="sunken" rule="top" className="py-20 lg:py-28">
        <div className="page grid-page gap-y-10">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <p className="t-eyebrow">Tre steg</p>
            <h2 id="steg" className="mt-3 t-h2">
              Slik blir du medlem
            </h2>
          </div>
          <ol className="col-span-4 grid gap-y-10 md:col-span-8 md:grid-cols-3 md:gap-x-[var(--grid-gap)] lg:col-span-9 lg:col-start-4">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t border-guide pt-5">
                <span className="font-display text-[2.75rem] leading-none font-medium tracking-[-0.04em] text-club tnum">{i + 1}</span>
                <h3 className="mt-5 t-h3">{s.title}</h3>
                <p className="mt-2 t-small text-ink-2">
                  <GlossaryText text={s.text} />
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section id="finn-aktivitet" labelledBy="finn-tittel" rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
        <div className="page">
          <SectionHeader id="finn-tittel" eyebrow="Finn din aktivitet" title={`${groups.length} lag og grupper.`} titleMuted={`Velg ${singleSport ? "disiplin" : "idrett"}, så ser du gruppene og når de trener.`} />
          <div className="mt-10 lg:mt-12">
            <GroupBrowser entries={groupBrowserEntries(db, org, today)} label={singleSport ? "Grupper" : "Idretter"} />
          </div>
        </div>
      </Section>

      <Section id="kontingent" labelledBy="kontingent-tittel" tone="sunken" rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
        <div className="page grid-page gap-y-10">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <p className="t-eyebrow">Kontingent</p>
            <h2 id="kontingent-tittel" className="mt-3 t-h2">
              Hva det koster
            </h2>
            <p className="mt-4 max-w-[36ch] t-small text-ink-2">
              <GlossaryText text={club.membership.note} />
            </p>
          </div>
          <div className="col-span-4 md:col-span-8 lg:col-span-9 lg:col-start-4">
            <dl className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line md:grid-cols-3 md:divide-x md:divide-line">
              {club.membership.rates
                .filter((r) => !r.minor)
                .map((r) => (
                  <div key={r.label} className="border-b border-line p-6 last:border-b-0 md:border-b-0">
                    <dt className="t-small text-ink-2">{r.label}</dt>
                    <dd className="mt-4 font-display text-[2.5rem] leading-none font-medium tracking-[-0.035em] tnum">
                      {r.amount} <span className="t-body tracking-normal text-ink-3">kr i året</span>
                    </dd>
                    {r.hint && <dd className="mt-2 t-small text-ink-3">{r.hint}</dd>}
                  </div>
                ))}
            </dl>
            {club.membership.rates.some((r) => r.minor) && (
              <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 t-small">
                {club.membership.rates
                  .filter((r) => r.minor)
                  .map((r) => (
                    <div key={r.label} className="flex gap-1.5">
                      <dt className="text-ink-2">{r.label}:</dt>
                      <dd className="tnum text-ink">
                        {r.amount} kr{r.hint && <span className="text-ink-3"> ({r.hint.charAt(0).toLowerCase() + r.hint.slice(1)})</span>}
                      </dd>
                    </div>
                  ))}
              </dl>
            )}
          </div>
        </div>
      </Section>

      <Section labelledBy="kontakt-tittel" rule="top" className="py-20 lg:py-28">
        <div className="page grid-page gap-y-8">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <p className="t-eyebrow">Spørsmål?</p>
            <h2 id="kontakt-tittel" className="mt-3 t-h2">
              Kontakt
            </h2>
            {manager && (
              <p className="mt-4 t-small text-ink-2">
                Generelle spørsmål om medlemskap: <a href={`mailto:${club.email}`} className="link text-ink">{club.email}</a>
              </p>
            )}
          </div>
          <div className="col-span-4 grid grid-cols-[minmax(0,1fr)] md:col-span-8 md:grid-cols-3 md:gap-x-[var(--grid-gap)] lg:col-span-9 lg:col-start-4">
            {leads.map((c) => (
              <div key={c.person.id} className="border-t border-guide">
                <ContactPerson
                  name={fullName(c.person)}
                  photo={portraitOf(db, c.person)}
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
