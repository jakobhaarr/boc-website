import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { ActivityExplorer } from "@/components/public/activity-explorer";
import { ContactPerson } from "@/components/public/people";
import { Photo } from "@/components/public/photo";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { Breadcrumb, SectionHeader, TextLink } from "@/components/ui/primitives";
import { fullName, membershipTitle, photoById } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { buildExplorer, youthExplorer } from "@/lib/finder";

export const metadata: Metadata = { title: "Bli medlem" };

export default async function JoinPage() {
  const { db, org, today } = await loadSite();
  const { club } = db;
  const photo = photoById(db, "ph-community");
  const groups = org.nodes.filter((n) => n.kind !== "club" && org.isLeaf(n.id));
  const leads = db.people.flatMap((p) =>
    p.memberships.filter((m) => m.role === "sectionLead").map((m) => ({ person: p, membership: m, sport: org.get(m.nodeId)?.name })),
  );
  const manager = db.people.find((p) => p.memberships.some((m) => m.nodeId === club.id && m.role === "generalManager"));
  const hasYouth = youthExplorer(db, org, today).youth.length > 0;

  const steps = [
    {
      title: "Finn en gruppe",
      text: "Velg idrett og alder nedenfor. Hver gruppe har sin egen side med treningstider, sted og hvem som er trener.",
    },
    {
      title: "Prøv en trening",
      text: "Ta kontakt med treneren eller laglederen. Du trenger ikke melde deg på for å prøve.",
    },
    {
      title: "Meld deg inn",
      text: "Når du vil fortsette, melder du deg inn digitalt. Kontingenten faktureres én gang i året, og treningsavgift kommer i tillegg.",
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
                Prøv først. <span className="text-ink-3">Meld deg inn når du vet at det passer.</span>
              </h1>
              <p className="mt-6 max-w-[48ch] t-body-lg text-ink-2">
                Barn og ungdom kan være med på noen treninger før de melder seg inn. Klubben har {groups.length} lag og grupper å velge mellom.
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
                    <ExternalButton href={club.signupUrl} size="lg">
                      Meld deg inn i {club.shortName}
                      <ArrowUpRight aria-hidden />
                    </ExternalButton>
                    <TextLink href="#finn-aktivitet" className="t-small">
                      Finn din aktivitet først
                    </TextLink>
                  </>
                ) : (
                  <>
                    <ButtonLink href="#finn-aktivitet" size="lg" brand arrow>
                      Finn din aktivitet
                    </ButtonLink>
                    <TextLink href="#kontingent" className="t-small">
                      Se kontingent
                    </TextLink>
                  </>
                )}
              </div>
            </div>
            {photo && (
              <div className="col-span-4 max-lg:order-first md:col-span-8 lg:col-span-6 lg:col-start-7">
                <Photo photo={photo} ratio={4 / 3} priority sizes="(min-width: 1024px) 640px, 100vw" className="rounded-lg md:rounded-xl" />
              </div>
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
                <p className="mt-2 t-small text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section id="finn-aktivitet" labelledBy="finn-tittel" rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
        <div className="page">
          <SectionHeader id="finn-tittel" eyebrow="Finn din aktivitet" title={`${groups.length} lag og grupper.`} titleMuted="Velg idrett og alder." />
          <div className="mt-10 lg:mt-12">
            <ActivityExplorer sports={buildExplorer(db, org, today)} />
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
            <p className="mt-4 max-w-[36ch] t-small text-ink-2">{club.membership.note}</p>
          </div>
          <dl className="col-span-4 grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line md:col-span-8 md:grid-cols-3 md:divide-x md:divide-line lg:col-span-9 lg:col-start-4">
            {(
              [
                ["Voksne", club.membership.adult, "Fra 20 år"],
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
