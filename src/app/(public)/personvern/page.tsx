import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Section } from "@/components/ui/guides";
import { Breadcrumb } from "@/components/ui/primitives";
import { loadSite } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Personvernerklæring",
  description: "Hvilke opplysninger klubben behandler om deg og barnet ditt, hvorfor, hvor lenge, og hvilke rettigheter du har.",
};

/** Last changed. Change it with every edit of the text below. */
const UPDATED = "6. oktober 2026";

const P = ({ children }: { children: ReactNode }) => <p className="mt-3 t-body text-ink-2">{children}</p>;
const UL = ({ items }: { items: ReactNode[] }) => (
  <ul className="mt-3 list-disc space-y-2 pl-5 t-body text-ink-2">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

/**
 * The privacy statement. It describes what the site does, not what a template
 * says: no cookies and no statistics unless a visitor says yes (and only when
 * the club has set up Google Analytics, GA_MEASUREMENT_ID), no sign-up on the
 * site (that happens in Spond), names and photos of members only with consent,
 * and the permanent anonymisation the club's register supports. When the site
 * changes in a way that touches personal data, change this text and UPDATED.
 */
export default async function PrivacyPage() {
  const { db } = await loadSite();
  const club = db.club;
  const statistics = /^G-[A-Z0-9]{4,}$/.test(process.env.GA_MEASUREMENT_ID ?? "");

  const sections: { id: string; title: string; body: ReactNode }[] = [
    {
      id: "ansvarlig",
      title: "Hvem er ansvarlig",
      body: (
        <>
          <P>
            {club.name} (org.nr. {club.orgNumber}) er behandlingsansvarlig for opplysningene som er beskrevet her. Klubben drives av frivillige, og vi har ikke utpekt personvernombud.
          </P>
          <P>
            {club.address.street}, {club.address.postalCode} {club.address.city}. Spørsmål om personvern sender du til{" "}
            <a className="link font-medium text-ink" href={`mailto:${club.email}`}>
              {club.email}
            </a>
            , eller ring {club.phone}.
          </P>
        </>
      ),
    },
    {
      id: "kort-fortalt",
      title: "Kort fortalt",
      body: (
        <UL
          items={[
            statistics
              ? "Nettsiden setter ingen informasjonskapsler og laster ingenting fra Google før du har sagt ja til statistikk. Du kan si nei, og siden fungerer likt."
              : "Nettsiden bruker ingen informasjonskapsler, ingen statistikkverktøy og ingen annonser.",
            "Innmelding, påmelding og kontingent skjer i Spond, ikke på nettsiden.",
            "Navn og bilder av medlemmer publiseres bare med samtykke. For barn under 16 år er det de foresatte som samtykker.",
            "Du kan når som helst be om innsyn, retting, sletting, eller at du eller barnet ditt ikke lenger skal kunne kjennes igjen på nettsiden.",
            "Vi selger ingen opplysninger, og viser ingen reklame.",
          ]}
        />
      ),
    },
    {
      id: "besok",
      title: "Når du besøker nettsiden",
      body: (
        <>
          <P>Du trenger ikke logge inn eller oppgi noe for å lese nettsiden. Dette skjer når du besøker den:</P>
          <UL
            items={[
              <>
                <strong className="font-semibold text-ink">Lagret i nettleseren din.</strong> Valget ditt mellom lys og mørk visning, og hvor langt du har kommet i «Ny i klubben»-veiviseren, lagres på din egen enhet slik at siden husker det. Det sendes aldri til oss.
              </>,
              <>
                <strong className="font-semibold text-ink">Serverlogg.</strong> Tjenesten som kjører nettsiden registrerer tekniske opplysninger, som IP-adresse, tidspunkt, hvilken side som ble åpnet og nettleser, for at siden skal fungere og være sikker. Vi bruker dem ikke til å kjenne deg igjen eller til å lage profiler. Grunnlaget er vår berettigede interesse i trygg drift (personvernforordningen artikkel 6 nr. 1 bokstav f).
              </>,
              <>
                <strong className="font-semibold text-ink">Skrifttyper.</strong> Skrifttypene leveres fra nettsidens egen server, ikke fra Google.
              </>,
              <>
                <strong className="font-semibold text-ink">Innhold fra andre.</strong> Noen bilder lastes fra bildetjenesten Unsplash, og boksen om Grasrotandelen på «Om klubben» lastes fra Norsk Tipping. Når en side viser slikt innhold, ser tjenesten IP-adressen din. Lenker til Spond, Strava, kart og andre nettsteder blir bare aktive når du selv klikker på dem.
              </>,
            ]}
          />
        </>
      ),
    },
    ...(statistics
      ? [
          {
            id: "statistikk",
            title: "Statistikk og informasjonskapsler (Google Analytics)",
            body: (
              <>
                <P>
                  Vi vil gjerne vite hvilke sider som leses, så vi kan gjøre nettsiden bedre. Derfor spør vi om lov til å bruke Google Analytics. <strong className="font-semibold text-ink">Det er helt frivillig.</strong> Så lenge du ikke har sagt ja, lastes ingenting fra Google, og ingen informasjonskapsler settes.
                </P>
                <UL
                  items={[
                    <>
                      <strong className="font-semibold text-ink">Hva som måles etter et ja:</strong> hvilke sider du åpner, tidspunkt, nettleser og enhet, omtrent hvilket område du er i, og en tilfeldig id i informasjonskapslene <span className="tnum">_ga</span> og <span className="tnum">_ga_*</span>. IP-adressen din lagres ikke av Google Analytics 4. Vi ser samlet statistikk, ikke hvem du er.
                    </>,
                    <>
                      <strong className="font-semibold text-ink">Hvor lenge:</strong> informasjonskapslene varer i inntil to år. Opplysningene i Google Analytics oppbevares i inntil to måneder med standardinnstillingen, og vi bruker dem bare i samlet form.
                    </>,
                    <>
                      <strong className="font-semibold text-ink">Grunnlag:</strong> ditt samtykke (artikkel 6 nr. 1 bokstav a, og ekomloven § 3-15 for informasjonskapslene).
                    </>,
                    <>
                      <strong className="font-semibold text-ink">Google:</strong> Google Ireland Limited og Google LLC behandler opplysningene for oss. Opplysningene kan overføres til USA, som skjer på grunnlag av EU–USA Data Privacy Framework og EUs standard personvernbestemmelser.
                    </>,
                    <>
                      <strong className="font-semibold text-ink">Du kan ombestemme deg når som helst:</strong> trykk på «Informasjonskapsler» nederst på siden. Sier du nei, slettes informasjonskapslene og målingen stopper.
                    </>,
                  ]}
                />
              </>
            ),
          },
        ]
      : []),
    {
      id: "medlemmer",
      title: "Medlemmer og påmelding",
      body: (
        <>
          <P>
            Innmelding, påmelding til trening og ritt, kontingent og meldinger til gruppene skjer i Spond. Der er du, og eventuelt barnet ditt, registrert. Spond behandler opplysningene på våre vegne og har en egen personvernerklæring på spond.com. Du kan ikke melde deg inn eller betale på denne nettsiden.
          </P>
          <P>I klubbens eget register, som styrer hva som vises på nettsiden, har vi:</P>
          <UL
            items={[
              "navn, fødselsår (og fødselsdato hvis du har oppgitt den, for å få alderen riktig)",
              "hvilke grupper du er med i, og din rolle, for eksempel utøver, trener eller lagleder",
              "om det er gitt samtykke til bilder, hvem som ga det, og når",
              "portrett, for dem som presenteres på nettsiden, for eksempel trenere og lagledere",
              "e-post og telefon, bare for personer i roller som er åpne kontaktpersoner (trener, lagleder, styre), slik at de kan nås",
              "for barn: hvilke foresatte som er knyttet til barnet, slik at samtykke kan registreres",
              "en e-postadresse for samtykke til bilder (din egen, eller en forelders for barn), som bare brukes til å spørre om samtykke og aldri vises",
            ]}
          />
          <P>
            Når en administrator henter medlemmer inn fra en eksport fra Spond, leser vi bare navn, fødselsår og samtykke til bilder. E-post, telefon, adresse, skole, politiattest og opplysninger om foresatte leses aldri inn. Nye personer settes som «Ikke publiser», slik at ingen vises på nettsiden før noen har tatt stilling til det.
          </P>
          <P>
            Grunnlaget er medlemskapet (artikkel 6 nr. 1 bokstav b) for registeret, vår berettigede interesse for kontaktopplysningene til dem som har en rolle (bokstav f), og ditt samtykke for bilder og navn som publiseres (bokstav a).
          </P>
        </>
      ),
    },
    {
      id: "bilder",
      title: "Navn og bilder på nettsiden",
      body: (
        <>
          <P>
            Lag og grupper publiserer nyheter, referater og bilder, og nettsiden viser portretter og sitater fra medlemmer. Alt som publiseres er åpent for alle på internett.
          </P>
          <UL
            items={[
              "Navn og bilder av personer publiseres bare hvis det er gitt samtykke. For barn under 16 år samtykker de foresatte. Personer som ikke skal publiseres, kan ikke merkes i bilder eller omtales ved navn.",
              "Når et bilde med en person som ikke har gitt samtykke skal brukes, kan klubben spørre på e-post. Bildet ligger da skjult til personen (eller en forelder) har svart ja, og svaret gjelder bare det bildet. Ansikter kan også dekkes til før et bilde lastes opp.",
              "Samtykket kan trekkes tilbake når som helst, og det påvirker ikke medlemskapet. Trekker du det tilbake, slutter vi å vise deg fra da av.",
              "Sitater og portretter brukes bare med samtykke fra den det gjelder (og de foresatte for barn). Ved sitater vises fornavn og alder.",
              "Navn i tekst kobles til personregisteret. Det gjør at vi alltid vet hvor en person er omtalt, og kan fjerne omtalen på en trygg måte.",
            ]}
          />
          <P>
            <strong className="font-semibold text-ink">Be om å bli fjernet.</strong> Du kan når som helst be om at du eller barnet ditt ikke lenger skal kunne kjennes igjen. Da bytter vi navn i tekst og tittel til en nøytral omtale (for eksempel «en av rytterne»), dekker til personen i alle bilder, også i gamle saker, og fjerner sitater. Dette er permanent og skjer alle steder samtidig. Vi kan ikke slette kopier som andre har lagret eller delt, eller innhold i søkemotorers hurtigminne.
          </P>
        </>
      ),
    },
    {
      id: "administrasjon",
      title: "Lagledere, trenere og styret som logger inn",
      body: (
        <>
          <P>
            De som oppdaterer nettsiden, som lagledere, trenere og styremedlemmer, har tilgang til en egen administrasjon. Vi lagrer navn, e-postadresse, rolle og hvilke grupper tilgangen gjelder. En lagleder ser bare egen gruppe og de som er med der.
          </P>
          <P>
            Vi loggfører hvem som har endret hva, og når, så feil kan rettes og endringer kan angres. Loggen inneholder aldri navn på personer som er omtalt, bare at en endring skjedde. Grunnlaget er vår berettigede interesse i å holde orden og sikkerhet (artikkel 6 nr. 1 bokstav f).
          </P>
        </>
      ),
    },
    {
      id: "henvendelser",
      title: "Når du tar kontakt eller ber om innsyn",
      body: (
        <P>
          Når du skriver til oss, for eksempel for å be om innsyn eller sletting, lagrer vi henvendelsen, hvem den kom fra og hvordan vi svarte, så lenge det trengs for å dokumentere at vi har svart riktig. Vi bruker opplysningene bare til å behandle henvendelsen.
        </P>
      ),
    },
    {
      id: "deling",
      title: "Hvem vi deler opplysninger med",
      body: (
        <>
          <P>Vi selger aldri opplysninger. Disse leverandørene behandler opplysninger på våre vegne, etter databehandleravtale eller tilsvarende vilkår:</P>
          <UL
            items={[
              <>
                <strong className="font-semibold text-ink">Vercel</strong> kjører nettsiden og har serverloggene.
              </>,
              <>
                <strong className="font-semibold text-ink">Supabase</strong> lagrer redigert innhold, bilder og portretter.
              </>,
              <>
                <strong className="font-semibold text-ink">Spond</strong> håndterer medlemskap, påmelding og kommunikasjon.
              </>,
              ...(statistics
                ? [
                    <>
                      <strong className="font-semibold text-ink">Google</strong> leverer statistikktjenesten, bare for dem som har sagt ja.
                    </>,
                  ]
                : []),
            ]}
          />
          <P>
            Leverandørene kan behandle opplysninger utenfor EØS. Det skjer bare på et gyldig grunnlag, for eksempel EUs standard personvernbestemmelser eller EU–USA Data Privacy Framework.
          </P>
          <P>
            Vi deler opplysninger med idrettsforbund, arrangører og myndigheter når det er nødvendig for det du har meldt deg på (for eksempel lisens eller påmelding til ritt) eller når loven krever det. Strava og andre tjenester får ingenting fra oss. Du er hos dem først når du selv klikker på en lenke og logger inn der.
          </P>
        </>
      ),
    },
    {
      id: "lagring",
      title: "Hvor lenge vi lagrer opplysninger",
      body: (
        <UL
          items={[
            "Medlemsopplysninger lagres så lenge du er medlem og så lenge det trengs for å følge opp medlemskapet. Deretter slettes eller anonymiseres de.",
            "Publiserte nyheter og bilder står til de fjernes, enten av oss eller fordi du ber om det. Slettede innlegg ligger 30 dager i en papirkurv, og er så borte for godt.",
            "En person som slettes fra registeret anonymiseres først og fjernes deretter, uten at det beholdes noen kopi.",
            "Regnskapsopplysninger lagres så lenge bokføringsloven krever det.",
            "Serverlogger hos leverandøren lagres i kort tid.",
          ]}
        />
      ),
    },
    {
      id: "sikkerhet",
      title: "Sikkerhet",
      body: (
        <P>
          Nettsiden bruker kryptert forbindelse (https). Tilgang til administrasjonen er begrenset etter rolle og etter hvilke grupper man har ansvar for. Personer som ikke har samtykket, kan ikke merkes i bilder eller omtales ved navn. Alle endringer loggføres. Skulle noe gå galt med personopplysninger, melder vi fra til Datatilsynet og til dem det gjelder når loven krever det.
        </P>
      ),
    },
    {
      id: "rettigheter",
      title: "Dine rettigheter",
      body: (
        <>
          <UL
            items={[
              "Innsyn: du kan få vite hvilke opplysninger vi har om deg, og få en kopi.",
              "Retting: du kan kreve at feil opplysninger rettes.",
              "Sletting: du kan kreve at opplysninger om deg slettes, med de unntakene loven setter.",
              "Begrensning og protest: du kan be oss begrense bruken av opplysningene, eller protestere mot bruk som bygger på vår berettigede interesse.",
              "Dataportabilitet: opplysninger du selv har gitt oss, kan du få utlevert i et vanlig, maskinlesbart format.",
              "Trekke samtykke: du kan når som helst trekke tilbake et samtykke, uten at det påvirker behandlingen som allerede har skjedd.",
            ]}
          />
          <P>
            Send en e-post til{" "}
            <a className="link font-medium text-ink" href={`mailto:${club.email}`}>
              {club.email}
            </a>
            . Vi svarer senest innen én måned. Er du uenig i hvordan vi behandler opplysninger, kan du klage til{" "}
            <a className="link font-medium text-ink" href="https://www.datatilsynet.no" target="_blank" rel="noreferrer noopener">
              Datatilsynet
            </a>
            .
          </P>
        </>
      ),
    },
    {
      id: "barn",
      title: "Barn og ungdom",
      body: (
        <P>
          Klubben har mange barn og unge i gruppene. For barn under 16 år er det alltid de foresatte som samtykker, melder inn og ber om innsyn eller sletting. Vi publiserer bare navn og bilder av barn hvis de foresatte har sagt ja.
        </P>
      ),
    },
    {
      id: "endringer",
      title: "Endringer i erklæringen",
      body: <P>Gjør vi endringer i hvordan vi behandler personopplysninger, oppdaterer vi denne siden. Sist oppdatert {UPDATED}.</P>,
    },
  ];

  return (
    <>
      <Section className="pb-10 lg:pb-14">
        <div className="page pt-6 lg:pt-10">
          <Breadcrumb items={[{ label: club.name, href: "/" }, { label: "Personvern" }]} />
          <div className="mt-8 max-w-[64ch]">
            <p className="t-eyebrow">Personvern</p>
            <h1 className="mt-3 t-h1">Personvernerklæring</h1>
            <p className="mt-5 t-body-lg text-ink-2">
              Her forklarer vi hvilke opplysninger {club.name} behandler om deg og barnet ditt, hvorfor vi gjør det, hvor lenge vi beholder dem, og hvilke rettigheter du har. Sist oppdatert {UPDATED}.
            </p>
          </div>
        </div>
      </Section>
      <Section rule="top" className="py-12 lg:py-16">
        <div className="page grid-page gap-y-10">
          <nav aria-label="Innhold" className="col-span-4 md:col-span-8 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:col-span-3 lg:self-start">
            <p className="t-meta font-semibold text-ink-3">På denne siden</p>
            <ol className="mt-3 space-y-2 t-small">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-ink-2 hover:text-ink">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="col-span-4 md:col-span-8 lg:col-span-8 lg:col-start-5">
            <div className="max-w-[68ch] space-y-12">
              {sections.map((s) => (
                <section key={s.id} id={s.id} aria-labelledby={`${s.id}-tittel`} className="scroll-mt-[calc(var(--header-h)+1.5rem)]">
                  <h2 id={`${s.id}-tittel`} className="t-h2">
                    {s.title}
                  </h2>
                  {s.body}
                </section>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
