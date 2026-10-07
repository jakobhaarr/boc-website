import bmxPhoto from "@/components/assets/bmx.jpg";
import bmxYouthPhoto from "@/components/assets/bmx-barn.jpg";
import bmxNorgescupPhoto from "@/components/assets/bmx-norgescup-2026.jpeg";
import ulrikGernerPhoto from "@/components/assets/ulrik-gerner.jpg";
import demoCamillaPhoto from "@/components/assets/camilla-37.png";
import joinPhoto from "@/components/assets/join-club-component-placeholder.png";
import demoRebekkaPhoto from "@/components/assets/rebekka-19-wide.png";
import demoRobinPhoto from "@/components/assets/robil-36.png";
import demoSanderPhoto from "@/components/assets/sander-12.png";
import demoSiljePhoto from "@/components/assets/silje-34-wide.png";
import { RACE_PAGE_OF, RACE_PAGES } from "./race-info";
import mallorcaRoadPhoto from "@/components/assets/mallorca-web-road.jpg";
import mallorcaForestPhoto from "@/components/assets/mallorca-web-forest.jpg";
import mallorcaStreetPhoto from "@/components/assets/mallorca-web-street.jpg";
import mallorcaSidePhoto from "@/components/assets/mallorca-web-side.jpg";
import mallorcaLanePhoto from "@/components/assets/mallorca-web-lane.jpg";
import mallorcaTrackPhoto from "@/components/assets/mallorca-web-track.jpg";
import demoTrondPhoto from "@/components/assets/trond-58.png";
import kitsPhoto from "@/components/assets/boc-kits.png";
import jerseyBlack from "@/components/assets/boc-jersey-black-cutout.png";
import jerseyYellow from "@/components/assets/boc-jersey-yellow-cutout.png";
import boc2Photo from "@/components/assets/boc2.jpg";
import boc3Photo from "@/components/assets/boc3.jpg";
import boc4Photo from "@/components/assets/boc4.jpg";
import bekkestuaPhoto from "@/components/assets/bekkestua-torg.jpg";
import kaffebrenneriet from "@/components/assets/kaffebrenneriet.jpg";
import bmxGruppe1Photo from "@/components/assets/bmx-gruppe-1.jpg";
import bmxStartPhoto from "@/components/assets/barnesykling.jpg";
import juniorPhoto from "@/components/assets/landevei-junior.jpg";
import spinningPhoto from "@/components/assets/spinning.jpg";
import styrkeprovenNarrow from "@/components/assets/boc1-styrkeproven.jpg";
import styrkeprovenHero from "@/components/assets/boc1-styrkeproven-wide.jpg";
import heroMobilePhoto from "@/components/assets/hero-mobile.jpg";
import heroMobileDarkPhoto from "@/components/assets/hero-mobile-darkmode.jpg";
import heroWideDarkPhoto from "@/components/assets/hero-wide-darkmode.png";
import zwiftPhoto from "@/components/assets/zwift-hero-new.png";
import zwiftCompanionIcon from "@/components/assets/zwift-companion-icon.png";
import zwiftLogoWhite from "@/components/assets/zwift-logo-white.png";
import spondZwiftEvent from "@/components/assets/spond-zwift-event.png";
import bocZwiftRide from "@/components/assets/boc-zwift.png";
import zwiftSetup from "@/components/assets/zwift-setup-boc.png";
import companionMenu from "@/components/assets/zwift/companion-1-meny.png";
import companionSearch from "@/components/assets/zwift/companion-2-sok.png";
import companionMeetups from "@/components/assets/zwift/companion-3-meetups.png";
import companionAccept from "@/components/assets/zwift/companion-4-godta.png";
import terrengPhoto from "@/components/assets/terreng.jpeg";
import velodromPhoto from "@/components/assets/velodrom-meetup.jpg";
import jakobPhoto from "@/components/assets/jakob-headshot-boc-cutout.png";
import erikSchmidtPhoto from "@/components/assets/Erik-Schmidt.png";
import reidarKveinePhoto from "@/components/assets/Reidar-Kveine.png";
import trondVidarThomsonPhoto from "@/components/assets/Trond-Vidar-Thomson.jpg";
import estenOversjoenPhoto from "@/components/assets/esten-oversjoen.png";
import steinArneLiePhoto from "@/components/assets/stein-arne-lie.jpg";
import christianPhoto from "@/components/assets/Christian-udø-Adriaenssens.png";
import { m, para, text } from "@/lib/rich-text";
import type { Activity, Article, Block, Club, Inline, Db, LevelId, OrgNode, Person, Photo, Race, TrainingSeries, User, Venue } from "@/lib/types";
import type { SeedCtx } from "./context";
import { themeSeed } from "./org";

/**
 * Bærum og Omegn Cykleklubb — the single-sport club in the prototype.
 *
 * Structure, colours, partners and news headlines follow the real club
 * (baerumock.no); the news bodies are short summaries written for the demo,
 * not copies of the club's articles. Riders and their families are invented,
 * because a prototype about consent should not carry real people's data. The
 * photographs are drawn (see ./art.ts) for the same reason.
 */

const SPOND_SIGNUP = "https://club.spond.com/landing/signup/boc/form/80A02DFABAC3441EBF1FCF28EE0E1A7F";
const VELODROM_SPOND = "https://spond.com/invite/OHNOO";

/* ── The club's own information, in its words ──────────────────────────────
   Pages for Club.pages (the police certificate guide, the sports grant) and
   the BMX branch's «Løp og konkurranser» (OrgNode.sections), from the texts
   the club supplied and baerumock.no/løp_og_konkurranser. Only the links
   written out in those texts are linked. */
const a = (label: string, href: string): Inline => ({ type: "link", text: label, href });
const p = (...content: (string | Inline)[]): Block => para(content.map((c) => (typeof c === "string" ? text(c) : c)));
const h = (value: string): Block => ({ type: "heading", text: value });
const ul = (...items: (string | Inline[])[]): Block => ({ type: "list", items: items.map((i) => (typeof i === "string" ? [text(i)] : i)) });
const ol = (...items: (string | Inline[])[]): Block => ({ ...(ul(...items) as Extract<Block, { type: "list" }>), ordered: true });

const CLUB_PAGES: NonNullable<Club["pages"]> = [
  {
    slug: "politiattest",
    logo: { src: "/logos/politiet.svg", alt: "Politiet", width: 3652, height: 1068 },
    navLabel: "Politiattest",
    eyebrow: "Politiattest",
    title: "Slik søker du om og deler politiattest",
    lead: "Med Digipost søker du om politiattest og viser den til idrettslaget digitalt. Det skjer i fire steg: samtykke i Min idrett, søknad hos politiet, deling fra Digipost og godkjenning av rollen.",
    teaser: "Slik søker du om politiattest og deler den digitalt med idrettslaget, via Min idrett og Digipost, steg for steg.",
    action: { label: "Søk og fremvis digitalt", href: "https://www.idrettsforbundet.no/digital/politiattest/hvordan-soke-politiattest/" },
    sections: [
      {
        id: "steg-1",
        eyebrow: "Steg 1",
        title: "Samtykke til forenklet politiattestsøknad",
        blocks: [
          h("Over 18 år"),
          p("Samtykk til at idrettslaget kan innhente og sende fødselsnummeret ditt, rollen din og formålet til politiet. Det forenkler prosessen: du slipper å laste opp andre dokumenter i etterkant og kan søke direkte hos politiet etter at du har samtykket i Min idrett."),
          p("Fullfør oppgaven om å samtykke via lenken du får på e-post, eller finn den på forsiden av Min idrett under Oppgaver og varsler. Når samtykket er gitt, går du videre til steg 2."),
          h("Mellom 15 og 18 år"),
          p("Er du mellom 15 og 18 år, må også en foresatt samtykke til at idrettslaget kan innhente og sende personopplysningene dine til politiet, og bekrefte at du kan søke om politiattest. Slik gjør dere det:"),
          ol(
            "E-post med instruksjoner: Du eller en foresatt får e-post med veiledning for samtykke. Er ikke foresatt koblet til deg i Min idrett, får dere også informasjon på e-post om hvordan dere oppretter en familierelasjon.",
            [
              text("Opprett familierelasjon om nødvendig: Foresatt må ha bruker i Min idrett (idrettens ID) eller registrere en, og dere må opprette en familierelasjon. Mer informasjon står under "),
              a("spørsmål og svar", "https://www.minidrett.no/politiattest/person/sporsmal-og-svar"),
              text("."),
            ],
            "Foresatt gir samtykke: Når familierelasjonen er på plass, logger foresatt inn i Min idrett. Under Oppgaver på forsiden ligger lenken for å gi samtykke.",
            "Du gir samtykke: Når foresatt har samtykket, får du e-post og en oppgave i Min idrett med lenke til å gi ditt samtykke.",
            "Start søknad: Når begge har samtykket, blir knappen «Start søknad» aktiv, og du kan søke om politiattest direkte hos politiet.",
          ),
        ],
      },
      {
        id: "steg-2",
        eyebrow: "Steg 2",
        title: "Fullfør søknaden hos politiet",
        blocks: [
          ul(
            "Når du har samtykket, velger du «Start søknad».",
            "Fullfør søknaden på politiets nettsider ved å følge instruksjonene der.",
            [text("Du kan følge "), a("status på søknaden hos politiet", "https://www.politiet.no/tjenester/politiattest/status-pa-soknad-om-politiattest/"), text(".")],
          ),
          p("Fullfør søknaden hos politiet innen fire uker etter at du har samtykket og startet søknaden fra Min idrett."),
          p("Viktig: Ikke kryss av for digital postreservasjon. Da får du attesten i Digipost og kan dele den digitalt, og slipper å møte opp for å vise den til politiattestansvarlig i idrettslaget. Når politiet har behandlet søknaden, får du attesten i Digipost. Del den med politiattestansvarlig via delingsforespørselen merket «Forespørsel om deling av politiattest»."),
        ],
      },
      {
        id: "steg-3",
        eyebrow: "Steg 3",
        title: "Del politiattesten fra Digipost",
        blocks: [
          p("Du får forespørselen om deling før du har fått attesten fra politiet. Når attesten kommer, åpner du meldingen «Forespørsel om deling av politiattest» og trykker «Del dokument». Del bare den siste attesten du har søkt om, ikke tidligere attester (ikke eldre enn fem måneder) eller en kopi du får fra politiet."),
          p("Viktig: Bruk delingsforespørselen for å dele attesten enkelt og trygt med idrettslaget. Ikke last opp attesten i en ny melding."),
          p("Før du deler attesten, ta stilling til dette:"),
          ul(
            "Uten merknad: Del attesten sikkert med politiattestansvarlig ved å trykke «Del dokument» i Digipost. Du kan senere trekke samtykket i Digipost med «Avbryt deling», men da må attesten vises frem fysisk.",
            [
              text("Med merknad: Ikke del attesten. Takk nei til rollen ved å trykke på søppelkasseikonet ved siden av rollen "),
              a("under behandling i Roller og verv", "https://www.minidrett.no/profil/roller?tab=3"),
              text("."),
            ],
          ),
        ],
      },
      {
        id: "steg-4",
        eyebrow: "Steg 4",
        title: "Godkjenning av rollen",
        blocks: [
          p("Når du har delt attesten digitalt, trenger du ikke vise den frem fysisk. Politiattestansvarlig registrerer attesten, og rollen din sendes til godkjenning i idrettslaget. Når den er godkjent, vises rollen under Min side, Roller og verv og Aktive roller, og du kan starte i den nye rollen."),
        ],
      },
    ],
  },
  {
    slug: "idrettsstipend",
    illustration: { kind: "stipend", amount: "Opptil 150 000 kroner" },
    navLabel: "Idrettsstipend",
    eyebrow: "BOC Idrettsstipend",
    title: "Idrettsstipend for unge talenter",
    lead: "BOC deler ut et idrettsstipend til unge talenter under 25 år som deltar i internasjonale konkurranser, og som gjennom aktiviteter og resultater gjør klubben synlig, gir den positiv omtale og bidrar til rekruttering. Stipendet er en oppfordring til å satse videre neste sesong.",
    teaser: "For unge talenter under 25 år som konkurrerer internasjonalt. Opptil 150 000 kroner, med søknadsfrist 1. september.",
    action: { label: "Send søknad til styret", href: "mailto:post@baerumock.no?subject=S%C3%B8knad%20om%20BOC%20Idrettsstipend" },
    sections: [
      {
        title: "Om stipendet",
        blocks: [
          p("Idrettsstipendet ble vedtatt på årsmøtet i 2023. Størrelsen fastsettes i klubbens budsjett ut fra det økonomiske resultatet året før, opptil 150 000 kroner, og kunngjøres på årsmøtet når budsjettet legges frem."),
        ],
      },
      {
        title: "Kriterier for tildeling",
        blocks: [
          ul(
            "Utøveren skal ha vært medlem i BOC i minst to år og delta på ordinære treninger i regi av BOC.",
            "Utøveren må ha deltatt i norske ritt som medlem av BOC denne sesongen.",
            "Utøveren må ha brukt BOC-teamwear der det er tillatt. Unntak gjelder der nasjonal drakt, Talent Team-drakt eller lignende er påkrevd, og BOC-logoen skal være med på slik drakt så sant det er mulig.",
            "Utøveren oppfordres til å skrive reisebrev fra internasjonale ritt, som deles på klubbens nettside og Facebook-sider til inspirasjon for andre medlemmer.",
            "Utøveren oppfordres til å vise til BOC i innlegg i sosiale medier (Facebook: @Bærum og Omegn Cykleklubb (BOC), Instagram: bocsykkel).",
          ),
        ],
      },
      {
        title: "Slik søker du",
        blocks: [p("Send søknaden til styret på ", a("post@baerumock.no", "mailto:post@baerumock.no"), " innen 1. september, med planen din for deltakelse i internasjonale ritt.")],
      },
      {
        title: "Tildeling og utbetaling",
        blocks: [
          p("Stipendet deles ut ved sesongslutt på BOCs årlige høstfest eller årsfest. Tildelt beløp utbetales mot innsendte kvitteringer for utgifter, opptil tildelt beløp."),
          p("Styrets ansvarlige for nettsider og sosiale medier tar kontakt for å avklare det praktiske rundt publiseringene i kriteriene over."),
          p("Bytter utøveren klubb året etter tildelingen, skal hele stipendet betales tilbake til BOC."),
        ],
      },
    ],
  },
  {
    slug: "beredskapsplan",
    navLabel: "Beredskapsplan",
    eyebrow: "Beredskap",
    title: "BOCs beredskapsplan",
    lead: "Hva du bør ha med, hvem som leder og hvem som ringer hvem hvis noe skjer på trening, i ritt eller på tur, hjemme eller i utlandet. Planen er en anbefaling, og den gjelder alle aktiviteter med klubben.",
    teaser: "Anbefalt plan for trening, ritt og reiser, hjemme og ute: pårørende, ansvar, varsling og hva du gjør i utlandet.",
    sections: [
      {
        id: "parorende",
        eyebrow: "Før du drar",
        title: "Ha pårørende med deg",
        blocks: [
          p("Alle utøvere anbefales å bære på seg navn og kontaktopplysninger til pårørende, altså ICE-numre. Det gjelder all aktivitet med klubben: trening, ritt og reiser."),
          p("Opplysningene kan ligge på et laminert kort i baklommen på trøya, eller på et armbånd."),
        ],
      },
      {
        id: "ansvar",
        eyebrow: "Før du drar",
        title: "Hvem er leder?",
        blocks: [
          p("Ansvaret avklares før avreise. Ved enhver organisert trening skal det aldri være tvil om hvem som er leder."),
          ul(
            "Lederen bestemmer hvem som kontakter sykehus, pårørende og forsikringsselskap.",
            "Lederen bestemmer hvem som har ansvaret for resten av gruppen.",
          ),
        ],
      },
      {
        id: "ulykke",
        eyebrow: "Hvis noe skjer",
        title: "Ved alvorlig ulykke",
        blocks: [
          ul(
            "Kontakt politi eller AMK-sentralen (112 og 113).",
            "Ta vare på hverandre og på utstyret, og ring pårørende umiddelbart. La ikke Facebook eller media bli de pårørendes første varsel om en ulykke.",
            "Ikke kontakt media selv, og vær forsiktig med å legge ut noe i sosiale medier før pårørende og venner har fått beskjed. Klubbens ledelse, eventuelt presidenten eller generalsekretæren i Norges Cykleforbund, kan være en buffer mot media.",
          ),
          p("Gjennom helårslisensen har du en avtale med Idrettens skadetelefon, 02033, for raskest mulig rehabilitering."),
        ],
      },
      {
        id: "utlandet",
        eyebrow: "Hvis noe skjer",
        title: "I utlandet",
        blocks: [
          ul(
            "Kontakt forsikringsselskapet ditt (reiseforsikringen), eventuelt SOS-alarmsentralen.",
            "Ta vare på hverandre og på utstyret, og ring pårørende umiddelbart.",
            "Velg én som hjelper den skadde på sykehuset og er kontaktledd mot pårørende og resten av gruppen.",
            "Ved alvorlig skade eller dødsfall kontakter du Utenriksdepartementet.",
          ),
          p("Norges Cykleforbund har en egen beredskapsavtale med Sjømannskirken for oppfølging og bistand i utlandet. Se hvor de finnes på ", a("sjomannskirken.no", "https://www.sjomannskirken.no"), "."),
        ],
      },
    ],
  },
];

/* The Terreng groups for children and youth share what they say about the way they ride, the trips, and what to bring.
   From the group's own pages (October 2026), in the club's words: no prices, which the pages do not give. */
const TERRENG_UNGE_SECTIONS: NonNullable<OrgNode["sections"]> = [
  {
    id: "filosofi",
    eyebrow: "Slik sykler vi",
    title: "Mestring på sti",
    blocks: [
      p("Målet er at alle skal oppleve mestring. Vi sykler mye på sti, mindre på grus og veldig lite på asfalt, og trives best på grov sti. Treningene tilpasses den enkelte, og gruppene endrer seg med barna og foreldrene som er med."),
      p("Noen sykler ritt, for tiden mest enduro og litt rundbane. De fleste sykler ikke ritt i det hele tatt. Vi er opptatt av samhold, og vil gjerne at du kommer og ser på selv om du ikke har dagen eller synes det blir for mye å delta på ritt i tillegg til alt annet. Det er plass til alle, og fokuset er å konkurrere mot seg selv."),
      p("Sesongen starter etter påske og varer til skoleferien. Den tar opp igjen når skolen starter, og varer til høstferien."),
    ],
  },
  {
    id: "turer",
    eyebrow: "Turer og skole",
    title: "Klubbtur og terrengsykkelskole",
    blocks: [
      p("Sesongen starter med en klubbtur utenbys om våren, og den avsluttes med en tur til Trysil."),
      p("I uke 33 hvert år arrangerer vi terrengsykkelskole for 9–13 år. Der er det deltakere fra klubbens egne medlemmer, fra andre klubber og fra dem som ikke har sykkelklubb fra før."),
    ],
  },
  {
    id: "utstyr",
    eyebrow: "Sykkel og utstyr",
    title: "Hva du trenger",
    blocks: [
      p("Alle må ha hjelm, uten unntak. Vi anbefaler terrenghjelm, gjerne med MIPS, og den kan du skaffe når du uansett må opp en størrelse. Alle må også ha med en sykkelslange til egen sykkel."),
      p("Du bør ha med drikkeflaske eller sekk med drikkeblære. Treningene kan gå et stykke fra stadionområdet, så det går ikke an å legge flasken igjen hos de foresatte. Test flaskestativet i forkant, for eksempel ved å trille sykkelen ned en bratt trapp, så flasken ikke faller ut i første sving."),
      h("Vi anbefaler"),
      ul(
        "Sykkelhansker, gjerne med lange fingre og litt polstring i håndflaten. Alt fra billige til dyre hansker fungerer. Vår og høst, og i regnvær, er det lurt med vanter eller litt ekstra isolasjon.",
        "Knebeskyttere som sitter godt, så de ikke sklir ned på ankel eller legg.",
        "Ryggplate, eller sekk med ryggplate. Det er en billig ekstra forsikring hvis du uansett bruker sekk.",
        "Stive sko med stiv såle, som tursko, skatesko eller sneakers. Etter hvert bruker mange sykkelsko og klikkpedaler.",
        "Grovere dekk. Mange barnesykler leveres med dekk laget for skolevei, asfalt og grus. Når det er vått og gjørmete, er forskjellen mellom finmønstrede og grove dekk veldig stor.",
      ),
      p("Vi kjører aldri med steinharde dekk. Litt mindre luft gir bedre grep."),
    ],
  },
  {
    id: "sykkel",
    eyebrow: "Sykkel og utstyr",
    title: "Sykkelen",
    blocks: [
      p("Medlemmene har alt fra 16 til 29 tommer hjul, fra sykler helt uten demping (for de yngste) til dempegaffel og fulldemper. Det viktigste er at sykkelen passer, er i god teknisk stand, særlig bremser og gir, og har gode dekk. Nesten ingen har en egen terrengsykkel. De fleste stiller med sykkelen de bruker til hverdags og til skolen, så dekkene er det som lønner seg å bruke mest energi på."),
      p("For de yngste er det ofte best å velge en lett sykkel uten dempegaffel og kjøre med litt lavere dekktrykk. Dempegaffel på barnesykler er ofte tung og har liten effekt på liten vekt, men den ser kul ut. Frog og Woom lager lette sykler til de yngste. Når barna blir eldre, gir en lettere sykkel med dempegaffel ofte mer sykkel for pengene enn en tyngre fulldemper. Mange av de eldre har fulldemper, men man klarer seg lenge uten."),
      p("Det er vanskelig å gi råd om sykkel, fordi folk har ulike økonomiske muligheter og prioriteringer. Spør oss gjerne om hjelp til å velge, eller om å vurdere to sykler mot hverandre."),
    ],
  },
];

const BMX_RACE_SECTIONS: NonNullable<OrgNode["sections"]> = [
  {
    id: "lop",
    eyebrow: "Løp og konkurranser",
    title: "BMX-løp er for alle aldre og nivåer",
    blocks: [
      p("Alle løp i Norge har barneleker for barn under 12 år. Løpene er sosiale arrangementer med speaker, kiosk, klubbtelt og lagleder, og som BOC-rytter blir du en del av klubbteltet og fellesskapet. Alder og kjønn avgjør hvilken klasse du kjører i, og arrangøren bestemmer klassene på lokale løp."),
      h("Slik kjøres et løp"),
      p("Ryttere over 12 år kjører etter utslagningsmetoden. Hver klasse deles i grupper på høyst åtte ryttere, som kjører tre eller fire innledende heat mot hverandre. De fire med lavest plasseringspoeng går videre. Avhengig av hvor mange som er med, er neste runde åttendedelsfinale, kvartfinale eller semifinale, med ett heat hver, der de fire beste går videre. I semifinalene er det 16 ryttere i to heat, og fire fra hvert går til finalen med åtte ryttere. På de fleste løp i Norge sykler alle som deltar en X-finale."),
      p("Ryttere under 12 år kjører barneleker: tre eller fire innledende heat og et siste heat sammen med finalene i de eldre klassene. Det er ingen rangering, men premier til alle."),
    ],
  },
  {
    id: "for-lopet",
    eyebrow: "Løp og konkurranser",
    title: "Før løpet",
    blocks: [
      h("Påmelding"),
      p("Arrangørens invitasjon legges ved arrangementet i Spond-gruppa BOC BMX. Den har påmeldingslenke, kontingent, dato, sted, tidspunkter, løpsansvarlige og klasser. Hver rytter melder seg på selv, og det er ingen nedre aldersgrense for å kjøre BMX-løp i Norge."),
      h("Lisens og medlemskap"),
      p(
        "For å kjøre løp må du ha betalt medlemskontingenten til BOC og aktivert lisens fra Norges Cykleforbund på ",
        a("sykling.no/lisens", "http://sykling.no/lisens"),
        ". Der oppretter du en profil på rytteren, som lisensen og rytternummeret knyttes til. Lisensen er gratis til og med 12 år og dekkes av NIFs barneidrettsforsikring. Klubben anbefaler at alle løser lisens, slik at de er forsikret også på trening.",
      ),
      h("Rytternummer og skilt"),
      p("Hver rytter får sitt eget nummer første gang de meldes på et løp. Sekretariatet sender det til medlemsansvarlig i klubben, og nummeret følger rytteren resten av karrieren. Alle må ha nummerskilt på sykkelen. Fra året rytteren fyller 11, trengs også sideskilt (hvitt med svart skrift) og MyLaps-tidtakerbrikke, som kan lånes."),
      ul(
        "Gutter, menn og masters: gult skilt med svarte tall.",
        "Jenter og kvinner: blått skilt med hvite tall.",
        "Cruiser: rødt skilt med hvite tall.",
        "Elite, menn og kvinner: hvitt skilt med svarte tall.",
        "Junior, menn og kvinner: svart skilt med hvite tall.",
      ),
      h("Utstyr"),
      p("Påbudt:"),
      ul("Helhjelm som dekker hode og ansikt.", "Heldekkende hansker.", "Lange bukser.", "Langermet trøye."),
      p("Anbefalt:"),
      ul(
        "Lukkede sko (klikksko er tillatt fra 13 år).",
        "Legg- og albuebeskyttere.",
        "Bryst- og ryggbeskytter.",
        "Nakkekrage.",
        "BMX-briller (vanlige solbriller og sportsbriller er ikke tillatt).",
        "Campingstol til pausene i klubbteltet.",
      ),
      p("Klubbdrakt oppfordres, men i barnelekene og på løp som ikke er formelle mesterskap er det lov å kjøre i andre drakter. Klubbdrakten bestilles fra Kalas."),
    ],
  },
  {
    id: "lopsdagen",
    eyebrow: "Løp og konkurranser",
    title: "På løpsdagen",
    blocks: [
      p("Meld deg til laglederen når du kommer. Laglederen holder deg orientert gjennom hele arrangementet."),
      p("Alle som deltar hjelper til med å rigge opp og ned teltet og med oppgavene som står i Spond-arrangementet. Den som frakter klubbtelt og tilhenger, får 500 kroner i godtgjørelse via utleggsskjemaet."),
      p("Our Sqorz brukes før, under og etter løp. Der kan du følge deltakere, klasser, heat og resultater live. Resultatene publiseres også på BMX Resultater."),
    ],
  },
];
const BMX_FACEBOOK = "https://www.facebook.com/BOCBMX";

/** A bundled screenshot as plain data (src and size), for a join wizard. */
const screenshot = (img: { src: string; width: number; height: number }) => ({ src: img.src, width: img.width, height: img.height });

const bmxParticipation = (fee: number): NonNullable<OrgNode["participation"]> => ({
  title: "Slik blir du med",
  intro: "BMX-gruppene er aldersinndelt og trener tirsdag og torsdag i Bærum Sykkelpark. Klubben arrangerer jevnlig rekruttdager for dem som vil prøve.",
  steps: [
    "Følg BOC BMX på Facebook for neste rekruttdag, eller kontakt post@baerumock.no.",
    "Meld deg på rekruttdagen via Spond. Klubben har noe utstyr til utlån.",
    "Til fast trening trenger du BMX-racingsykkel, helhjelm med visir og hakebeskytter, langermet trøye og bukse, sko med flat såle og sykkelhansker. Kne- og albuebeskyttere anbefales.",
    "Bli medlem i BOC og skaff lisens fra Norges Cykleforbund. Lisensen er gratis til og med 12 år.",
  ],
  note: `Treningsavgift for denne gruppen er kr ${fee.toLocaleString("nb-NO")}. Påmelding og siste beskjeder kommer i Spond.`,
  source: { kind: "web", label: "BOC BMX på Facebook", url: BMX_FACEBOOK },
});

const velodromParticipation: NonNullable<OrgNode["participation"]> = {
  title: "Fra introkurs til banetrening",
  intro:
    "Kursdatoer, kapasitet og medlemspris publiseres i BOC Velodrom-gruppen i Spond. Eystein Westgaard er baneansvarlig og en av klubbens instruktører, og medlemstilbud har inkludert sykkel, hjelm og eventuelle sko i egenandelen.",
  steps: [
    "Åpne invitasjonslenken til BOC Velodrom i Spond, eller bruk gruppekode OHNOO.",
    "Meld deg først på et introkurs. Der lærer du fastnavssykkelen, banen og de viktigste sikkerhetsreglene.",
    "Etter bestått introkurs kan du melde deg på A1-baneakkreditering.",
    "Med A1 kan du delta på åpne timer og organisert trening. Sjekk alltid Spond for gjeldende dato, pris og utstyrsinformasjon.",
  ],
  note: "Som eksempel kostet klubbens tilbud i desember 2025 kr 250 for intro og kr 350 for A1, mot ordinært kr 500 og kr 700. Dette er historiske priser; dagens tilbud står i Spond.",
  source: { kind: "spond", label: "Åpne BOC Velodrom i Spond", url: VELODROM_SPOND },
};

const club = (): Club => ({
  id: "boc",
  name: "Bærum og Omegn Cykleklubb",
  shortName: "BOC",
  founded: 1968,
  /* The club's own account of its history, as it wrote it. */
  history: {
    headline: "Fra ABC-klubben til eget anlegg.",
    headlineMuted: "{år} med sykling i Bærum og omegn.",
    since: 1968,
    paragraphs: [
      "Klubben ble etablert i 1968 som Asker og Bærum Cykleklubb, ABC-klubben. Fordi et idrettslag ikke kunne være registrert i to kommuner, ble navnet endret til Bærum og Omegn Cykleklubb i 1969.",
      "Klubben har leid lokaler en rekke steder i Bærum, og har hatt planer om å bygge eget klubbhus helt siden 1980-tallet. I 2013 kunne klubben etablere seg i «eget» klubbhus, og i 2017 inngikk klubben en leiekontrakt med Bærum kommune om å leie dagens klubbhus i 35 år. De leide lokalene er siden utviklet til et anlegg som svært få sykkelklubber har i dag.",
      "På få år har klubben fått egen spinningsal på Gjønnes med 28 sykler, bygget terrengløype, BMX-bane og pumptrack, og renovert klubbhuset. Styrkerommet og mekkerommet er tatt i bruk, og det har vært arrangert flere mekkekvelder.",
      "Med eget klubbhus for alle medlemmene står klubben godt rustet til å utvikle ledere, trenere og syklister, og til fortsatt å være Norges største og beste sykkelklubb.",
    ],
    milestones: [
      { year: 1968, text: "Etablert som Asker og Bærum Cykleklubb (ABC-klubben)" },
      { year: 1969, text: "Nytt navn: Bærum og Omegn Cykleklubb" },
      { year: 2013, text: "Klubben etablerer seg i «eget» klubbhus" },
      { year: 2016, text: "Terrengløypa bygges" },
      { year: 2017, text: "35 års leiekontrakt på klubbhuset med Bærum kommune, og ny BMX-bane" },
      { year: 2019, text: "Pumptrack" },
      { year: 2021, text: "Klubbhuset renoveres" },
    ],
  },
  /* Placeholders until members give their own words: the quotes are written
     for the prototype and belong to invented demo riders, from a BMX kid to
     the Zwift group. Six portraits are illustrations supplied by the site
     owner, riders in club kit who are not club members; Magnus's is a stock
     photograph from Unsplash. The page tags every one «Eksempel». Replace
     each with a real member's quote and portrait, given with their consent,
     and drop `example`. The first is Jakob Jølstad's own, with his own
     headshot, so it carries no `example`. */
  testimonials: [
    {
      personId: "bp-jakob",
      shade: "light",
      notInDeck: true,
      quote: "Det er veldig givende å kunne bidra til at forskjellige nivåer samles på Zwift, og chatten på Companion-appen underveis bidrar til felleskap og god stemning.",
    },
    {
      personId: "bp-demo-silje",
      shade: "light",
      articleSlug: "medlem-silje-boc1",
      quote: "Jeg kom fra løping og trodde BOC 1 var for proffe for meg. Nå er drag og rulling på tirsdagene høydepunktet i uka.",
      example: true,
    },
    {
      personId: "bp-demo-trond",
      shade: "dark",
      articleSlug: "medlem-trond-boc3",
      quote: "Jeg trodde landevei i gruppe var for unge og raske. I BOC 3 er farten akkurat passe, og praten går hele veien.",
      example: true,
    },
    {
      personId: "bp-demo-rebekka",
      shade: "dark",
      articleSlug: "medlem-rebekka-junior",
      quote: "Juniorgruppa ga meg både treningskompiser og mitt første ritt. Det hadde jeg aldri turt å stille på alene.",
      example: true,
    },
    {
      personId: "bp-demo-sander",
      shade: "dark",
      articleSlug: "medlem-sander-bmx",
      quote: "Det beste er startgrinda. Når den faller, er det bare å tråkke så hardt du kan. Og etter treningen får vi is.",
      example: true,
    },
    {
      personId: "bp-demo-robin",
      shade: "light",
      articleSlug: "medlem-robin-zwift",
      quote: "Zwift om vinteren gjør at jeg holder formen uten å sykle alene. Med «Stay together» kommer vi i mål som en gruppe.",
      example: true,
    },
    {
      personId: "bp-demo-magnus",
      shade: "dark",
      articleSlug: "medlem-magnus-downhill",
      quote: "Jeg lærte å kjøre bratt sammen med folk som var litt bedre enn meg. Nå er det jeg som viser de nye linjene på Kolsås.",
      example: true,
    },
    {
      personId: "bp-demo-camilla",
      shade: "light",
      articleSlug: "medlem-camilla-boc4",
      notInDeck: true,
      quote: "BOC 4 var perfekt da jeg var ny på landevei. Vi holder rolig tempo, stopper for kaffe, og ingen sykler alene hjem.",
      example: true,
    },
  ],
  // «Bærum og Omegn Cykleklubb (BOC)» on Strava, club 1026.
  stravaClubUrl: "https://www.strava.com/clubs/1026",
  orgNumber: "984 061 501",
  email: "post@baerumock.no",
  phone: "67 54 22 10",
  address: { street: "Klubbhuset, Bærum Idrettspark", postalCode: "1351", city: "Rud" },
  about:
    "Bærum og Omegn Cykleklubb er en sykkelklubb med fem disipliner: landevei, terreng, BMX, banesykling og innendørs. Klubben drives av frivillige, og har tilbud fra sykkelskole for de yngste til ritt på nasjonalt nivå.",
  heroPhotoId: "b-ph-hero",
  youthPhotoId: "b-ph-bmx-barn",
  joinPhotoId: "b-ph-join",
  /* The statement has two jobs in one breath. The weekly training is what a
     member actually gets — 28 of the club's sessions a week are fellestrening
     — so it comes first and is what "hele året" is about: road through the
     summer, spinning and Zwift through the winter. The races and Mallorca
     follow, because those are the part a free social ride cannot arrange,
     and they are the answer to "why join a club at all". The supporting line
     names both audiences, so a parent knows in one sentence that they are in
     the right place. */
  identity: {
    // Not "hele sommeren": the race calendar is heavy from 1 May to 30 June,
    // empty through July while the club is on fellesferie, and picks up again
    // in August and September.
    headline: "Fellestreninger hele året. Ritt på vår, sommer og høst.",
    headlineMuted: "Mallorca i mars og oktober.",
    intro:
      "Fire landeveisgrupper for voksne, og egne grupper for barn og ungdom fra 5 til 17 år. Om vinteren flytter vi inn på spinning og Zwift, og i Velodromen sykler vi hele året.",
    reach: { value: "Alle nivåer", label: "nybegynner til elitesyklist" },
    newsKinds: "Referater, beskjeder og historier",
    aboutHeadline: "Bærum og Omegn Cykleklubb er en av landets største sykkelklubber, etablert i 1968.",
    aboutMuted: "Alt arbeid gjøres av frivillige, og alle er velkomne til å møte opp på en trening, uansett alder.",
    /* Written as an argument, not a description: the section has to say what
       a membership buys that turning up to a free group ride does not. */
    year: {
      headline: "Sykling er bedre sammen.",
      headlineMuted: "Å kjøre ritt i samme drakt og reise bort sammen krever en klubb.",
      note: "De fleste av oss kjører turritt- eller masterklassen, så du trenger ikke være rask for å stille. Ritt og Mallorca-turer er for medlemmer; påmelding til ritt skjer hos arrangøren.",
    },
  },
  themeId: "boc",
  logo: "wordmark",
  sponsors: [
    { name: "Genus", kind: "Hovedsamarbeidspartner" },
    { name: "Kalas", kind: "Klubbtøy" },
    { name: "Anton Sport", kind: "Utstyr og verksted" },
  ],
  membership: {
    /* The 2027 rates, set at the annual meeting of 11 March 2026 (sak 11); the
       site shows these only (Jakob, October 2026). The 2027 rate for «Rekrutt»
       is not among the figures the club has given, so it keeps its earlier 50 kr. */
    rates: [
      { label: "Hovedmedlem", amount: 700, hint: "17–66 år" },
      { label: "Ungdom", amount: 400, hint: "Til og med 16 år", children: true },
      { label: "Honnør", amount: 350, hint: "Fra 67 år" },
      { label: "Støttemedlem", amount: 350, minor: true },
      { label: "Rekrutt, 3 måneder", amount: 50, hint: "Gir ikke lisens", minor: true },
    ],
    note: "Familiemedlemmer på samme adresse og med samme betaler får 40 % rabatt, og Spond Club legger på et administrasjonsgebyr. Treningsavgift kommer i tillegg der gruppa har det.",
    requiredFor: "Du må være medlem for å melde deg på ritt og bli med på Mallorca-turene.",
  },
  signupUrl: SPOND_SIGNUP,
  grasrotandelenOrgNumber: "984061501",
  // From Norsk Tipping's recipient page, 6 October 2026: 15 695 kr generated so far in 2026, 44 givers.
  grasrotandelenStats: { year: 2026, amountNok: 15695, givers: 44, asOf: "2026-10-06" },
  pages: CLUB_PAGES,
  footerLinks: [
    { label: "Medlemsfordeler", href: `/nyheter/${BOC_BENEFITS_SLUG}` },
    { label: "Styret", href: "/styret" },
  ],
  kit: {
    headline: "Sykle i klubbdrakten.",
    headlineMuted: "Fra Kalas, i race- og fritidsdesign.",
    text: [
      "Klubbdraktene produseres av Kalas og selges i perioder. Når Kalas åpner klubbutikken for et nytt drop, får du beskjed i Spond om når den åpner og hvor lenge den er åpen.",
      "Som medlem får du også fordeler hos Anton Sport, med bonus i Anton Club og fastpris på service, og 5 % av det du handler går tilbake til klubben.",
    ],
    photoId: "b-ph-kits",
    jerseys: [
      { src: jerseyYellow.src, width: jerseyYellow.width, height: jerseyYellow.height, alt: "BOCs racedrakt i klubbens gule racedesign", label: "Race" },
      { src: jerseyBlack.src, width: jerseyBlack.width, height: jerseyBlack.height, alt: "BOCs fritidsdrakt i sort med gule striper", label: "Fritid" },
    ],
    links: [{ label: "Se medlemsfordelene", href: `/nyheter/${BOC_BENEFITS_SLUG}` }],
  },
});

const venues = (): Venue[] => [
  {
    id: "b-idrettspark",
    name: "Bærum Idrettspark",
    area: "Rud",
    surface: "Asfalt og klubbhus",
    mapQuery: "Bærum Idrettspark, Rud",
    photoId: "b-ph-landevei-group",
    note: "Oppmøte for ungdom og junior. Garderober i idrettsparken.",
  },
  {
    id: "b-bekkestua",
    photoId: "b-ph-bekkestua",
    name: "Bekkestua torg",
    area: "Bekkestua",
    surface: "Oppmøtested",
    mapQuery: "Bekkestua torg, Bærum",
    note: "Vanlig oppmøte for BOC 1–4. Road Captain sier fra i Spond når gruppa møtes et annet sted.",
  },
  {
    id: "b-kaffebrenneriet",
    photoId: "b-ph-kaffebrenneriet",
    preposition: "ved",
    name: "Kaffebrenneriet",
    area: "Sandvika",
    surface: "Oppmøtested",
    mapQuery: "Kaffebrenneriet Sandvika",
    note: "Søndagens oppmøte for BOC 1–4. Gruppene samles her og sykler hver for seg.",
  },
  {
    id: "b-sykkelpark",
    preposition: "i",
    name: "Bærum Sykkelpark",
    area: "Bryn",
    surface: "BMX-bane med 5 meters startrampe",
    address: "Gamle Lommedalsvei 99, 1348 Rykkinn",
    mapQuery: "Gamle Lommedalsvei 99, Bærum",
    note: "Ved Bryn skole. Helhjelm, langermet trøye og bukse er påbudt på trening.",
  },
  {
    id: "b-gjonneshallen",
    preposition: "i",
    name: "Gjønneshallen",
    area: "Bekkestua",
    surface: "Spinningsal",
    mapQuery: "Gjønneshallen, Bærum",
    note: "Ta med håndkle og drikke. Klubben har sykler i salen.",
  },
  {
    id: "b-zwift-app",
    preposition: "i",
    name: "Zwift-appen",
    area: "Hjemme",
    surface: "Virtuell sykling på rulle",
    // Never linked (online), but the venue form requires a search text.
    mapQuery: "Zwift",
    online: true,
    photoId: "b-ph-zwift",
    note: "Du trener hjemme med rulle eller wattmåler og kobler til i Zwift. Økten starter i en Meetup, så alle kjører sammen.",
  },
  {
    id: "b-velodromen",
    preposition: "i",
    name: "Velodromen",
    area: "Asker",
    surface: "Innendørs velodrom",
    address: "Langenga 62, Asker",
    mapQuery: "Velodromen, Langenga 62, Asker",
    photoId: "b-ph-bane",
    note: "Banesykkel, hjelm og eventuelle sykkelsko kan lånes på kurs. Se Spond for gjeldende kurs og tider.",
  },
  {
    id: "b-gnist",
    name: "Gnist Gjettum",
    area: "Gjettum",
    surface: "Innendørs sykkelrom",
    mapQuery: "Gnist Gjettum, Bærum",
    note: "Vinterøkter for ungdom og junior.",
  },
  {
    id: "b-eineasen",
    name: "Eineåsen",
    area: "Eiksmarka",
    surface: "Sti og skogsvei",
    mapQuery: "Eineåsen, Bærum",
    note: "Oppmøte på parkeringen. Lykt fra oktober.",
  },
  {
    id: "b-kolsas",
    name: "Kolsås",
    area: "Kolsås",
    surface: "Sti",
    mapQuery: "Kolsåstoppen parkering, Bærum",
  },
  {
    id: "b-vestmarka",
    preposition: "i",
    name: "Vestmarka",
    area: "Vestmarka",
    surface: "Sti og grus",
    mapQuery: "Vestmarksetra, Bærum",
  },
];

/* ── Organisation ─────────────────────────────────────────────────────── */

function nodes({ at, on }: SeedCtx): OrgNode[] {
  let order = 0;
  const node = (n: Omit<OrgNode, "sortOrder" | "updatedAt"> & { updatedAt?: string }): OrgNode => ({
    sortOrder: order++,
    updatedAt: at(-30, "12:00"),
    ...n,
  });
  /* The club's Spond groups and their invite codes (årsmøtepapirene 2026, and
     the club): a group page links to the Spond group its members are in,
     which is often shared by several groups. */
  const spond = (label: string, code: string) => [{ kind: "spond" as const, label, url: `https://spond.com/invite/${code}` }];

  return [
    node({ id: "b-boc", parentId: null, kind: "club", name: "Bærum og Omegn Cykleklubb", slug: "" }),

    node({
      id: "b-sykkel",
      kindLabels: { race: "Ritt" },
      /* From the sport's joinInfo: open sessions, and what membership is for.
         Groups with their own terms (BMX, bane, spinning) set their own. */
      firstTraining: {
        trial: "Alle kan møte opp på en trening, uansett alder, uten å være medlem, og du kan prøve flere ganger. Etter hvert bør du melde deg inn, men det haster ikke å bestemme seg. Du må være medlem for å kjøre ritt og bli med på Mallorca-turene.",
      },
      parentId: "b-boc",
      kind: "sport",
      name: "Sykkel",
      slug: "sykkel",
      leadTitle: "Gruppeleder",
      summary: "Fem disipliner: landevei, terreng, BMX, banesykling og innendørs.",
      description:
        "Klubben har tilbud hele året. Fellesgruppene på landevei møtes på Bekkestua torg i ukedagene og på Kaffebrenneriet i Sandvika i helgene, terrenggruppene holder til i Vestmarka og på Eineåsen, BMX har egen bane i Bærum Sykkelpark, banesyklingen går i Velodromen i Asker hele året, og om vinteren flytter mange av øktene inn på spinning og Zwift.",
      levelLabels: { discipline: "Disiplin", ageGroup: "Avdeling", team: "Gruppe" },
      coverPhotoId: "b-ph-landevei-group",
      identityPhotoId: "b-ph-landevei-corner",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet", "b-idrettspark", "b-sykkelpark", "b-eineasen", "b-velodromen"],
      season: "Landevei april–oktober, BMX og terreng mars–november, innendørs november–mars, banesykling hele året",
      joinInfo:
        "Alle kan møte opp på en trening, uansett alder. Du trenger sykkel og godkjent hjelm. For ritt og Mallorca-turene må du være medlem, og innmelding skjer i Spond.",
      breaks: [
        { label: "Fellesferie, ingen organiserte treninger", from: on(7, 6), to: on(7, 26) },
        { label: "Innesesong: spinning, Zwift og styrke", from: on(11, 2), to: on(3, 15, 1) },
      ],
    }),

    /* ── Landevei ───────────────────────────────────────────────────────── */
    node({
      id: "b-landevei",
      /* From the club (Jakob, September 2026): no Spond needed to turn up, and
         no one is dropped. The youth groups say their own (b-landevei-ung). */
      firstTraining: {
        spondFirstTime: "Du kan møte opp uten Spond. Bli gjerne med i Spond-gruppa for Landevei, så ser du at økten blir av, og om tidspunktet eller oppmøtestedet er endret.",
        keepUp: "Du blir ikke kjørt fra. Går det for fort, samler vi gruppa, og i verste fall avtaler vi at det er greit at du sykler hjem på egen hånd.",
        bring: "Landeveissykkel og godkjent hjelm.",
        arrive: "Kom gjerne 5–10 minutter før, så rekker du å hilse på Road Captain før vi sykler. Vi starter til oppsatt tid.",
      },
      levelOptions: {
        ny: { label: "Ny på landevei eller i gruppe", hint: "Du har lite erfaring med å sykle i felt sammen med andre" },
        litt: { label: "Sykler jevnlig, men lite i gruppe", hint: "Du tar lengre turer på egen hånd og vil lære å sykle i felt. I gruppe går det lettere enn alene" },
        aktiv: { label: "Vant til å sykle i gruppe", hint: "Du trener jevnlig, sykler i rulle og holder over 30 km/t på flatene" },
      },
      parentId: "b-sykkel",
      kind: "discipline",
      name: "Landevei",
      slug: "landevei",
      // Through the winter the road riders train on Zwift; the season sits in every Landevei terminliste.
      seasonsInTerminliste: ["b-zwift"],
      leadTitle: "Road Captain",
      ridingRules: [
        {
          title: "Maks to i bredden",
          icon: "side-by-side",
          text: "I vanlig fart sykler vi maks to i bredden. I lange stigninger på smal vei legger vi oss på én rekke, eller tar sykkelveien der det finnes en.",
        },
        { title: "Ingen «half-wheeling»", icon: "level", text: "Ligg side om side med den ved siden av deg. Et halvt hjul foran presser opp farten og splitter gruppa." },
        { title: "Følg trafikkreglene", icon: "traffic", text: "Vi følger trafikkreglene også når vi sykler i gruppe." },
        { title: "Hjelm og lys", icon: "light", text: "Hjelm er påbudt på alle fellestreninger. Fra solnedgang til soloppgang skal du også ha lys foran og bak." },
        { title: "Spytt og snyt bakerst", icon: "spit", text: "Ingen spytting eller snyting, med mindre du ligger bakerst i gruppa." },
        { title: "Vis hull og sprekker", icon: "hazard", text: "Pek ut hull, sprekker og andre hindringer, og kjør rolig og forutsigbart, så syklisten bak deg kan følge." },
        { title: "Varsle stopp i god tid", icon: "stop", text: "Gi tegn i god tid før du bremser ned eller stopper." },
        { title: "Ingen blir igjen", icon: "wait", text: "Vi stopper alltid ved punkteringer og tekniske problemer, og vi forlater ingen før vi vet at de kommer seg hjem." },
      ],
      summary: "Fire fellesgrupper etter fart, og egen avdeling for barn og ungdom.",
      description:
        [
          "Fellestreningene går i fartsgrupper, så alle holder sammen. Hver gruppe har en Road Captain, og vi følger klubbens regler for gruppekjøring, som står lenger ned på siden.",
          "Fra april til oktober trener BOC 1–4 tirsdag og torsdag kl. 18.00 fra Bekkestua torg, og søndag kl. 10.00 er det langtur fra Kaffebrenneriet i Sandvika, der gruppene samles og sykler hver for seg. I juli er det fellesferie.",
          "Rundt mars og oktober reiser klubben en uke til Mallorca: rabattert hotell, ofte opp mot 50 deltakere og grupper på flere nivåer.",
        ].join("\n\n"),
      coverPhotoId: "b-ph-landevei-hero",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet", "b-idrettspark"],
      joinGroup: { kind: "spond", label: "Bli med i Landevei i Spond", url: "https://spond.com/invite/SKUOD" },
      joinInfo:
        "Bli med i Spond-gruppa for Landevei, så ser du øktene og kan melde deg på. Du trenger landeveissykkel og godkjent hjelm.",
    }),
    node({
      id: "b-boc1",
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-demo-silje", quote: "Torsdagens BOC Tivoli er den tøffeste timen i uka, og den morsomste. Man blir sterk av å ha noen å henge på.", example: true },
      ],
      firstTraining: { pace: "33–37 km/t", distance: "Typisk 40–60 km" },
      parentId: "b-landevei",
      kind: "team",
      name: "BOC 1",
      slug: "boc-1",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "Raskeste fellesgruppe, 33–37 km/t. Intervaller tirsdag, BOC Tivoli torsdag og lagsykling søndag.",
      description: "For deg som er vant til å sykle i felt og tåler høy fart over tid. Tirsdag er det intervaller på FTP og VO2max, torsdag BOC Tivoli med korte, harde intervaller, og søndag lagsykling med tempoturer eller langturer. Målet for 2026 er et lag som sykler smart i ritt, med makkerpar som drar sammen.",
      seasonFocus: "Vätternrunden",
      coverPhotoId: "b-ph-boc-fast-hero",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet"],
      externalLinks: spond("BOC Landevei i Spond", "SKUOD"),
    }),
    node({
      id: "b-boc2",
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-demo-trond", quote: "Vätternrunden samler gruppa. Vi har et felles mål, og hver tirsdag og torsdag handler om å komme dit sammen.", example: true },
      ],
      firstTraining: { pace: "30–33 km/t", distance: "Typisk 40–60 km" },
      parentId: "b-landevei",
      kind: "team",
      name: "BOC 2",
      slug: "boc-2",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "30–33 km/t. Tirsdag og torsdag, og langtur søndag.",
      coverPhotoId: "b-ph-boc2",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet"],
      description: "Bakkeintervaller, lagtempo og rulle, på begge sider av fjorden. Målet for 2026 er Vätternrunden med over 37 km/t i snitt, med Enebakk Rundt og Randsfjorden Rundt som oppkjøring.",
      seasonFocus: "Vätternrunden",
      externalLinks: spond("BOC Landevei i Spond", "SKUOD"),
    }),
    node({
      id: "b-boc3",
      externalLinks: spond("BOC Landevei i Spond", "SKUOD"),
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-demo-trond", quote: "Jeg trodde landevei i gruppe var for unge og raske. Farten er akkurat passe, og praten går hele veien.", example: true },
      ],
      firstTraining: { pace: "27–30 km/t", distance: "Typisk 40–60 km" },
      parentId: "b-landevei",
      kind: "team",
      /* BOC T-O, the team for Trondheim–Oslo, rides at BOC 3's level and
         trains with it, so the site shows them as one group rather than
         two offers competing for the same riders: «BOC 3» everywhere, and
         «BOC 3 / BOC T-O» as the heading on its own page. */
      name: "BOC 3",
      pageHeading: "BOC 3 / BOC T-O",
      slug: "boc-3",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "27–30 km/t. Tirsdag og torsdag, og langtur søndag. En del av gruppa sykler mot Trondheim–Oslo.",
      description:
        "En stabil gjeng erfarne ryttere med god tone. En del av gruppa har Styrkeprøven fra Trondheim til Oslo som mål og trener ekstra på rulle, i lange perioder låst, og på lange søndagsturer i rolig tempo. Enebakk Rundt og Randsfjorden Rundt kjører vi sammen.",
      coverPhotoId: "b-ph-boc3",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet"],
    }),
    node({
      id: "b-boc4",
      externalLinks: spond("BOC Landevei i Spond", "SKUOD"),
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-demo-camilla", quote: "Jeg hadde aldri syklet i gruppe før. Første kveld viste de meg hvordan rulla fungerer, og ingen gjorde et nummer av det.", example: true },
        { personId: "bp-ida-foss", quote: "Det er mange kvinner her, og det gjorde det lettere å komme første gang.", example: true },
        { personId: "bp-arne-lund", quote: "Jeg vil sykle langt, ikke fort. Søndagsturen fra Sandvika med kaffestopp er ukas høydepunkt.", example: true },
      ],
      firstTraining: {
        pace: "24–27 km/t, rolig tempo",
        distance: "Typisk 40–60 km",
        bring: "Landeveissykkel, hjelm og noe å drikke.",
        keepUp: "Ingen blir sykla av, og ingen sykler alene hjem.",
      },
      parentId: "b-landevei",
      kind: "team",
      name: "BOC 4",
      slug: "boc-4",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      simpleSchedule: true,
      breaks: [{ label: "Fellesferie, ingen fellestreninger", from: on(7, 1), to: on(7, 31) }],
      summary: "24–27 km/t, rolig tempo og ingen som blir sykla av. Tirsdag og torsdag, og langtur søndag.",
      description: "Klubbens innstegsgruppe, for deg som er ny på landevei eller vil sykle sosialt, og for erfarne som er fornøyd med moderat fart. Vi legger særlig til rette for at kvinner skal kunne sykle med oss, og vi starter sesongen med rulleopplæring. Vi stopper for kaffe, og ingen sykler alene hjem.",
      joinInfo: "Møt opp på Bekkestua torg en tirsdag eller torsdag kl. 18.00, eller på søndagsturen fra Sandvika, og sjekk Spond for endringer. Du trenger landeveissykkel, hjelm og noe å drikke.",
      coverPhotoId: "b-ph-boc4",
      venueIds: ["b-bekkestua", "b-kaffebrenneriet"],
    }),
    /* The two youth groups on the road sit under one heading rather than
       beside BOC 1–4: a parent looking for somewhere to put a fourteen-year-
       old should find one door, not two groups they have to compare. The
       groups themselves stay separate, because the training is. */
    node({
      id: "b-landevei-ung",
      firstTraining: {
        signUp: "Kontakt gruppelederen før første trening, så får du nærmere informasjon i Spond.",
        spondFirstTime: "",
        keepUp: "Ingen blir forlatt. En trener følger uansett med den som ikke henger med.",
      },
      parentId: "b-landevei",
      kind: "ageGroup",
      name: "Barn og ungdom",
      slug: "barn-og-ungdom",
      ageLabel: "13–18 år",
      ageRange: [13, 18],
      summary: "Ungdom og junior på landevei, med egne treninger og egen plan.",
      description:
        "Ungdomsgruppa og juniorgruppa trener hver for seg, men hører sammen: ungdom fra det året de fyller 13, junior fra 17. Begge møtes i Bærum Idrettspark, og begge kjører ritt for klubben gjennom sesongen.",
      coverPhotoId: "b-ph-junior",
      venueIds: ["b-idrettspark"],
    }),
    node({
      id: "b-ungdom",
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-selma", quote: "Det er gøy å trene med triatlongjengen fra BSV. Man blir kjent med folk fra andre klubber også.", example: true },
        { personId: "bp-demo-magnus", quote: "Fredagsturene er det beste. Vi sykler langt, men i et tempo der man kan prate.", example: true },
      ],
      parentId: "b-landevei-ung",
      kind: "team",
      name: "Ungdom",
      slug: "ungdom",
      ageLabel: "13–16 år",
      ageRange: [13, 16],
      summary: "Intervaller tirsdag og langtur fredag, sammen med BSV Triatlon.",
      description:
        "Ungdomsgruppa drives sammen med BSV Triatlon i Bærumsvømmerne: BOC-ungdom fra 13 til 23 år kan bli med på deres intervalløkter, teknikk og langturer, og står i treningsgruppa deres i Spond. Om vinteren er det innendørs sykling på Gnist Gjettum og løping og styrke i idrettsparken.",
      joinInfo:
        "Treningsavgiften er 850 kr per halvår, eller 150 kr i måneden. Du trenger sykkel og hjelm; resten avtaler vi. Ta kontakt med treneren, så blir du lagt til i Spond-gruppa.",
      coverPhotoId: "b-ph-junior",
      venueIds: ["b-idrettspark", "b-gnist"],
      externalLinks: spond("BOC Landevei i Spond", "SKUOD"),
    }),
    node({
      id: "b-junior",
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-demo-rebekka", quote: "Vi har en plan for hele sesongen, så jeg vet hva jeg trener mot.", example: true },
        { personId: "bp-jonas", quote: "Her er alle opptatt av ritt. Det er lettere å gi alt på intervallene når de andre gjør det samme.", example: true },
      ],
      firstTraining: { bring: "Sykkel og hjelm." },
      parentId: "b-landevei-ung",
      kind: "team",
      name: "Junior",
      slug: "junior",
      ageLabel: "17–18 år",
      ageRange: [17, 18],
      summary: "For ryttere som satser på ritt, med egen plan gjennom sesongen.",
      coverPhotoId: "b-ph-junior",
      venueIds: ["b-idrettspark"],
      externalLinks: spond("BOC Landevei i Spond", "SKUOD"),
    }),

    /* ── Terreng ────────────────────────────────────────────────────────── */
    node({
      id: "b-terreng",
      firstTraining: {
        bring: "Sykkel og hjelm.",
        keepUp: "Du blir ikke kjørt fra. Går det for fort, samler vi gruppa, og i verste fall avtaler vi at det er greit at du sykler hjem på egen hånd.",
        // Terreng's groups are led by a «Gruppeleder» (leadTitle on the sport).
        arrive: "Kom gjerne 5–10 minutter før, så rekker du å hilse på gruppelederen før vi sykler. Vi starter til oppsatt tid.",
      },
      levelOptions: {
        ny: { label: "Ny på sti", hint: "Du har syklet lite i terrenget" },
        litt: { label: "Sykler grusvei og enkle stier", hint: "Du har syklet en del, men lite på teknisk sti" },
        aktiv: { label: "Vant til teknisk sti", hint: "Du sykler røtter, stein og bratte partier, og trener jevnlig" },
      },
      parentId: "b-sykkel",
      kind: "discipline",
      name: "Terreng",
      slug: "terreng",
      summary: "Barn, unge, turgruppe, seniorgruppe og downhill.",
      description:
        "Terrenggruppene sykler på stiene i Vestmarka, på Eineåsen og rundt Kolsås. Vi legger vekt på teknikk og trygg kjøring før fart, og arrangerer spesialtreninger og turer gjennom sesongen. I uke 33 holder vi terrengsykkelskole for 9–13 år, åpen også for andre klubber og for dem uten klubbbakgrunn.",
      coverPhotoId: "b-ph-terreng",
      venueIds: ["b-eineasen", "b-vestmarka", "b-kolsas"],
    }),
    node({
      id: "b-terrengskolen",
      externalLinks: spond("BOC Terreng Barn og Ungdom i Spond", "XRVJM"),
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-rune", quote: "Det handler om mestring, ikke fart. Han kommer hjem stolt hver mandag.", relation: "Forelder i Terreng Rekrutt", example: true },
        { personId: "bp-ingvild-moe", quote: "Vi hadde ikke egen terrengsykkel da vi begynte. Det var godt å høre at hverdagssykkelen duger, og at dekkene er det viktigste.", relation: "Forelder i Terreng Rekrutt", example: true },
      ],
      firstTraining: {
        bring: "Sykkel, hjelm (uten unntak), en sykkelslange og drikke.",
        signUp: "Meld deg i Spond først, så får du beskjed om tid og sted.",
        trial: "Du kan prøve en eller to ganger før du melder deg inn, men registrer deg i Spond først. Det gir oss oversikt, hjelper oss å planlegge, og dekker forsikringen.",
        keepUp: "Ingen blir forlatt. En trener følger uansett med den som ikke henger med.",
      },
      parentId: "b-terreng",
      kind: "team",
      name: "Terreng Rekrutt",
      slug: "terreng-rekrutt",
      ageLabel: "6–9 år",
      ageRange: [6, 9],
      summary: "Barn 6–9 år på sti, med mestring og moro i fokus. Mandager 18.00–19.30.",
      description:
        "Rekruttgruppa er for barn mellom 6 og 9 år som vil sykle terreng i Bærum. Gruppa deles ofte i to etter alder, omtrent 6–8 og 8–10 år, men vi justerer etter erfaring og ferdighet. Fokuset er mestring og å ha det gøy.",
      joinInfo: "Du kan prøve en eller to ganger før du melder deg inn, men registrer deg i Spond først. Hjelm er påbudt.",
      contactNote: "Du kan også sende e-post til bocterreng@gmail.com, men Spond er den beste veien.",
      sections: TERRENG_UNGE_SECTIONS,
      breaks: [{ label: "Sommerferie, ingen treninger", from: on(6, 20), to: on(8, 16) }],
      coverPhotoId: "b-ph-terrengskolen",
      venueIds: ["b-eineasen"],
    }),
    node({
      id: "b-terreng-barn",
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-demo-sander", quote: "Torsdagene i Vestmarka er best. Da sykler vi de bratte stiene nedover.", example: true },
        { personId: "bp-tone", quote: "Trenerne passer på at alle kommer seg ned, og ingen blir igjen i skogen.", relation: "Forelder i Terreng 10+", example: true },
      ],
      firstTraining: {
        bring: "Sykkel, hjelm (uten unntak), en sykkelslange og drikke.",
        signUp: "Meld deg i Spond først, så får du beskjed om tid og sted.",
        trial: "Du kan prøve en eller to ganger før du melder deg inn, men registrer deg i Spond først. Det gir oss oversikt, hjelper oss å planlegge, og dekker forsikringen.",
        keepUp: "Ingen blir forlatt. En trener følger uansett med den som ikke henger med.",
      },
      parentId: "b-terreng",
      kind: "team",
      name: "Terreng 10+",
      slug: "terreng-10-pluss",
      ageLabel: "Fra 10 år",
      ageRange: [10, 19],
      summary: "Fra 10 år, i undergrupper etter alder og ferdighet. Mandager og torsdager 18.00–19.30.",
      description:
        "Terreng 10+ er for deg fra 10 år som vil sykle terreng i Bærum. Vi deler oss i undergrupper etter alder og ferdighet, omtrent 10–12, 12–14 og fra 15 år, og inndelingen er veiledende. En 14-åring som ikke har syklet i klubb før, havner ikke nødvendigvis i den eldste gruppa fra start. På mandager er det litt mer teknikktrening, og på torsdager er det mer tur på sti.",
      joinInfo: "Du kan prøve en eller to ganger før du melder deg inn, men registrer deg i Spond først. Hjelm er påbudt.",
      contactNote: "Du kan også sende e-post til bocterreng@gmail.com, men Spond er den beste veien.",
      sections: TERRENG_UNGE_SECTIONS,
      breaks: [{ label: "Sommerferie, ingen treninger", from: on(6, 20), to: on(8, 16) }],
      coverPhotoId: "b-ph-terreng-ungdom",
      venueIds: ["b-vestmarka", "b-eineasen"],
      externalLinks: spond("BOC Terreng Barn og Ungdom i Spond", "XRVJM"),
    }),
    node({
      id: "b-downhill",
      externalLinks: spond("BOC Utfor og Enduro i Spond", "ABYAW"),
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-demo-magnus", quote: "Fellesturene til Hafjell er grunnen til at jeg begynte. Det er lettere å våge seg utfor når man er flere.", example: true },
        { personId: "bp-kjetil-aas", quote: "Jeg kjører enduro sammen med sønnen min. Det er en av få grupper der vi kan trene sammen.", example: true },
      ],
      // From 13 and up, so neither the adults' nor the children's answer fits as it stands.
      firstTraining: { keepUp: "" },
      parentId: "b-terreng",
      kind: "team",
      name: "Downhill – Enduro",
      slug: "downhill-enduro",
      ageLabel: "Fra 13 år",
      ageRange: [13, 99],
      summary: "Utfor og enduro, med fellesturer til Drammen og Hafjell.",
      description: "Gruppa trener teknikk i bakkene rundt Bærum og reiser sammen til løp i Norgescupen i utfor.",
      league: "Norgescup utfor",
      coverPhotoId: "b-ph-downhill",
      venueIds: ["b-kolsas"],
    }),
    node({
      id: "b-terreng-tur",
      externalLinks: spond("BOC Terreng/Gravel Voksne i Spond", "ILDWY"),
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-gunnar-lie", quote: "Jeg vil ut i skogen, ikke konkurrere. Vi sykler i et tempo der alle henger med, og det er alltid en kaffestopp.", example: true },
        { personId: "bp-demo-camilla", quote: "Jeg lærte å sykle på sti her. Turtempoet gjorde at jeg turte å prøve.", example: true },
      ],
      parentId: "b-terreng",
      kind: "team",
      name: "Terreng Tur",
      slug: "terreng-tur",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      summary: "Rolige turer på sti og grusvei, med kaffestopp. Torsdager.",
      coverPhotoId: "b-ph-terreng-berm",
      venueIds: ["b-vestmarka"],
    }),
    node({
      id: "b-terreng-senior",
      externalLinks: spond("BOC Terreng/Gravel Voksne i Spond", "ILDWY"),
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-demo-silje", quote: "På onsdagene får jeg fart på sti. Terrengkarusellen gjør at det er noe å strekke seg mot.", example: true },
        { personId: "bp-oyvind-tangen", quote: "Stiene rundt Kolsås er utfordrende nok til at man blir bedre for hver uke.", example: true },
      ],
      parentId: "b-terreng",
      kind: "team",
      name: "Terreng Senior",
      slug: "terreng-senior",
      ageLabel: "Fra 17 år",
      ageRange: [17, 99],
      summary: "Høyere tempo på sti, og ritt i terrengkarusellen. Onsdager.",
      coverPhotoId: "b-ph-terreng-berm",
      venueIds: ["b-kolsas", "b-vestmarka"],
    }),

    /* ── BMX ────────────────────────────────────────────────────────────── */
    node({
      id: "b-bmx",
      sections: BMX_RACE_SECTIONS,
      // Newcomers start with a recruit day (bmxParticipation), not an ordinary session.
      newcomersStartElsewhere: true,
      /* From bmxParticipation: a recruit day first, then membership and a licence. */
      firstTraining: {
        signUp: "Vil du prøve BMX, meld deg på en rekruttdag i Spond.",
        bring: "Til rekruttdagen har klubben noe utstyr til utlån. Til fast trening trenger du BMX-racingsykkel, helhjelm med visir og hakebeskytter, langermet trøye og bukse, sko med flat såle og sykkelhansker.",
        trial: "Du kan prøve på en rekruttdag. Vil du trene fast, melder du deg inn i BOC og skaffer lisens fra Norges Cykleforbund, som er gratis til og med 12 år.",
      },
      parentId: "b-sykkel",
      kind: "discipline",
      name: "BMX",
      slug: "bmx",
      summary: "Omtrent 80 aktive medlemmer fra fem år, med trening og løp for alle nivåer.",
      description:
        "BMX racing er en olympisk disiplin som kjøres på spesialbygde baner på 300–400 meter. Sporten kombinerer fart, spenning og tekniske ferdigheter. BOC trener i Bærum Sykkelpark fra april til oktober eller november, og deltar i lokale, regionale og nasjonale løp som Regionscup, Succé Cup og NM.",
      coverPhotoId: "b-ph-bmx-air",
      venueIds: ["b-sykkelpark"],
      season: "April–oktober/november",
      externalLinks: [
        { kind: "web", label: "Se BMX under Paris 2024", url: "https://www.youtube.com/watch?v=AIeimpCYXfE" },
        { kind: "web", label: "Utstyrguide", url: "https://www.baerumock.no/contentcategory/948569515" },
        { kind: "web", label: "BOC BMX på Facebook", url: BMX_FACEBOOK },
        { kind: "web", label: "Intern Facebook-gruppe", url: "https://www.facebook.com/groups/bocbmxintern/" },
        { kind: "web", label: "Bli medlem", url: "https://www.baerumock.no/contentcategory/948554353" },
        { kind: "web", label: "BMX hos Norges Cykleforbund", url: "https://sykling.no/bmx/" },
      ],
    }),
    node({
      id: "b-bmx-rekrutt",
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-marius-hovde", quote: "Rekruttdagen var nok. Hun fikk låne sykkel og hjelm, og ville tilbake dagen etter.", relation: "Forelder i Gruppe 1", example: true },
        { personId: "bp-siri-lund", quote: "Trenerne er gode med de minste. Det er mye lek, og de lærer å sykle over kulene uten at det blir skummelt.", relation: "Forelder i Gruppe 1", example: true },
      ],
      parentId: "b-bmx",
      kind: "team",
      name: "Gruppe 1",
      slug: "rekrutt",
      ageLabel: "5–7 år",
      ageRange: [5, 7],
      summary: "Tirsdag og torsdag kl. 18.00–19.00 i Bærum Sykkelpark.",
      joinInfo: "Vil du prøve BMX, kan du bli med på en rekruttdag. Påmelding skjer via Spond, og klubben har noe utstyr til utlån.",
      participation: bmxParticipation(800),
      coverPhotoId: "b-ph-bmx-gruppe1",
      venueIds: ["b-sykkelpark"],
      externalLinks: [
        ...spond("BOC BMX i Spond", "AHBTC"),
        { kind: "web", label: "NCF-lisens", url: "https://sykling.no/lisens/" },
      ],
    }),
    node({
      id: "b-bmx-racing",
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-anette-berg", quote: "Det er god stemning i foreldregruppa. Vi hjelper til på løp og dugnad, og barna blir kjent på tvers av årskull.", relation: "Forelder i Gruppe 2", example: true },
        { personId: "bp-hakon-dale", quote: "Han har allerede prøvd seg i Regionscupen. Klubben tar med telt, så ingen står alene på løpsdagen.", relation: "Forelder i Gruppe 2", example: true },
      ],
      parentId: "b-bmx",
      kind: "team",
      name: "Gruppe 2",
      slug: "racing",
      ageLabel: "8–10 år",
      ageRange: [8, 10],
      summary: "Tirsdag og torsdag kl. 18.00–19.15 i Bærum Sykkelpark.",
      league: "Regionscup, Succé Cup og NM",
      participation: bmxParticipation(1500),
      coverPhotoId: "b-ph-bmx-start",
      venueIds: ["b-sykkelpark"],
      externalLinks: [
        ...spond("BOC BMX i Spond", "AHBTC"),
        { kind: "web", label: "NCF-lisens", url: "https://sykling.no/lisens/" },
      ],
    }),
    node({
      id: "b-bmx-voksen",
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-demo-sander", quote: "Jeg liker at vi får målt tidene på hver rette og i hver sving. Da ser jeg om jeg har blitt bedre.", example: true },
        { personId: "bp-thea-kvam", quote: "Vi reiser på løp sammen, og det er det morsomste med BMX.", example: true },
      ],
      parentId: "b-bmx",
      kind: "team",
      name: "Gruppe 3",
      slug: "cruiser",
      ageLabel: "Fra 11 år",
      ageRange: [11, 99],
      summary: "Tirsdag og torsdag kl. 19.00–20.30 i Bærum Sykkelpark.",
      league: "Regionscup, Succé Cup og NM",
      participation: bmxParticipation(2500),
      coverPhotoId: "b-ph-bmx-berm",
      venueIds: ["b-sykkelpark"],
      externalLinks: [
        ...spond("BOC BMX i Spond", "AHBTC"),
        { kind: "web", label: "NCF-lisens", url: "https://sykling.no/lisens/" },
      ],
    }),

    /* ── Banesykling ─────────────────────────────────────────────────────── */
    node({
      id: "b-bane",
      parentId: "b-sykkel",
      kind: "discipline",
      name: "Banesykling",
      slug: "banesykling",
      summary: "Kurs og banetrening i Velodromen i Asker hele året, for ungdom og voksne.",
      description:
        "Banegruppa sykler i Velodromen i Asker gjennom hele året, på fastnavssykler på en overbygd bane. Nye starter med introkurs og kan deretter ta A1-akkreditering, som gir tilgang til åpne timer og organisert trening. Sykkel og hjelm kan lånes på kurs.",
      joinInfo:
        "Banesykling krever kurs: nye starter med introkurs før A1-baneakkreditering. Kursene publiseres i Spond-gruppen BOC Velodrom, og banesykkel og hjelm lånes på kurset.",
      coverPhotoId: "b-ph-bane",
      venueIds: ["b-velodromen"],
    }),
    node({
      id: "b-banegruppa",
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-demo-robin", quote: "Introkurset gjorde det enkelt å komme i gang. Sykkelen var med i kurset, så jeg trengte ikke kjøpe noe først.", example: true },
        { personId: "bp-line-kolstad", quote: "Banen er perfekt om vinteren. Ingen trafikk, og man kan kjøre hardt hele timen.", example: true },
      ],
      // Newcomers start with an intro course (velodromParticipation).
      newcomersStartElsewhere: true,
      firstTraining: {
        signUp: "Start med et introkurs. Kursdatoer og påmelding står i BOC Velodrom-gruppen i Spond.",
        bring: "Sjekk Spond for utstyr. Medlemstilbudene har hatt sykkel, hjelm og eventuelle sko med i egenandelen.",
        trial: "Kursdato, pris og medlemspris står i BOC Velodrom-gruppen i Spond.",
      },
      parentId: "b-bane",
      kind: "team",
      name: "Banegruppa",
      slug: "banegruppa",
      ageLabel: "Fra 13 år",
      ageRange: [13, 99],
      summary: "Introkurs, A1-akkreditering og organiserte økter i Velodromen i Asker. Lånesykler til nye.",
      description:
        "BOC-medlemmer kan delta på rabatterte kurs i Velodromen. Introkurset gir en trygg innføring i fastnavssykkelen, banen og grunnleggende kjøreregler. Bestått introkurs er krav før A1-baneakkreditering, som åpner for åpne timer og organisert trening.",
      joinInfo: "Registrer deg i Spond-gruppen BOC Velodrom med kode OHNOO og meld deg på arrangementet der. Påmelding via velodromen.no er ikke nødvendig for kurs klubben organiserer i Spond.",
      announcement: {
        eyebrow: "Neste banekurs",
        title: "Dato og ledige plasser publiseres i Spond.",
        text: "Bli med i gruppen BOC Velodrom for å se neste introkurs og A1-kurs. Påmelding skjer direkte på kursarrangementet i Spond.",
        href: VELODROM_SPOND,
        linkLabel: "Se neste kurs og meld deg på",
      },
      participation: velodromParticipation,
      coverPhotoId: "b-ph-bane",
      venueIds: ["b-velodromen"],
      externalLinks: [{ kind: "spond", label: "BOC Velodrom i Spond", url: VELODROM_SPOND }],
    }),

    /* ── Triatlon ──────────────────────────────────────────────────────────
       From årsmøtepapirene 2026: a group that has been quiet for some years,
       with interest picking up again, and the club's agreement with the
       triathlon group in Bærumsvømmerne (BSV). One group, so the branch page
       forwards to it (org.soleGroup). No weekly sessions are published yet,
       so the page has none. */
    node({
      id: "b-triatlon",
      parentId: "b-sykkel",
      kind: "discipline",
      name: "Triatlon",
      slug: "triatlon",
      summary: "Svømming, sykling og løping, i samarbeid med triatlongruppa i Bærumsvømmerne.",
    }),
    node({
      id: "b-triatlongruppa",
      parentId: "b-triatlon",
      kind: "team",
      name: "Triatlongruppa",
      slug: "triatlongruppa",
      ageLabel: "Voksne",
      ageRange: [18, 99],
      summary: "Svømming, sykling og løping. Gruppa er på vei opp igjen, og samarbeider med Bærumsvømmerne.",
      description:
        "Triatlongruppa har vært lite aktiv de siste årene, men nå er interessen på vei opp igjen. Gjennom samarbeidet med triatlongruppa i Bærumsvømmerne (BSV) kan BOC-medlemmer trene svømming med elitetrener på kanten og få de samme avtalene som BSV-medlemmer, blant annet på Hundsund bad. Voksne triatleter fra BSV kan sykle sammen med BOC.",
      joinInfo: "Bli med i Spond-gruppa BOC Triatlon med kode XHWFH, så får du beskjed om økter og samlinger.",
      joinGroup: { kind: "spond", label: "Bli med i BOC Triatlon i Spond", url: "https://spond.com/invite/XHWFH" },
      externalLinks: spond("BOC Triatlon i Spond", "XHWFH"),
    }),

    /* ── Innendørs ──────────────────────────────────────────────────────── */
    node({
      id: "b-innendors",
      parentId: "b-sykkel",
      kind: "discipline",
      name: "Innendørs",
      slug: "innendors",
      summary: "Spinning og Zwift fra november til mars.",
      description:
        "Når utesesongen er over, holder klubben beina i gang innendørs. Spinningtimene går i Gjønneshallen med klubbens egne instruktører, og på Zwift kjører vi felles intervalløkter mandag og onsdag fra 1. november ut mars.",
      // Zwift's picture leads the page and the menu alike: the programme most of the winter rides on.
      coverPhotoId: "b-ph-zwift",
      identityPhotoId: "b-ph-zwift",
      venueIds: ["b-gjonneshallen", "b-zwift-app"],
    }),
    node({
      id: "b-zwift",
      // Added via /admin/sitater; folded back in here 2026-09-28 after a
      // stale Supabase override was found shadowing this node (see git log).
      quotes: [
        {
          personId: "bp-jakob",
          quote:
            "Det er veldig givende å kunne bidra til at forskjellige nivåer samles på Zwift, og chatten på Companion-appen underveis bidrar til felleskap og god stemning.",
        },
        { personId: "bp-esten-oversjoen", quote: "Veldig bra med intervall-økter. God variasjon og fint med fast og forutsigbart opplegg." },
      ],
      parentId: "b-innendors",
      kind: "team",
      name: "Zwift",
      slug: "zwift",
      ageLabel: "Fra 15 år",
      ageRange: [15, 99],
      summary: "Felles intervalløkt mandag og onsdag, 1. november ut mars. «Stay together» er på, så alle nivåer kan kjøre sammen.",
      description:
        "Jakob Jølstad inviterer til Meetups i Zwift, og vi kjører samme intervalløkt samtidig med «Stay together» slått på. Da holder alle følge i gruppa uansett watt, så ingen trenger å føle at de sinker noen.",
      joinInfo: "Meld deg på i Spond-gruppa BOC Zwifters, og velg «I'm a member» selv om du ikke har meldt deg inn i BOC ennå. Følg så stegene under «Slik blir du med på Zwift», så får du Meetup-invitasjonen fra Jakob Jølstad i Zwift Companion.",
      // Spond group code LFODS (årsmøtepapirene 2026).
      joinGroup: { kind: "spond", label: "Meld deg på i Spond", url: "https://spond.com/invite/LFODS" },
      participation: {
        title: "Slik blir du med på Zwift",
        intro: "Meetup-invitasjoner kan bare sendes til personer som følger arrangøren. Derfor må følgeforespørselen være på plass før Jakob setter opp økten.",
        steps: [
          "Åpne Zwift Companion, søk etter Jakob Jølstad og velg Følg.",
          "Når invitasjonen vises på startsiden i Companion, åpner du den og velger Going. Lagre eventuelt en påminnelse.",
          "Start Zwift i god tid, koble til rulle eller wattmåler og gå inn i en valgfri verden før økten begynner.",
          "Godta meldingen om å bli med i Meetup når den vises. Fortsett å tråkke for å bli med gruppen når «Keep Everyone Together» er aktivert.",
        ],
        note: "Meetupen bruker «Keep Everyone Together»: ulik watt går fint, men ryttere som slutter å tråkke kan falle av gruppen.",
        /* The same path as the group's presentation (/presentasjon/zwift-2025-26),
           one step at a time with its screenshots from Zwift Companion. */
        wizard: [
          {
            title: "Gjør klar utstyret",
            text: "Alle nivåer kjører sammen, så du trenger ikke være i form. Du trenger bare det som skal til for å sykle på Zwift hjemme.",
            points: ["En Zwift-konto med abonnement (ca. 250 kr/mnd)", "En smartrulle eller en wattmåler på sykkelen", "Zwift Companion-appen på telefonen"],
            link: { label: "Zwifts egen startguide for smartruller", url: "https://www.zwift.com/eu/zwift-ready-smart-trainers" },
            images: [{ ...screenshot(zwiftSetup), alt: "Rytter i BOC-drakt monterer sykkelen på en smartrulle (Wahoo), klar til å kjøre Zwift hjemme" }],
            appLink: {
              name: "Zwift Companion",
              icon: screenshot(zwiftCompanionIcon),
              iosUrl: "https://apps.apple.com/us/app/zwift-companion/id934083691",
              androidUrl: "https://play.google.com/store/apps/details?id=com.zwift.android.prod",
            },
          },
          {
            title: "Meld deg på i Spond",
            text: "Meld deg på selve økta i Spond, så vet jeg om du skal ha en Meetup-invitasjon. Det gjør du hver gang, ikke bare første gang.",
            points: ["Åpne økta i Spond-gruppa", "Trykk «Attending»"],
            spond: true,
            images: [{ ...screenshot(spondZwiftEvent), alt: "Spond: økta «Mandagsøkt Zwift» med Attending/Decline, og 66 uten svar" }],
          },
          {
            title: "Følg gruppelederen",
            text: "Meetup-invitasjoner kan bare sendes til dem som følger arrangøren, så dette må være gjort før økten settes opp.",
            points: ["Åpne Zwift Companion og trykk More", "Velg Find Zwifters", "Søk etter «Jakob Jølstad» og trykk følg-knappen"],
            images: [
              { ...screenshot(companionMenu), alt: "Zwift Companion: More nederst til høyre, og Find Zwifters i menyen" },
              { ...screenshot(companionSearch), alt: "Zwift Companion: søk etter Jakob Jølstad og følg-knappen" },
            ],
          },
          {
            title: "Godta invitasjonen",
            text: "Før hver økt får du en invitasjon til Meetupen. Godta den, så står du på lista.",
            points: ["Trykk Events", "Velg Meetups og finn økta under «Your Meetups»", "Åpne den og trykk på haken"],
            images: [
              { ...screenshot(companionMeetups), alt: "Zwift Companion: Events, Meetups og invitasjonen under Your Meetups" },
              { ...screenshot(companionAccept), alt: "Zwift Companion: Meetup-invitasjonen med grønn hake for å godta" },
            ],
          },
          {
            title: "Bli med når økten starter",
            text: "Start Zwift i god tid og koble til rulla eller wattmåleren.",
            points: [
              "Logg på Zwift",
              "Meetupen ligger som foreslått aktivitet",
              "Gå inn på den og vent på start",
              "Fortsett å tråkke: med «Keep Everyone Together» holder du følge uansett watt",
            ],
            images: [{ ...screenshot(bocZwiftRide), alt: "Zwift: gruppa samlet i pakk, med BOC-ryttere i «Zwifters Nearby»-lista til høyre" }],
          },
          {
            title: "Velg dagens intervalløkt",
            text: "Alle kjører samme workout. Hvilken står i beskrivelsen av dagens økt.",
            points: ["Stå klar med sykkelen i Meetupen", "Klikk Meny → Workouts", "Velg økta som står i beskrivelsen"],
            images: [{ ...screenshot(bocZwiftRide), alt: "Zwift: intervalløkta «Hang Ten» med neste drag, «ride at 260w for 1 min», øverst til venstre" }],
          },
        ],
        wizardDone: { label: "Se presentasjonen", href: "/presentasjon/zwift-2025-26" },
      },
      coverPhotoId: "b-ph-zwift",
      venueIds: ["b-zwift-app"],
      /* Fryd Vinterligaen (frydvinterligaen.no): a Zwift league run by
         5071CK, eight races through the winter. Taking part is up to each
         rider, who signs up with the organiser. */
      announcement: {
        eyebrow: "Frivillig for Zwift-gruppa · Fryd Vinterligaen 2026/27",
        title: "Påmeldingen til Fryd Vinterligaen åpner 1. oktober kl. 12.",
        titleOpen: "Påmeldingen til Fryd Vinterligaen er åpen.",
        opensAt: "2026-10-01T12:00",
        until: "2027-03-31T23:59",
        text: "En liga på Zwift med åtte ritt gjennom vinteren, arrangert av 5071CK. Det er frivillig å være med, og du melder deg på selv hos arrangøren.",
        href: "https://www.frydvinterligaen.no/no/",
        linkLabel: "Til Fryd Vinterligaen",
        inline: true,
      },
      hideSections: ["terminliste", "season"],
      // Ridden in the evening, often in a dark room: the page is dark too.
      pageTone: "dark",
      // The name is also the platform: «sykler på Zwift», not «i Zwift».
      namePreposition: "på",
      // The white wordmark, for this always-dark page (see OrgNode.titleLogo).
      titleLogo: screenshot(zwiftLogoWhite),
      heroActions: {
        primary: { label: "Slik kommer du i gang", href: "#slik-deltar-du" },
        secondary: { label: "Les om opplegget", href: "#faste" },
      },
      leadFact: { value: "Intervalltrening", label: "Meetups med workout" },
      seasonFact: { value: "Vintersesongen", label: "November til mars" },
      moreFacts: [{ value: "Alle nivåer", label: "Vi bruker «Keep together», så alle henger med" }],
      recommendFirst: true,
      externalLinks: [{ kind: "web", label: "Presentasjon: Zwift med BOC, sesongen 2025/26", url: "/presentasjon/zwift-2025-26" }],
    }),
    node({
      id: "b-spinning",
      // Written for the prototype (example): invented riders and parents, never the club's real members.
      quotes: [
        { personId: "bp-bente-haug", quote: "Instruktøren hjelper deg å stille inn sykkelen, så det var lett å komme i gang.", example: true },
        { personId: "bp-demo-trond", quote: "Tirsdag og torsdag i Gjønneshallen holder formen ved like til våren.", example: true },
      ],
      firstTraining: { arrive: "10 minutter før, så hjelper instruktøren deg å stille inn sykkelen.", trial: "Timene er gratis for medlemmer." },
      parentId: "b-innendors",
      kind: "team",
      name: "Spinning",
      slug: "spinning",
      ageLabel: "Fra 15 år",
      ageRange: [15, 99],
      summary: "Tirsdager og torsdager fra oktober til mars. Åpent for alle medlemmer.",
      seasonFact: { value: "Vintersesongen", label: "Oktober til mars" },
      joinInfo: "Timene er gratis for medlemmer. Møt opp 10 minutter før, så hjelper instruktøren deg å stille inn sykkelen.",
      coverPhotoId: "b-ph-spinning",
      venueIds: ["b-gjonneshallen"],
      externalLinks: spond("BOC Spinning i Spond", "UCBIE"),
    }),
  ].map((n) => (LEVELS_BY_GROUP[n.id] ? { ...n, levels: LEVELS_BY_GROUP[n.id] } : n));
}

/**
 * Which levels each group welcomes (see lib/levels.ts). The landevei groups
 * step by speed; groups that ride together whatever the watts (Zwift with
 * «Stay together», spinning, bane with loan bikes) take everyone.
 */
const LEVELS_BY_GROUP: Record<string, LevelId[]> = {
  /* Placed on the three-step scale in lib/levels.ts. The road groups are a
     speed ladder, so they are kept narrow and overlapping by one step —
     that is what lets the finder rank BOC 3 above BOC 2 for someone who has
     ridden a bit. Indoor and track welcome everyone, so they list all three. */
  "b-boc1": ["aktiv"],
  "b-boc2": ["aktiv"],
  "b-boc3": ["litt", "aktiv"],
  "b-boc4": ["ny", "litt"],
  "b-ungdom": ["ny", "litt", "aktiv"],
  "b-junior": ["aktiv"],
  "b-terrengskolen": ["ny"],
  "b-terreng-barn": ["ny", "litt"],
  "b-downhill": ["litt", "aktiv"],
  "b-terreng-tur": ["ny", "litt"],
  "b-terreng-senior": ["aktiv"],
  "b-bmx-rekrutt": ["ny", "litt", "aktiv"],
  "b-bmx-racing": ["ny", "litt", "aktiv"],
  "b-bmx-voksen": ["ny", "litt", "aktiv"],
  "b-banegruppa": ["ny", "litt", "aktiv"],
  "b-spinning": ["ny", "litt", "aktiv"],
  "b-zwift": ["ny", "litt", "aktiv"],
};


/* ── People and users ─────────────────────────────────────────────────── */

/* The site owner's own Strava profile, standing in for the demo riders'
   until real members add theirs (Person.stravaUrl). */
const DEMO_STRAVA = "https://www.strava.com/athletes/2461653";

const person = (p: Omit<Person, "privacy"> & { privacy?: Partial<Person["privacy"]> }): Person => ({
  ...p,
  privacy: { status: "visible", photoConsent: "granted", ...p.privacy },
});

/**
 * Staff and volunteers follow the roles published on the club's own site;
 * riders and guardians are invented for the demo, so no real member's data
 * (least of all a child's) lives in the prototype.
 *
 * One exception: the BMX riders named in the club's own NorgesCup 2026
 * report (b-a-norgescup-bmx), published here in full at the club's say-so.
 * They are real people, so they are ordinary Person records — their names
 * appear only as mentions and can be anonymised like anyone else's. Photo
 * consent is left "unknown": nobody here has recorded it.
 *
 * A second exception: BOC 1's, BOC 2's and BOC 3's riders (October 2026), named by the club. They
 * are «Ikke publiser» with photo consent unknown until an admin decides, the
 * way a Spond import starts.
 */
function people({ d }: SeedCtx): Person[] {
  return [
    person({
      id: "bp-christian",
      firstName: "Christian U.",
      lastName: "Adriaenssens",
      memberships: [{ nodeId: "b-boc", role: "boardChair", title: "Styreleder" }],
      publicContact: { email: "post@baerumock.no", phone: "480 88 568" },
      userId: "bu-christian",
      portraitPhotoId: "b-ph-christian",
    }),
    person({
      id: "bp-silje",
      firstName: "Silje",
      lastName: "Jørgensen",
      memberships: [{ nodeId: "b-boc", role: "generalManager", title: "Nestleder" }],
      publicContact: { email: "post@baerumock.no", phone: "951 78 223" },
    }),
    person({
      id: "bp-erik-haga",
      firstName: "Erik",
      lastName: "Haga",
      memberships: [{ nodeId: "b-boc2", role: "athlete" }, 
        { nodeId: "b-boc", role: "generalManager", title: "Styremedlem" },
        { nodeId: "b-boc3", role: "coach", title: "Road Captain" },
      ],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-henrik-munthe",
      firstName: "Henrik",
      lastName: "Munthe",
      memberships: [{ nodeId: "b-boc", role: "generalManager", title: "Styremedlem" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-william-ring-andersen",
      firstName: "William",
      lastName: "Ring-Andersen",
      memberships: [{ nodeId: "b-boc", role: "generalManager", title: "Styremedlem" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-jorgen-kirkelund",
      firstName: "Jørgen",
      lastName: "Kirkelund",
      memberships: [{ nodeId: "b-boc", role: "generalManager", title: "Styremedlem" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-petter-thoresen",
      firstName: "Petter",
      lastName: "Thoresen",
      memberships: [{ nodeId: "b-boc2", role: "athlete" }, { nodeId: "b-boc", role: "generalManager", title: "Varamedlem" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    /* Kontrollutvalg og valgkomité: tillitsverv, ikke driftskontakter, så de
       får role "volunteer" — samme som andre verv som ikke skal vises i
       kontaktlistene (contactsFor filtrerer på staffRoles). */
    person({
      id: "bp-bjorn-amdal",
      firstName: "Bjørn Kåre",
      lastName: "Amdal",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Kontrollutvalget, leder" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-lisa-axman",
      firstName: "Lisa Christin",
      lastName: "Axman",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Kontrollutvalget" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-jan-nagell",
      firstName: "Jan",
      lastName: "Nagell",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Kontrollutvalget, vara" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-ole-jorgen-kvarsvik",
      firstName: "Ole-Jørgen",
      lastName: "Kvarsvik",
      memberships: [{ nodeId: "b-boc2", role: "athlete" }, { nodeId: "b-boc", role: "volunteer", title: "Valgkomité, leder" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-stein-arne-lie",
      firstName: "Stein Arne",
      lastName: "Lie",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Valgkomité" }],
      publicContact: { email: "post@baerumock.no" },
      portraitPhotoId: "b-ph-stein-arne-lie",
    }),
    person({
      id: "bp-gunhild-berntsen",
      firstName: "Gunhild",
      lastName: "Berntsen",
      memberships: [{ nodeId: "b-boc1", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }, 
        { nodeId: "b-boc", role: "volunteer", title: "Valgkomité" },
        { nodeId: "b-triatlongruppa", role: "headCoach", title: "Gruppeleder" },
      ],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-kurt-tryaire-haugen",
      firstName: "Kurt Tryaire",
      lastName: "Haugen",
      memberships: [{ nodeId: "b-boc", role: "volunteer", title: "Valgkomité, vara" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-eivind",
      firstName: "Eivind",
      lastName: "Lundstrøm",
      memberships: [{ nodeId: "b-terreng", role: "sectionLead", title: "Leder terreng" }],
      publicContact: { email: "terreng@baerumock.no", phone: "992 77 517" },
      userId: "bu-eivind",
    }),
    person({
      id: "bp-thelia",
      firstName: "Thélia",
      lastName: "Haugen",
      memberships: [{ nodeId: "b-bmx", role: "volunteer", title: "Kommunikasjon og sosiale medier" }],
      publicContact: { email: "post@baerumock.no" },
      userId: "bu-thelia",
    }),
    person({
      id: "bp-terje",
      firstName: "Terje",
      lastName: "Stav",
      memberships: [{ nodeId: "b-bmx", role: "sectionLead", title: "Gruppeleder BMX" }],
      publicContact: { email: "post@baerumock.no", phone: "934 33 476" },
    }),
    person({
      id: "bp-synnove",
      firstName: "Synnøve",
      lastName: "Steinbru",
      memberships: [{ nodeId: "b-bmx", role: "teamManager", title: "Nestleder og medlemsansvarlig" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-jakob",
      firstName: "Jakob",
      lastName: "Jølstad",
      memberships: [{ nodeId: "b-zwift", role: "headCoach", title: "Gruppeleder Zwift" }],
      publicContact: { email: "zwift@baerumock.no" },
      userId: "bu-jakob",
      portraitPhotoId: "b-ph-jakob",
    }),
    /* Invented volunteers, coaches and riders */
    person({
      id: "bp-gunhild",
      firstName: "Gunhild",
      lastName: "Berg",
      memberships: [
        { nodeId: "b-ungdom", role: "headCoach" },
        { nodeId: "b-junior", role: "headCoach" },
      ],
      publicContact: { email: "ungdom@baerumock.no", phone: "900 80 676" },
      userId: "bu-gunhild",
    }),
    person({
      id: "bp-siv",
      firstName: "Siv",
      lastName: "Rennemo",
      memberships: [{ nodeId: "b-terreng-barn", role: "headCoach" }],
      publicContact: { phone: "473 90 116" },
    }),
    person({
      id: "bp-anders-h",
      firstName: "Anders",
      lastName: "Holt",
      memberships: [{ nodeId: "b-terrengskolen", role: "headCoach", title: "Ansvarlig Terreng Rekrutt" }],
      publicContact: { email: "terrengskolen@baerumock.no", phone: "920 15 774" },
      userId: "bu-anders-h",
    }),
    person({
      id: "bp-erik-schmidt",
      firstName: "Erik",
      lastName: "Schmidt",
      memberships: [{ nodeId: "b-boc2", role: "athlete" }, { nodeId: "b-boc1", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no", phone: "995 76 457" },
      portraitPhotoId: "b-ph-erik-schmidt",
    }),
    person({
      id: "bp-franco-maggi",
      firstName: "Franco",
      lastName: "Maggi",
      memberships: [{ nodeId: "b-boc2", role: "athlete" }, { nodeId: "b-boc1", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-hans-raavand",
      firstName: "Hans",
      lastName: "Raavand",
      memberships: [{ nodeId: "b-boc2", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-esten-oversjoen",
      firstName: "Esten",
      lastName: "Øversjøen",
      memberships: [{ nodeId: "b-boc2", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no" },
      portraitPhotoId: "b-ph-esten-oversjoen",
    }),
    person({
      id: "bp-reidar-kveine",
      firstName: "Reidar",
      lastName: "Kveine",
      // Leads BOC 3, so he presents it (presenterFor) ahead of the other Road Captains.
      memberships: [{ nodeId: "b-boc3", role: "headCoach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no", phone: "986 94 570" },
      portraitPhotoId: "b-ph-reidar-kveine",
    }),
    person({
      id: "bp-steinar-hillestad",
      firstName: "Steinar",
      lastName: "Hillestad",
      memberships: [{ nodeId: "b-boc3", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-trond-vidar-thomson",
      firstName: "Trond Vidar",
      lastName: "Thomson",
      memberships: [{ nodeId: "b-boc3", role: "athlete" }, { nodeId: "b-boc4", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no", phone: "901 60 606" },
      portraitPhotoId: "b-ph-trond-vidar-thomson",
    }),
    person({
      id: "bp-jorgen-lervik-astrom",
      firstName: "Jørgen Lervik",
      lastName: "Åström",
      memberships: [{ nodeId: "b-boc3", role: "coach", title: "Road Captain, Trondheim–Oslo" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-knut-aanonsen",
      firstName: "Knut",
      lastName: "Aanonsen",
      memberships: [{ nodeId: "b-boc3", role: "coach", title: "Road Captain, Trondheim–Oslo" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-lorenzo-williams",
      firstName: "Lorenzo",
      lastName: "Williams",
      memberships: [{ nodeId: "b-boc3", role: "athlete" }, { nodeId: "b-boc4", role: "coach", title: "Road Captain" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-heidi",
      firstName: "Heidi",
      lastName: "Wold",
      memberships: [{ nodeId: "b-spinning", role: "coach", title: "Instruktør" }],
      publicContact: { phone: "482 60 137" },
    }),
    person({
      id: "bp-wendy",
      firstName: "Wendy",
      lastName: "Scott",
      memberships: [{ nodeId: "b-bmx-rekrutt", role: "coach", title: "Foreldre- og hjelpetrener" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-kim",
      firstName: "Kim",
      lastName: "Reyes",
      memberships: [{ nodeId: "b-bmx-racing", role: "coach", title: "Foreldre- og hjelpetrener" }],
      publicContact: { email: "post@baerumock.no" },
    }),
    person({
      id: "bp-eystein",
      firstName: "Eystein",
      lastName: "Westgaard",
      memberships: [{ nodeId: "b-boc2", role: "athlete" }, { nodeId: "b-banegruppa", role: "coach", title: "Baneansvarlig" }],
      publicContact: { email: "post@baerumock.no", phone: "918 50 044" },
    }),

    /* Riders (invented) */
    person({ id: "bp-oliver", firstName: "Oliver", lastName: "Krogh", birthYear: 2013, memberships: [{ nodeId: "b-terreng-barn", role: "athlete" }], guardianUserIds: ["bu-tone"] }),
    person({
      id: "bp-mathea",
      firstName: "Mathea",
      lastName: "Fjeld",
      birthYear: 2012,
      memberships: [{ nodeId: "b-bmx-racing", role: "athlete" }],
      guardianUserIds: ["bu-rune"],
      privacy: { photoConsent: "unknown" },
    }),
    person({ id: "bp-noah", firstName: "Noah", lastName: "Stang", birthYear: 2016, memberships: [{ nodeId: "b-terrengskolen", role: "athlete" }], guardianUserIds: ["bu-rune"] }),
    person({ id: "bp-selma", firstName: "Selma", lastName: "Aarnes", birthYear: 2011, memberships: [{ nodeId: "b-ungdom", role: "athlete" }], guardianUserIds: ["bu-tone"] }),
    person({ id: "bp-jonas", firstName: "Jonas", lastName: "Five", birthYear: 2009, memberships: [{ nodeId: "b-junior", role: "athlete" }] }),
    // BOC 1's riders, from the club (Jakob, October 2026): «Ikke publiser» and photo consent unknown until an admin has decided.
    person({ id: "bp-christoffer-garseg-mork", firstName: "Christoffer Garseg", lastName: "Mørk", memberships: [{ nodeId: "b-boc1", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-ken-are-bod-ostlid", firstName: "Ken Are Bod", lastName: "Østlid", memberships: [{ nodeId: "b-boc1", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-steinar-kristoffersen", firstName: "Steinar", lastName: "Kristoffersen", memberships: [{ nodeId: "b-boc1", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    /* Adult riders in BOC 1 and BOC 2, invented like every rider here, so the
       groups have a membership to show (MemberGrid on the group page). */
    // BOC 2's riders, from the club (Jakob, October 2026). Real people: «Ikke publiser» and photo consent unknown until an admin has decided, as for a Spond import.
    person({ id: "bp-frode-martinussen", firstName: "Frode", lastName: "Martinussen", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-erik-sandsbraaten", firstName: "Erik", lastName: "Sandsbraaten", memberships: [{ nodeId: "b-boc1", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-oystein-lilleland", firstName: "Øystein", lastName: "Lilleland", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-bjorn-intelhus", firstName: "Bjørn", lastName: "Intelhus", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-trond-aukrust", firstName: "Trond", lastName: "Aukrust", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-olav-skard", firstName: "Olav", lastName: "Skard", memberships: [{ nodeId: "b-boc1", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-morten-jorve", firstName: "Morten", lastName: "Jørve", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-ole-morten-thorsvik", firstName: "Ole Morten", lastName: "Thorsvik", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-tor-habrekke", firstName: "Tor", lastName: "Håbrekke", memberships: [{ nodeId: "b-boc1", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-rune-dalby", firstName: "Rune", lastName: "Dalby", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-kjetil-martinsen", firstName: "Kjetil", lastName: "Martinsen", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-havard-olstorn", firstName: "Håvard", lastName: "Ølstørn", memberships: [{ nodeId: "b-boc1", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-slawomir-lyjak", firstName: "Slawomir", lastName: "Lyjak", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-nils-uchida-zakariassen", firstName: "Nils", lastName: "Uchida Zakariassen", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-malin-johansen", firstName: "Malin", lastName: "Johansen", memberships: [{ nodeId: "b-boc1", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-jon-even-vale", firstName: "Jon Even", lastName: "Vale", memberships: [{ nodeId: "b-boc1", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-fabien-cohadon", firstName: "Fabien", lastName: "Cohadon", memberships: [{ nodeId: "b-boc1", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-stephan-michal-wold-eide", firstName: "Stephan Michal", lastName: "Wold Eide", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-kjetil-landmark", firstName: "Kjetil", lastName: "Landmark", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-eirik-altern", firstName: "Eirik", lastName: "Altern", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-nils-henrik-mathisen", firstName: "Nils-Henrik", lastName: "Mathisen", memberships: [{ nodeId: "b-boc3", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-anders-eikefjord", firstName: "Anders", lastName: "Eikefjord", memberships: [{ nodeId: "b-boc3", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-vegard-olstorn", firstName: "Vegard", lastName: "Ølstørn", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-stig-arne-troa", firstName: "Stig-Arne", lastName: "Trøa", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-thomas-moskeland", firstName: "Thomas", lastName: "Møskeland", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-ola-rorstad-fossum", firstName: "Ola", lastName: "Rørstad Fossum", memberships: [{ nodeId: "b-boc3", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-thor-audun-saga", firstName: "Thor Audun", lastName: "Saga", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-arne-ola-lervag", firstName: "Arne Ola", lastName: "Lervåg", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-viktor-sigurd-wold-eide", firstName: "Viktor Sigurd", lastName: "Wold Eide", memberships: [{ nodeId: "b-boc2", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    // BOC 3's riders, from the club (Jakob, October 2026): «Ikke publiser» and photo consent unknown until an admin has decided.
    person({ id: "bp-hans-ivar-syljuasen", firstName: "Hans Ivar", lastName: "Syljuåsen", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-trond-ericson", firstName: "Trond", lastName: "Ericson", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-oyvind-reitan", firstName: "Øyvind", lastName: "Reitan", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-bent-jerry-orneberg", firstName: "Bent Jerry", lastName: "Ørneberg", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-tom-rune-skogmo", firstName: "Tom Rune", lastName: "Skogmo", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-tony-daniel-bore", firstName: "Tony Daniel", lastName: "Bore", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-gro-anita-thomson", firstName: "Gro Anita", lastName: "Thomson", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-wenche-haukas", firstName: "Wenche", lastName: "Haukås", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-edvard-os", firstName: "Edvard", lastName: "Os", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-christer-rinnan-aafloen", firstName: "Christer Rinnan", lastName: "Aafloen", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-dory-raphael", firstName: "Dory", lastName: "Raphael", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-pal-robertstad", firstName: "Pål", lastName: "Robertstad", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-tom-kystad", firstName: "Tom", lastName: "Kystad", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-kjetil-ek-havnevik", firstName: "Kjetil Ek", lastName: "Havnevik", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-karin-orre", firstName: "Karin", lastName: "Orre", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-justin-wynford-andrew-fackrell", firstName: "Justin Wynford Andrew", lastName: "Fackrell", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-lars-skiebe-taroy", firstName: "Lars Skiebe", lastName: "Tarøy", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-age-rasmussen", firstName: "Åge", lastName: "Rasmussen", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-simen-fjeld", firstName: "Simen", lastName: "Fjeld", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-leif-sorsdal", firstName: "Leif", lastName: "Sørsdal", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-hanna-driesprong", firstName: "Hanna", lastName: "Driesprong", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-pal-hoff", firstName: "Pål", lastName: "Hoff", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-arne-tobias-malkenes-odegaard", firstName: "Arne Tobias Malkenes", lastName: "Ødegaard", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-jamila-nour", firstName: "Jamila", lastName: "Nour", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-elias-raphael", firstName: "Elias", lastName: "Raphael", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-wasim-zayed", firstName: "Wasim", lastName: "Zayed", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-ola-ellefsen", firstName: "Ola", lastName: "Ellefsen", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-erik-emil-almquist", firstName: "Erik Emil", lastName: "Almquist", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-oyvind-huseby", firstName: "Øyvind", lastName: "Huseby", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-richard-mcdowall", firstName: "Richard", lastName: "McDowall", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-christer-tryggestad", firstName: "Christer", lastName: "Tryggestad", memberships: [{ nodeId: "b-boc3", role: "athlete" }], privacy: { status: "restricted", photoConsent: "unknown" } }),
    person({ id: "bp-ida-foss", firstName: "Ida", lastName: "Foss", birthYear: 1995, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-erik-vang", firstName: "Erik", lastName: "Vang", birthYear: 1972, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-hilde-sand", firstName: "Hilde", lastName: "Sand", birthYear: 1981, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-ole-haug", firstName: "Ole", lastName: "Haugland", birthYear: 1965, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-nina-bakke", firstName: "Nina", lastName: "Bakken", birthYear: 1990, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-arne-lund", firstName: "Arne", lastName: "Lundby", birthYear: 1958, memberships: [{ nodeId: "b-boc4", role: "athlete" }] }),
    person({ id: "bp-tone", firstName: "Tone", lastName: "Krogh", memberships: [{ nodeId: "b-terreng-barn", role: "volunteer", title: "Foreldrekontakt" }], publicContact: { phone: "938 76 410" }, userId: "bu-tone" }),
    person({ id: "bp-rune", firstName: "Rune", lastName: "Fjeld", memberships: [], userId: "bu-rune" }),
    /* The riders behind the front page's example quotes (Club.testimonials):
       invented like the rest, with illustrated or stock portraits. */
    person({ id: "bp-demo-sander", firstName: "Sander", lastName: "Wold", birthYear: 2014, memberships: [{ nodeId: "b-bmx-voksen", role: "athlete" }, { nodeId: "b-terreng-barn", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-sander" }),
    person({ id: "bp-demo-silje", firstName: "Silje", lastName: "Nordby", birthYear: 1992, memberships: [{ nodeId: "b-boc1", role: "athlete" }, { nodeId: "b-terreng-senior", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-silje" }),
    person({
      id: "bp-demo-robin",
      firstName: "Robin",
      lastName: "Lunde",
      birthYear: 1990,
      memberships: [
        { nodeId: "b-zwift", role: "athlete" },
        { nodeId: "b-boc1", role: "athlete" },
        { nodeId: "b-banegruppa", role: "athlete" },
      ],
      stravaUrl: DEMO_STRAVA,
      portraitPhotoId: "b-ph-demo-robin",
    }),
    person({ id: "bp-demo-magnus", firstName: "Magnus", lastName: "Berg", birthYear: 2010, memberships: [{ nodeId: "b-downhill", role: "athlete" }, { nodeId: "b-ungdom", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-magnus" }),
    person({ id: "bp-demo-rebekka", firstName: "Rebekka", lastName: "Solvang", birthYear: 2009, memberships: [{ nodeId: "b-junior", role: "athlete" }, { nodeId: "b-boc2", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-rebekka" }),
    person({ id: "bp-demo-trond", firstName: "Trond", lastName: "Sæbø", birthYear: 1968, memberships: [{ nodeId: "b-boc2", role: "athlete" }, { nodeId: "b-boc3", role: "athlete" }, { nodeId: "b-spinning", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-trond" }),
    /* Invented riders and parents behind the group quotes (OrgNode.quotes). */
    person({ id: "bp-filip-aune", firstName: "Filip", lastName: "Aune", birthYear: 2012, memberships: [{ nodeId: "b-ungdom", role: "athlete" }] }),
    person({ id: "bp-ingvild-moe", firstName: "Ingvild", lastName: "Moe", memberships: [] }),
    person({ id: "bp-gunnar-lie", firstName: "Gunnar", lastName: "Lie", birthYear: 1964, memberships: [{ nodeId: "b-terreng-tur", role: "athlete" }] }),
    person({ id: "bp-heidi-ronning", firstName: "Heidi", lastName: "Rønning", birthYear: 1983, memberships: [{ nodeId: "b-terreng-tur", role: "athlete" }] }),
    person({ id: "bp-oyvind-tangen", firstName: "Øyvind", lastName: "Tangen", birthYear: 1986, memberships: [{ nodeId: "b-terreng-senior", role: "athlete" }] }),
    person({ id: "bp-kjetil-aas", firstName: "Kjetil", lastName: "Aas", birthYear: 1980, memberships: [{ nodeId: "b-downhill", role: "athlete" }] }),
    person({ id: "bp-marius-hovde", firstName: "Marius", lastName: "Hovde", memberships: [] }),
    person({ id: "bp-siri-lund", firstName: "Siri", lastName: "Lund", memberships: [] }),
    person({ id: "bp-anette-berg", firstName: "Anette", lastName: "Berg", memberships: [] }),
    person({ id: "bp-hakon-dale", firstName: "Håkon", lastName: "Dale", memberships: [] }),
    person({ id: "bp-thea-kvam", firstName: "Thea", lastName: "Kvam", birthYear: 2011, memberships: [{ nodeId: "b-bmx-voksen", role: "athlete" }] }),
    person({ id: "bp-anders-fjeld", firstName: "Anders", lastName: "Fjeld", birthYear: 1985, memberships: [{ nodeId: "b-banegruppa", role: "athlete" }] }),
    person({ id: "bp-line-kolstad", firstName: "Line", lastName: "Kolstad", birthYear: 1992, memberships: [{ nodeId: "b-banegruppa", role: "athlete" }] }),
    person({ id: "bp-bente-haug", firstName: "Bente", lastName: "Haug", birthYear: 1967, memberships: [{ nodeId: "b-spinning", role: "athlete" }] }),
    person({ id: "bp-rolf-strom", firstName: "Rolf", lastName: "Strøm", birthYear: 1958, memberships: [{ nodeId: "b-spinning", role: "athlete" }] }),
    person({ id: "bp-sigrid-lie", firstName: "Sigrid", lastName: "Lie", birthYear: 1994, memberships: [{ nodeId: "b-zwift", role: "athlete" }] }),
    person({ id: "bp-demo-camilla", firstName: "Camilla", lastName: "Holm", birthYear: 1989, memberships: [{ nodeId: "b-boc4", role: "athlete" }, { nodeId: "b-terreng-tur", role: "athlete" }], stravaUrl: DEMO_STRAVA, portraitPhotoId: "b-ph-demo-camilla" }),
    ...(
      [
        ["bp-jorgen-lillemoen", "Jørgen", "Lillemoen"],
        ["bp-valters-zabelis", "Valters", "Zabelis"],
        ["bp-ludvig-lier-tonne", "Ludvig", "Lier Tønne"],
        ["bp-nikolai-houge-haaland", "Nikolai", "Houge-Haaland"],
        ["bp-elias-haveland", "Elias", "Haveland"],
        ["bp-marcus-haugen", "Marcus", "Haugen"],
        ["bp-ulrik-krydsby", "Ulrik", "Krydsby"],
      ] as const
    ).map(([id, firstName, lastName]) =>
      person({ id, firstName, lastName, memberships: [{ nodeId: "b-bmx", role: "athlete" }], privacy: { photoConsent: "unknown" } }),
    ),
  ].map((p) => ({ ...p, privacy: { ...p.privacy, consentUpdatedAt: p.privacy.photoConsent === "granted" ? d(-260) : undefined } }));
}

const users = (): User[] => [
  {
    id: "bu-christian",
    name: "Christian Adriaenssens",
    email: "post@baerumock.no",
    authProviders: ["google"],
    active: false,
    personId: "bp-christian",
    guardianOfPersonIds: [],
    roles: [{ role: "clubAdmin", nodeId: "b-boc" }],
  },
  {
    id: "bu-eivind",
    name: "Eivind Lundstrøm",
    email: "terreng@baerumock.no",
    authProviders: ["email"],
    active: false,
    personId: "bp-eivind",
    guardianOfPersonIds: [],
    roles: [{ role: "sectionAdmin", nodeId: "b-terreng" }],
  },
  {
    id: "bu-thelia",
    name: "Thélia Haugen",
    email: "bmx@baerumock.no",
    authProviders: ["email"],
    active: false,
    personId: "bp-thelia",
    guardianOfPersonIds: [],
    roles: [{ role: "sectionAdmin", nodeId: "b-bmx" }],
  },
  {
    id: "bu-jakob",
    name: "Jakob Jølstad",
    email: "jakob.jolstad@gmail.com",
    authProviders: ["email"],
    personId: "bp-jakob",
    guardianOfPersonIds: [],
    roles: [{ role: "clubAdmin", nodeId: "b-boc" }],
  },
  {
    id: "bu-gunhild",
    name: "Gunhild Berg",
    email: "ungdom@baerumock.no",
    phone: "900 80 676",
    authProviders: ["email"],
    active: false,
    personId: "bp-gunhild",
    guardianOfPersonIds: [],
    roles: [
      { role: "groupAdmin", nodeId: "b-ungdom" },
      { role: "groupAdmin", nodeId: "b-junior" },
    ],
  },
  {
    id: "bu-anders-h",
    name: "Anders Holt",
    email: "terrengskolen@baerumock.no",
    phone: "920 15 774",
    authProviders: ["email"],
    active: false,
    personId: "bp-anders-h",
    guardianOfPersonIds: [],
    roles: [{ role: "groupAdmin", nodeId: "b-terrengskolen" }],
  },
  {
    id: "bu-tone",
    name: "Tone Krogh",
    email: "tone.krogh@eksempel.no",
    phone: "938 76 410",
    authProviders: ["email"],
    active: false,
    personId: "bp-tone",
    guardianOfPersonIds: ["bp-oliver", "bp-selma"],
    roles: [
      { role: "contributor", nodeId: "b-terreng-barn" },
      { role: "guardian", nodeId: "b-terreng-barn" },
    ],
  },
  {
    id: "bu-rune",
    name: "Rune Fjeld",
    email: "rune.fjeld@eksempel.no",
    phone: "922 30 654",
    authProviders: ["email"],
    active: false,
    personId: "bp-rune",
    guardianOfPersonIds: ["bp-mathea", "bp-noah"],
    roles: [{ role: "guardian", nodeId: "b-bmx-racing" }],
  },
];

/* ── Photographs ──────────────────────────────────────────────────────────
   Development photography from Unsplash, chosen to match what each group
   actually does — BMX on a track, terreng on a trail, bane on a velodrom —
   and shown with the film grade the club uses on its own shots (see
   .photo-film in globals.css). A real club replaces these with its own
   pictures; the riders are then covered by the consent and anonymisation
   flow like any other photo. */

interface PhotoDef {
  id: string;
  ref: string;
  width: number;
  height: number;
  tone: string;
  photographer: string;
  alt: string;
  nodeId: string;
  caption: string;
  focal?: { x: number; y: number };
  tall?: Photo["tall"];
}

const shot = (p: PhotoDef): Photo => ({
  id: p.id,
  src: `https://images.unsplash.com/${p.ref}`,
  width: p.width,
  height: p.height,
  focal: p.focal ?? { x: 50, y: 50 },
  ...(p.tall && { tall: p.tall }),
  tone: p.tone,
  alt: p.alt,
  caption: [text(p.caption)],
  nodeId: p.nodeId,
  grade: "film",
  people: [],
  redactions: [],
  source: { provider: "unsplash", photographer: p.photographer },
});

const photos = (): Photo[] => [
  /* Behind «Bli med» on every group page: the club riding away down a
     forest road, in club kit. */
  {
    id: "b-ph-join",
    src: joinPhoto.src,
    width: joinPhoto.width,
    height: joinPhoto.height,
    focal: { x: 48, y: 58 },
    // On the wide band, closer and from the left edge: the riders land about
    // two thirds across, clear of the text on the left.
    mdFocal: { x: 0, y: 58 },
    mdZoom: 1.35,
    tone: "#5f6b4a",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet bortover en skogsvei, sett bakfra",
    caption: [text("Fellestrening")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* Portraits for the example member quotes on the front page: illustrated
     riders in club kit supplied by the site owner, and one stock photograph
     (Unsplash). Not club members; see Club.testimonials. */
  /* From the club's Mallorca trips (uploaded by Jakob, October 2026). Riders are mostly seen from behind or small in the frame. */
  {
    id: "b-ph-mallorca-road",
    src: mallorcaRoadPhoto.src,
    width: mallorcaRoadPhoto.width,
    height: mallorcaRoadPhoto.height,
    focal: { x: 50, y: 50 },
    tone: "#6e8aa3",
    alt: "Syklister i gule BOC-drakter på en åpen vei ved steinmurer og lyng på Mallorca",
    nodeId: "b-landevei",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-mallorca-forest",
    src: mallorcaForestPhoto.src,
    width: mallorcaForestPhoto.width,
    height: mallorcaForestPhoto.height,
    focal: { x: 50, y: 50 },
    tone: "#4f5a3a",
    alt: "Gruppe syklister sett bakfra på en grusvei gjennom skogen",
    nodeId: "b-landevei",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-mallorca-street",
    src: mallorcaStreetPhoto.src,
    width: mallorcaStreetPhoto.width,
    height: mallorcaStreetPhoto.height,
    focal: { x: 50, y: 55 },
    tone: "#c9a77f",
    alt: "Syklister i gule BOC-drakter i en smal gate mellom gamle hus på Mallorca",
    nodeId: "b-landevei",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-mallorca-side",
    src: mallorcaSidePhoto.src,
    width: mallorcaSidePhoto.width,
    height: mallorcaSidePhoto.height,
    focal: { x: 50, y: 50 },
    tone: "#8aa6c4",
    alt: "Syklister i gule drakter i fart under blå himmel på Mallorca",
    nodeId: "b-landevei",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-mallorca-lane",
    src: mallorcaLanePhoto.src,
    width: mallorcaLanePhoto.width,
    height: mallorcaLanePhoto.height,
    focal: { x: 50, y: 50 },
    tone: "#7c8f6a",
    alt: "Syklister sett bakfra på en solfylt smal vei mellom steinmurer og trær",
    nodeId: "b-landevei",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-mallorca-track",
    src: mallorcaTrackPhoto.src,
    width: mallorcaTrackPhoto.width,
    height: mallorcaTrackPhoto.height,
    focal: { x: 50, y: 50 },
    tone: "#a9946a",
    alt: "Syklister sett bakfra på en grusvei mellom grønne hekker",
    nodeId: "b-landevei",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-demo-sander",
    src: demoSanderPhoto.src,
    width: demoSanderPhoto.width,
    height: demoSanderPhoto.height,
    focal: { x: 50, y: 42 },
    tone: "#6f7f63",
    alt: "Smilende gutt med sykkelhjelm og sort BOC-drakt",
    caption: [text("Eksempelbilde")],
    nodeId: "b-bmx-voksen",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-demo-silje",
    src: demoSiljePhoto.src,
    width: demoSiljePhoto.width,
    height: demoSiljePhoto.height,
    focal: { x: 78, y: 40 },
    cardStyle: "natural",
    tone: "#7f8f5a",
    alt: "Smilende kvinne med hjelm, solbriller og gul BOC-drakt ved et vann",
    caption: [text("Eksempelbilde")],
    nodeId: "b-boc1",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-demo-robin",
    src: demoRobinPhoto.src,
    width: demoRobinPhoto.width,
    height: demoRobinPhoto.height,
    focal: { x: 50, y: 36 },
    tone: "#7f8f5a",
    alt: "Smilende mann med hjelm, solbriller og gul BOC-drakt ved et vann",
    caption: [text("Eksempelbilde")],
    nodeId: "b-zwift",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  shot({
    id: "b-ph-demo-magnus",
    ref: "photo-1624831662357-97d6af9055b2",
    width: 4351,
    height: 6424,
    tone: "#4f5a44",
    photographer: "Nathanaël Desmeules",
    focal: { x: 50, y: 30 },
    alt: "Tenåring med fullface-hjelm skjøvet opp i pannen smiler i skogen",
    nodeId: "b-downhill",
    caption: "Eksempelbilde",
  }),
  {
    id: "b-ph-demo-rebekka",
    src: demoRebekkaPhoto.src,
    width: demoRebekkaPhoto.width,
    height: demoRebekkaPhoto.height,
    focal: { x: 78, y: 38 },
    cardStyle: "natural",
    tone: "#5d6b6e",
    alt: "Ung kvinne med hjelm, solbriller og sort BOC-drakt",
    caption: [text("Eksempelbilde")],
    nodeId: "b-junior",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-demo-trond",
    src: demoTrondPhoto.src,
    width: demoTrondPhoto.width,
    height: demoTrondPhoto.height,
    focal: { x: 50, y: 36 },
    tone: "#5d6b6e",
    alt: "Smilende mann med grått skjegg, hjelm og sort BOC-drakt ved et vann",
    caption: [text("Eksempelbilde")],
    nodeId: "b-boc3",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-demo-camilla",
    src: demoCamillaPhoto.src,
    width: demoCamillaPhoto.width,
    height: demoCamillaPhoto.height,
    focal: { x: 52, y: 38 },
    tone: "#7f8f5a",
    alt: "Smilende kvinne med hjelm og gul BOC-drakt ved et vann",
    caption: [text("Eksempelbilde")],
    nodeId: "b-boc4",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* The club's own photograph of Ulrik Gerner on the podium in the
     NorgesCup, for its report on the result. A tall frame, so the focal
     point holds the BOC rider on the top step in a wide crop. */
  {
    id: "b-ph-ulrik-gerner",
    src: ulrikGernerPhoto.src,
    width: ulrikGernerPhoto.width,
    height: ulrikGernerPhoto.height,
    focal: { x: 32, y: 36 },
    tone: "#6e8fb0",
    alt: "BOC-rytter i sort og gul drakt øverst på pallen i NorgesCupen i utfor, med to andre ryttere på pallen ved siden av",
    caption: [text("Pallen i NorgesCupen i utfor")],
    nodeId: "b-downhill",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* The club's own photograph from NorgesCup 2026, from its news report.
     Nobody in it is tagged: which rider is which is not recorded. */
  {
    id: "b-ph-bmx-norgescup",
    src: bmxNorgescupPhoto.src,
    width: bmxNorgescupPhoto.width,
    height: bmxNorgescupPhoto.height,
    focal: { x: 50, y: 52 },
    tone: "#6f7a5c",
    alt: "Seks BMX-ryttere i gule BOC-drakter står ved syklene sine med pokaler og diplomer foran BOC BMX-teltet",
    caption: [text("BOC BMX etter sesongavslutningen i NorgesCupen på Sviland")],
    nodeId: "b-bmx",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* The club's own photograph from Styrkeprøven, served from the
     project. It already carries its grade, so it gets no film treatment. */
  /* The club's own photograph from Styrkeprøven: the front page's hero. Its
     narrow cut is also the road groups' cover (b-ph-landevei-hero below) —
     the wide one puts the riders too far to the side in a cover's crop. */
  {
    id: "b-ph-hero",
    src: styrkeprovenHero.src,
    width: styrkeprovenHero.width,
    height: styrkeprovenHero.height,
    focal: { x: 40, y: 58 },
    tone: "#728171",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet på en fjellvei under Styrkeprøven",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  {
    id: "b-ph-hero-narrow",
    src: styrkeprovenNarrow.src,
    width: styrkeprovenNarrow.width,
    height: styrkeprovenNarrow.height,
    focal: { x: 50, y: 58 },
    tone: "#728171",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet på en fjellvei under Styrkeprøven",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* A taller portrait cut of the same Styrkeprøven photograph, shot for the
     front page's mobile hero: the group sits in the upper third with a long
     stretch of empty road below them, room enough for the statement to sit
     on the photograph itself instead of on a band beneath it. */
  {
    id: "b-ph-hero-mobile",
    src: heroMobilePhoto.src,
    width: heroMobilePhoto.width,
    height: heroMobilePhoto.height,
    focal: { x: 50, y: 20 },
    tone: "#728171",
    alt: "BOC-ryttere i gul klubbdrakt sykler i kolonne på en fjellvei, med mye vei i forgrunnen",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* The hero's two cuts at dusk, with the riders' lights on, for the
     visitor's dark mode (see the front page's hero). Same framing as the
     daylight cuts, so the statement sits in the same place on both. */
  {
    id: "b-ph-hero-dark",
    src: heroWideDarkPhoto.src,
    width: heroWideDarkPhoto.width,
    height: heroWideDarkPhoto.height,
    focal: { x: 40, y: 58 },
    tone: "#1c2533",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet på en fjellvei i skumringen, med lys på syklene",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-hero-mobile-dark",
    src: heroMobileDarkPhoto.src,
    width: heroMobileDarkPhoto.width,
    height: heroMobileDarkPhoto.height,
    focal: { x: 50, y: 20 },
    tone: "#1c2533",
    alt: "BOC-ryttere i gul klubbdrakt sykler i kolonne på en fjellvei i skumringen, med lys på syklene",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* The same narrow cut as the cover of Landevei: closer,
     and with the frame lowered so the riders sit above the «Neste aktivitet»
     card that covers the lower left of a branch hero. */
  {
    id: "b-ph-landevei-hero",
    src: styrkeprovenNarrow.src,
    width: styrkeprovenNarrow.width,
    height: styrkeprovenNarrow.height,
    focal: { x: 35, y: 100 },
    zoom: 1.3,
    tone: "#728171",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet på en fjellvei under Styrkeprøven",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* BOC 1 takes the same cut a little further right: its cover is mostly
     seen as a tall card (the carousel), where the Landevei crop cuts the
     riders off at the right edge. */
  {
    id: "b-ph-boc-fast-hero",
    src: styrkeprovenNarrow.src,
    width: styrkeprovenNarrow.width,
    height: styrkeprovenNarrow.height,
    focal: { x: 55, y: 100 },
    zoom: 1.3,
    tall: { focal: { x: 50, y: 100 }, zoom: 1.45 },
    tone: "#728171",
    alt: "BOC-ryttere i gul klubbdrakt sykler samlet på en fjellvei under Styrkeprøven",
    caption: [text("BOC under Styrkeprøven")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  /* Group photos for BOC 2–4, the riders standing in a row: the focal
     point is the middle of the row, so a tall card keeps the faces. On the
     tall cards (Photo.tall) they are lifted clear of the card text. */
  {
    id: "b-ph-boc2",
    src: boc2Photo.src,
    width: boc2Photo.width,
    height: boc2Photo.height,
    focal: { x: 50, y: 45 },
    tall: { focal: { x: 50, y: 100 }, zoom: 1.15 },
    tone: "#7f8c5c",
    alt: "Rundt tjue ryttere i gul BOC-drakt stiller opp på plenen foran et murbygg",
    caption: [text("BOC 2 samlet")],
    nodeId: "b-boc2",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-boc3",
    src: boc3Photo.src,
    width: boc3Photo.width,
    height: boc3Photo.height,
    focal: { x: 50, y: 58 },
    tall: { focal: { x: 50, y: 100 }, zoom: 1.3 },
    tone: "#8b9096",
    alt: "Ryttere i gul BOC-drakt smiler til kamera med brusflasker i hendene, på en parkeringsplass under blå himmel",
    caption: [text("BOC 3 samlet")],
    nodeId: "b-boc3",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-boc4",
    src: boc4Photo.src,
    width: boc4Photo.width,
    height: boc4Photo.height,
    focal: { x: 50, y: 55 },
    tall: { focal: { x: 50, y: 100 }, zoom: 1.2 },
    tone: "#6f7c5f",
    alt: "Ryttere i gul BOC-drakt og andre klubbdrakter på gresset ved en bensinstasjon, med åser og blå himmel bak",
    caption: [text("BOC 4 samlet")],
    nodeId: "b-boc4",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  /* The meeting point for BOC 1–4 on weekdays, shown on its venue card in
     «Når og hvor». The riders are club members at a normal start. */
  {
    id: "b-ph-bekkestua",
    src: bekkestuaPhoto.src,
    width: bekkestuaPhoto.width,
    height: bekkestuaPhoto.height,
    focal: { x: 62, y: 52 },
    tone: "#9aa0a4",
    alt: "Ryttere i gul BOC-drakt står med syklene på Bekkestua torg før trening, med en kafébygning bak",
    caption: [text("Oppmøte på Bekkestua torg")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  /* The Sunday meeting point for BOC 1–4, shown on its venue card in «Når og
     hvor». Converted from the PNG supplied (3 MB) to a JPEG for the page. */
  {
    id: "b-ph-kaffebrenneriet",
    src: kaffebrenneriet.src,
    width: kaffebrenneriet.width,
    height: kaffebrenneriet.height,
    focal: { x: 50, y: 62 },
    tone: "#a8a28a",
    alt: "Rundt tretti ryttere i gul BOC-drakt samles med syklene foran Kaffebrenneriet i Sandvika en solrik søndag",
    caption: [text("Oppmøte ved Kaffebrenneriet")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  /* The club's own pictures for BMX Gruppe 1 and 2 and for Junior. They show
     children and young riders, so they are not tagged to anyone in the
     register here; tag them in admin if one of them should be hidden should
     they ever be anonymised. */
  {
    id: "b-ph-bmx-gruppe1",
    src: bmxGruppe1Photo.src,
    width: bmxGruppe1Photo.width,
    height: bmxGruppe1Photo.height,
    focal: { x: 45, y: 52 },
    tone: "#6f7f4a",
    alt: "Tre barn på BMX-sykler hopper over bølgene på banen ved Bærum Sykkelpark i kveldssol",
    caption: [text("BMX Gruppe 1 på banen")],
    nodeId: "b-bmx-rekrutt",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-bmx-start",
    src: bmxStartPhoto.src,
    width: bmxStartPhoto.width,
    height: bmxStartPhoto.height,
    focal: { x: 50, y: 55 },
    tone: "#7a8a70",
    alt: "Mange barn i gul BOC-drakt og hjelm står klare på startstreken til et BMX-ritt, med foresatte og telt bak",
    caption: [text("Klare for start")],
    nodeId: "b-bmx-racing",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-junior",
    src: juniorPhoto.src,
    width: juniorPhoto.width,
    height: juniorPhoto.height,
    focal: { x: 50, y: 40 },
    tone: "#5f6a3a",
    alt: "Tre unge ryttere i gul BOC-drakt smiler og drikker saft under BOC-teltet etter et ritt",
    caption: [text("Juniorene etter ritt")],
    nodeId: "b-junior",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* The spinning room in Gjønneshallen, replacing the stock photo that stood
     here: same id, so every page that showed it now shows the club's own. */
  {
    id: "b-ph-spinning",
    src: spinningPhoto.src,
    width: spinningPhoto.width,
    height: spinningPhoto.height,
    focal: { x: 48, y: 48 },
    tone: "#c9c6bd",
    alt: "Rundt ti ryttere, de fleste i gul BOC-drakt, sykler på spinningsykler i salen i Gjønneshallen",
    caption: [text("Spinning")],
    nodeId: "b-innendors",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  {
    id: "b-ph-terreng",
    src: terrengPhoto.src,
    width: terrengPhoto.width,
    height: terrengPhoto.height,
    focal: { x: 55, y: 40 },
    tone: "#6c6353",
    alt: "Terrengsyklist i gul BOC-drakt i utforløype i skogen, med publikum bak spenningsbåndet",
    caption: [text("Utfor i terreng")],
    nodeId: "b-terreng",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  /* Landevei */
  shot({
    id: "b-ph-landevei-group",
    ref: "photo-1600403477955-2b8c2cfab221",
    width: 3936,
    height: 2624,
    tone: "#9aa39a",
    photographer: "Martin Magnemyr",
    focal: { x: 50, y: 62 },
    alt: "Gruppe syklister på smal vei gjennom skogen",
    nodeId: "b-landevei",
    caption: "Fellestrening i fartsgrupper",
  }),
  shot({
    id: "b-ph-landevei-corner",
    ref: "photo-1605050825077-289f85b6cf43",
    width: 3949,
    height: 2633,
    tone: "#b8bcc8",
    photographer: "Munbaik Cycling Clothing",
    focal: { x: 50, y: 58 },
    tall: { focal: { x: 42, y: 100 }, zoom: 1.13 },
    alt: "Tre syklister i sving på landevei",
    nodeId: "b-landevei",
    caption: "Rittfart på klubbtur",
  }),
  shot({
    id: "b-ph-landevei-coast",
    ref: "photo-1541625602330-2277a4c46182",
    width: 6000,
    height: 4000,
    tone: "#d9d9d9",
    photographer: "Coen van de Broek",
    focal: { x: 45, y: 55 },
    alt: "To syklister på vei langs sjøen",
    nodeId: "b-boc3",
    caption: "Søndagstur med kaffestopp",
  }),
  shot({
    id: "b-ph-landevei-pair",
    ref: "photo-1681295692638-97ace05f56b4",
    width: 5367,
    height: 3578,
    tone: "#cfd3cf",
    photographer: "Tuvalum",
    tall: { focal: { x: 37, y: 100 }, zoom: 1.18 },
    alt: "To syklister på vei med åser i bakgrunnen",
    nodeId: "b-ungdom",
    caption: "Langtur på fredag",
  }),

  /* Terreng */
  shot({
    id: "b-ph-terreng-berm",
    ref: "photo-1562861894-0918c74b6448",
    width: 5000,
    height: 2825,
    tone: "#555356",
    photographer: "Axel Brunst",
    focal: { x: 45, y: 55 },
    alt: "Terrengsyklist i doserte sving på skogssti",
    nodeId: "b-terreng",
    caption: "Stier i Vestmarka",
  }),
  shot({
    id: "b-ph-downhill",
    ref: "photo-1594942939850-d8da299577f3",
    width: 4000,
    height: 5000,
    tone: "#bab0a4",
    photographer: "Tim Foster",
    focal: { x: 50, y: 45 },
    alt: "Terrengsyklist på bratt, rotete sti",
    nodeId: "b-downhill",
    caption: "Utforsesongen i Drammen",
  }),
  shot({
    id: "b-ph-terreng-ungdom",
    ref: "photo-1566728060299-ad216d6fa3c1",
    width: 3840,
    height: 5760,
    tone: "#2d2d2d",
    photographer: "Markus Spiske",
    focal: { x: 50, y: 42 },
    alt: "Ung terrengsyklist med startnummer i skogen",
    nodeId: "b-terreng-barn",
    caption: "Karusellritt for ungdom",
  }),
  shot({
    id: "b-ph-terrengskolen",
    ref: "photo-1595010310173-5c30b556d052",
    width: 4000,
    height: 5000,
    tone: "#373117",
    photographer: "Kelly Sikkema",
    focal: { x: 50, y: 45 },
    alt: "Barn på terrengsykkel på grussti",
    nodeId: "b-terrengskolen",
    caption: "Terreng Rekrutt på Eineåsen",
  }),

  /* The club's BMX photograph is shared by the discipline, groups and BMX
     stories so every BMX surface uses the supplied club imagery. */
  /* The club kits from Kalas, race and leisure. The source is a small
     screenshot with image-search marks along its foot, so the front page
     shows it cropped to the headings and jerseys (focal at the top). */
  {
    id: "b-ph-kits",
    src: kitsPhoto.src,
    width: kitsPhoto.width,
    height: kitsPhoto.height,
    focal: { x: 50, y: 0 },
    tone: "#1d2213",
    alt: "BOCs klubbdrakter fra Kalas: race-design i gult og fritidsdesign i svart",
    caption: [text("Klubbdraktene fra Kalas")],
    nodeId: "b-boc",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* Children in club kit on the BMX track: the top of /barn-og-ungdom.
     bmx-barn.jpg is the club's bmx-barn.avif unedited, only saved as JPEG:
     the AVIF's static import came through with the wrong dimensions and
     stretched the picture. */
  {
    id: "b-ph-bmx-barn",
    src: bmxYouthPhoto.src,
    width: bmxYouthPhoto.width,
    height: bmxYouthPhoto.height,
    focal: { x: 50, y: 70 },
    tone: "#7d8a86",
    alt: "Barn i BOC-drakt sykler i en sving på BMX-banen mens publikum ser på",
    caption: [text("BMX-løp for barn i Bærum Sykkelpark")],
    nodeId: "b-bmx",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-bmx-air",
    src: bmxPhoto.src,
    width: bmxPhoto.width,
    height: bmxPhoto.height,
    focal: { x: 52, y: 48 },
    tone: "#79969a",
    alt: "BOC-ryttere i gul klubbdrakt under BMX-løp",
    caption: [text("BMX-løp med BOC")],
    nodeId: "b-bmx",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-bmx-berm",
    src: bmxPhoto.src,
    width: bmxPhoto.width,
    height: bmxPhoto.height,
    focal: { x: 52, y: 48 },
    tone: "#79969a",
    alt: "BOC-ryttere i gul klubbdrakt under BMX-løp",
    caption: [text("BMX-løp med BOC")],
    nodeId: "b-bmx-rekrutt",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },

  /* The club's own velodrome and Zwift illustrations. */
  {
    id: "b-ph-bane",
    src: velodromPhoto.src,
    width: velodromPhoto.width,
    height: velodromPhoto.height,
    focal: { x: 53, y: 58 },
    tone: "#8ca2ae",
    alt: "BOC-ryttere med banesykler samlet til instruksjon inne i Velodromen",
    caption: [text("BOC Meetup i Velodromen")],
    nodeId: "b-bane",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-zwift",
    src: zwiftPhoto.src,
    width: zwiftPhoto.width,
    height: zwiftPhoto.height,
    // The rider sits left of centre and the screen on the right; crops keep the rider.
    focal: { x: 32, y: 50 },
    tone: "#1d1a16",
    alt: "Rytter i BOC-drakt på sykkelrulle i et mørkt rom, med en TV som viser Zwift på veggen",
    caption: [text("Zwift hjemme i stua")],
    nodeId: "b-zwift",
    people: [],
    redactions: [],
    source: { provider: "upload" },
  },
  /* Jakob's own portrait: the Zwift group's real gruppeleder, uploaded
     directly rather than drawn from Unsplash like the invented volunteers. */
  {
    id: "b-ph-jakob",
    src: jakobPhoto.src,
    width: jakobPhoto.width,
    height: jakobPhoto.height,
    focal: { x: 50, y: 45 },
    cardStyle: "studio",
    tone: "#ffffff",
    alt: "Portrett av gruppelederen for Zwift-gruppa: mann i gul BOC-drakt, hjelm og briller mot hvit bakgrunn",
    nodeId: "b-zwift",
    people: [{ personId: "bp-jakob", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  /* Road Captains' own portraits, and ones from the board and the
     valgkomité, uploaded by the club like Jakob's. */
  {
    id: "b-ph-erik-schmidt",
    src: erikSchmidtPhoto.src,
    width: erikSchmidtPhoto.width,
    height: erikSchmidtPhoto.height,
    focal: { x: 50, y: 38 },
    tone: "#b9ab93",
    alt: "Portrett av Road Captain i BOC 1",
    nodeId: "b-boc1",
    people: [{ personId: "bp-erik-schmidt", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-reidar-kveine",
    src: reidarKveinePhoto.src,
    width: reidarKveinePhoto.width,
    height: reidarKveinePhoto.height,
    focal: { x: 53, y: 35 },
    tone: "#8c8a52",
    alt: "Portrett av Road Captain i BOC 3",
    nodeId: "b-boc3",
    people: [{ personId: "bp-reidar-kveine", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-trond-vidar-thomson",
    src: trondVidarThomsonPhoto.src,
    width: trondVidarThomsonPhoto.width,
    height: trondVidarThomsonPhoto.height,
    focal: { x: 50, y: 38 },
    tone: "#a8a39a",
    alt: "Portrett av Road Captain i BOC 4",
    nodeId: "b-boc4",
    people: [{ personId: "bp-trond-vidar-thomson", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-esten-oversjoen",
    src: estenOversjoenPhoto.src,
    width: estenOversjoenPhoto.width,
    height: estenOversjoenPhoto.height,
    focal: { x: 55, y: 30 },
    tone: "#7d97a8",
    alt: "Portrett av Road Captain i BOC 2",
    nodeId: "b-boc2",
    people: [{ personId: "bp-esten-oversjoen", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-christian",
    src: christianPhoto.src,
    width: christianPhoto.width,
    height: christianPhoto.height,
    focal: { x: 50, y: 40 },
    tone: "#b9b3a6",
    alt: "Portrett av styrelederen",
    nodeId: "b-boc",
    people: [{ personId: "bp-christian", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  {
    id: "b-ph-stein-arne-lie",
    src: steinArneLiePhoto.src,
    width: steinArneLiePhoto.width,
    height: steinArneLiePhoto.height,
    focal: { x: 55, y: 38 },
    tone: "#8f9a5a",
    alt: "Portrett av et medlem av valgkomiteen",
    nodeId: "b-boc",
    people: [{ personId: "bp-stein-arne-lie", region: null }],
    redactions: [],
    source: { provider: "upload" },
  },
  /* Bane og innendørs */
];

/* ── Training and activities ──────────────────────────────────────────── */

function series({ d, on }: SeedCtx): TrainingSeries[] {
  const from = d(-35);
  const to = d(90);
  const s = (x: Omit<TrainingSeries, "from" | "to"> & Partial<Pick<TrainingSeries, "from" | "to">>): TrainingSeries => ({ from, to, ...x });

  return [
    /* Landevei */
    /* BOC 1–4: Tuesday and Thursday at 18.00 from Bekkestua torg
       (årsberetningen 2025), and the Sunday long ride at 10.00 from
       Kaffebrenneriet in Sandvika, where
       everyone meets and each group rides its own. Every week from April to
       October except July, the club's fellesferie — so each session is
       two series, April–June and August–October, and the week view, the
       club year and the group page all leave July empty. */
    ...["b-boc1", "b-boc2", "b-boc3", "b-boc4"].flatMap((nodeId) =>
      [
        { key: "tir", weekday: 2, title: "Fellestrening", start: "18:00", end: "20:00", venueId: "b-bekkestua" },
        { key: "tor", weekday: 4, title: "Fellestrening", start: "18:00", end: "20:00", venueId: "b-bekkestua" },
        { key: "son", weekday: 7, title: "Langtur", start: "10:00", end: "13:00", venueId: "b-kaffebrenneriet" },
      ].flatMap((slot) =>
        [
          { part: "var", from: on(4, 1), to: on(6, 30) },
          { part: "host", from: on(8, 1), to: on(10, 31) },
        ].map((period) =>
          s({
            id: `bs-${nodeId.slice(2)}-${slot.key}-${period.part}`,
            nodeId,
            title: slot.title,
            weekday: slot.weekday,
            start: slot.start,
            end: slot.end,
            venueId: slot.venueId,
            from: period.from,
            to: period.to,
            seasonal: true,
            clubYearGroupId: "b-landevei",
            clubYearLabel: "Landevei",
          }),
        ),
      ),
    ),
    s({
      id: "bs-ungdom-tir",
      nodeId: "b-ungdom",
      title: "Intervaller og teknikk",
      weekday: 2,
      start: "18:00",
      end: "19:30",
      venueId: "b-idrettspark",
      note: "Sammen med BSV Triatlon",
    }),
    s({ id: "bs-ungdom-fre", nodeId: "b-ungdom", title: "Langtur", weekday: 5, start: "18:00", end: "20:00", venueId: "b-idrettspark" }),
    s({ id: "bs-junior-tir", nodeId: "b-junior", title: "Intervaller", weekday: 2, start: "18:00", end: "19:30", venueId: "b-idrettspark" }),

    /* Terreng */
    s({
      id: "bs-terrengskolen",
      nodeId: "b-terrengskolen",
      title: "Terreng Rekrutt",
      weekday: 1,
      start: "18:00",
      end: "19:30",
      venueId: "b-eineasen",
      from: on(4, 7),
      to: on(10, 9),
      seasonal: true,
      clubYearGroupId: "b-terreng",
      clubYearLabel: "Terreng",
    }),
    /* Terreng 10+ rides on Mondays and Thursdays, 18.00–19.30: more technique on Mondays, more of a tour on trails on
       Thursdays (the group's own pages, October 2026). The season is from after Easter to the school's summer break,
       and from the start of school to the autumn break; the summer break is a break on the group, not a series. */
    s({ id: "bs-terreng-barn-man", nodeId: "b-terreng-barn", title: "Terrengtrening", weekday: 1, start: "18:00", end: "19:30", venueId: "b-eineasen", from: on(4, 7), to: on(10, 9), seasonal: true, clubYearGroupId: "b-terreng", clubYearLabel: "Terreng" }),
    s({ id: "bs-terreng-barn", nodeId: "b-terreng-barn", title: "Terrengtrening", weekday: 4, start: "18:00", end: "19:30", venueId: "b-vestmarka", from: on(4, 7), to: on(10, 9), seasonal: true, clubYearGroupId: "b-terreng", clubYearLabel: "Terreng" }),
    s({ id: "bs-terreng-senior", nodeId: "b-terreng-senior", title: "Stitrening", weekday: 3, start: "18:00", end: "20:00", venueId: "b-kolsas", from: on(3, 1), to: on(11, 30), seasonal: true, clubYearGroupId: "b-terreng", clubYearLabel: "Terreng" }),
    s({ id: "bs-terreng-tur", nodeId: "b-terreng-tur", title: "Turtempo på sti", weekday: 4, start: "18:00", end: "20:00", venueId: "b-vestmarka", from: on(3, 1), to: on(11, 30), seasonal: true, clubYearGroupId: "b-terreng", clubYearLabel: "Terreng" }),

    /* BMX — aldersgrupper med samme tider tirsdag og torsdag */
    ...[
      { id: "gr1", nodeId: "b-bmx-rekrutt", title: "BMX Gruppe 1", start: "18:00", end: "19:00" },
      { id: "gr2", nodeId: "b-bmx-racing", title: "BMX Gruppe 2", start: "18:00", end: "19:15" },
      { id: "gr3", nodeId: "b-bmx-voksen", title: "BMX Gruppe 3", start: "19:00", end: "20:30" },
    ].flatMap((group) =>
      [2, 4].map((weekday) =>
        s({
          id: `bs-bmx-${group.id}-${weekday}`,
          nodeId: group.nodeId,
          title: group.title,
          weekday,
          start: group.start,
          end: group.end,
          venueId: "b-sykkelpark",
          from: on(4, 1),
          to: on(11, 30),
          seasonal: true,
          clubYearGroupId: "b-bmx",
          clubYearLabel: "BMX",
        }),
      ),
    ),

    /* Banesykling og innendørs */
    s({ id: "bs-bane", nodeId: "b-banegruppa", title: "Banetrening", weekday: 1, start: "18:30", end: "20:30", venueId: "b-velodromen", from: on(1, 1), to: on(12, 31, 1), seasonal: true, clubYearGroupId: "b-bane", clubYearLabel: "Banesykling" }),
    s({ id: "bs-spinning-tir", nodeId: "b-spinning", title: "Spinning", weekday: 2, start: "19:00", end: "20:00", venueId: "b-gjonneshallen", from: on(10, 1), to: on(3, 31, 1), seasonal: true, clubYearGroupId: "b-spinning", clubYearLabel: "Spinning" }),
    s({ id: "bs-spinning-tor", nodeId: "b-spinning", title: "Spinning", weekday: 4, start: "19:00", end: "20:00", venueId: "b-gjonneshallen", from: on(10, 1), to: on(3, 31, 1), seasonal: true, clubYearGroupId: "b-spinning", clubYearLabel: "Spinning" }),
    ...[1, 3].map((weekday) =>
      s({
        id: `bs-zwift-${weekday}`,
        nodeId: "b-zwift",
        title: "Zwift: felles intervalløkt",
        weekday,
        start: "19:00",
        end: "20:00",
        locationNote: "Meetup på Zwift",
        note: "«Stay together» er på, så alle holder følge",
        from: on(11, 1),
        to: on(3, 31, 1),
        seasonal: true,
        clubYearGroupId: "b-zwift",
        clubYearLabel: "Zwift",
      }),
    ),
  ];
}

function activities({ d, next, on }: SeedCtx): Activity[] {
  const spond = { kind: "spond" as const, label: "Svar i Spond", url: "https://spond.com" };
  return [
    {
      id: "b-act-km",
      nodeId: "b-sykkel",
      kind: "race",
      title: "Klubbmesterskap tempo",
      date: next(7),
      start: "11:00",
      end: "14:00",
      venueId: "b-idrettspark",
      description: "12 km tempo med start fra idrettsparken. Klasser fra 11 år, påmelding på stedet fra kl. 10.00.",
      status: "scheduled",
    },
    {
      id: "b-act-regionscup",
      nodeId: "b-bmx",
      kind: "race",
      title: "RegionsCup Øst #5 i Bærum Sykkelpark",
      date: d(5),
      start: "10:00",
      end: "16:00",
      venueId: "b-sykkelpark",
      description: "Klubben arrangerer på hjemmebane. Kiosk, speaker og klubbtelt – og dugnadsvakter hele uken før.",
      status: "scheduled",
      signup: spond,
    },
    {
      id: "b-act-karusell",
      nodeId: "b-terreng-senior",
      kind: "race",
      title: "Terrengkarusell, 4. runde",
      date: d(3),
      start: "18:00",
      end: "20:00",
      venueId: "b-vestmarka",
      status: "scheduled",
      signup: spond,
    },
    {
      id: "b-act-foreldremote",
      nodeId: "b-bmx",
      kind: "event",
      title: "Foreldremøte BMX",
      date: d(9),
      start: "18:30",
      end: "19:30",
      venueId: "b-sykkelpark",
      description: "Gjennomgang av høstens løp, dugnad og gruppeinndeling. Alle foresatte er velkomne.",
      status: "scheduled",
    },
    {
      id: "b-act-dugnad",
      nodeId: "b-boc",
      kind: "volunteer",
      title: "Banedugnad i Bærum Sykkelpark",
      date: d(12),
      start: "17:00",
      end: "20:00",
      venueId: "b-sykkelpark",
      description: "Vi rydder, raker og gjør banen klar før løpet. Klubben spanderer pizza.",
      status: "scheduled",
    },
    {
      id: "b-act-temakveld",
      nodeId: "b-boc",
      kind: "event",
      title: "Temakveld: vintervedlikehold av sykkel",
      date: d(21),
      start: "19:00",
      end: "20:30",
      venueId: "b-idrettspark",
      description: "Anton Sport viser vask, kjede og lagring gjennom vinteren. Åpent for alle medlemmer.",
      status: "scheduled",
    },

    /* The season as a whole */
    ...[
      { id: "b-act-mallorca-host", title: "Treningstur til Mallorca, høst", date: on(10, 10), endDate: on(10, 17) },
      { id: "b-act-mallorca-var", title: "Treningstur til Mallorca, vår", date: on(3, 13, 1), endDate: on(3, 20, 1) },
    ].map(
      (trip): Activity => ({
        ...trip,
        nodeId: "b-landevei",
        kind: "camp",
        start: "08:00",
        locationNote: "Mallorca",
        locationDetail: "Hotel St Jordi, Platja de Palma",
        page: { href: "/mallorca", label: "Mer om Mallorca-turene" },
        description: "En uke med fellesturer i grupper på flere nivåer. Klubben har avtale med Hotel St Jordi på Platja de Palma, med rabatterte priser, og det er ofte opp mot 50 deltakere.",
        status: "scheduled",
      }),
    ),
    {
      id: "b-act-genus-open",
      nodeId: "b-boc",
      kind: "race",
      title: "GENUS OPEN by BOC",
      date: on(8, 19),
      start: "17:30",
      end: "21:00",
      locationNote: "Bogstad – Sørkedalen – Tryvann",
      description: "Klubbens eget ritt sammen med hovedsamarbeidspartneren, fra Bogstad opp til toppen av slalåmbakken.",
      page: { href: "/sykkelritt/genus-open", label: "Mer om Genus Open" },
      status: "scheduled",
    },
    {
      id: "b-act-nm-utfor",
      nodeId: "b-downhill",
      kind: "race",
      title: "NM utfor",
      date: on(8, 9),
      endDate: on(8, 10),
      start: "09:00",
      locationNote: "Drammen skisenter",
      description: "To dager i den tekniske NM-løypa, med klubbens ryttere i flere klasser.",
      status: "scheduled",
    },
    {
      id: "b-act-sesongavslutning",
      nodeId: "b-terreng",
      kind: "event",
      title: "Sesongavslutning terreng",
      date: d(26),
      start: "17:00",
      end: "20:00",
      venueId: "b-eineasen",
      description: "Kort treningsøkt, konkurranse i balanse og moro på terrengsløyfa, før grilling og kake.",
      status: "scheduled",
    },
  ];
}

/* ── Races ────────────────────────────────────────────────────────────────
   The races members ride together, most of them in the turritt or master
   classes. Dates are the organisers' own for the latest edition published
   (checked September 2026 in EQ Timing and on the race sites); the club year
   projects next season's edition from them. Genus Open is the club's own
   race and follows the seeded season like the rest of the club's dates. */

/* The rides each road group trains towards and enters together, from the
   groups' plans for 2026 in årsberetningen 2025. */
const BOC_1_TO_3 = ["b-boc1", "b-boc2", "b-boc3"];

function races({ on }: SeedCtx): Race[] {
  const road = (r: Omit<Race, "nodeId">): Race => ({ nodeId: "b-landevei", ...r });
  const mtb = (r: Omit<Race, "nodeId">): Race => ({ nodeId: "b-terreng", ...r });
  return [
    road({ id: "r-enebakk", name: "Enebakk Rundt", date: "2026-05-01", place: "Skullerud – Enebakk", organiser: "IK Hero", groupIds: BOC_1_TO_3 }),
    road({ id: "r-follo", name: "Follorittet", date: "2026-05-10", place: "Ås", organiser: "Follo Sykkelklubb" }),
    road({ id: "r-ceres", name: "Ceresrittet", date: "2026-05-10", place: "Romerike", organiser: "SK Ceres" }),
    road({ id: "r-nordmarka", name: "Nordmarka Rundt", date: "2026-05-24", place: "Årvoll skole, Oslo" }),
    road({ id: "r-randsfjorden", name: "Randsfjorden Rundt", date: "2026-05-30", place: "Brandbu", groupIds: BOC_1_TO_3 }),
    road({ id: "r-tyrifjorden", name: "Tyrifjorden Rundt", date: "2026-06-07", place: "Sandvika – rundt Tyrifjorden", organiser: "Bærum og Omegn Cykleklubb", ownEvent: true, groupIds: ["b-boc3", "b-boc4"] }),
    road({
      id: "r-vattern",
      name: "Vätternrunden",
      date: "2026-06-13",
      place: "Motala, rundt Vättern",
      url: "https://www.vatternrundan.se",
      groupIds: ["b-boc1", "b-boc2"],
    }),
    /* Styrkeprøven is several distances in one weekend; the groups ride
       different ones. Both start on the Saturday around 20 June: in 2027,
       Saturday 19 June (the organiser's weekend is 18–20 June). */
    road({
      id: "r-styrkeproven-to",
      name: "Styrkeprøven Trondheim–Oslo",
      date: "2027-06-19",
      place: "Trondheim – Oslo",
      organiser: "Bærum og Omegn Cykleklubb",
      ownEvent: true,
      url: "https://styrkeproven.no",
      groupIds: ["b-boc3"],
    }),
    road({
      id: "r-styrkeproven-lo",
      name: "Styrkeprøven Lillehammer–Oslo",
      date: "2027-06-19",
      place: "Lillehammer – Oslo",
      organiser: "Bærum og Omegn Cykleklubb",
      ownEvent: true,
      url: "https://styrkeproven.no",
      groupIds: ["b-boc3", "b-boc4"],
    }),
    road({ id: "r-oyeren", name: "Øyeren Rundt", date: "2026-08-09", place: "Fjerdingby, Rælingen", groupIds: ["b-boc1"] }),
    road({ id: "r-genus-open", name: "Genus Open by BOC", date: on(8, 19), place: "Bogstad – Sørkedalen – Tryvann", ownEvent: true, page: { href: "/sykkelritt/genus-open", label: "Mer om Genus Open" } }),
    road({ id: "r-2-mila", name: "2-Mila", date: "2026-08-23", place: "Gamle Mossevei", format: "Temporitt", organiser: "IK Hero" }),
    mtb({ id: "r-grenserittet", name: "Grenserittet", date: "2026-08-15", place: "Strömstad – Halden" }),
    mtb({ id: "r-birken", name: "Birkebeinerrittet", date: "2026-08-29", place: "Rena – Lillehammer" }),
  ].map((race): Race => {
    const key = RACE_PAGE_OF[race.id];
    const page = key && RACE_PAGES[key];
    if (page) return { ...race, slug: page.slug, info: page.info, page: { href: `/sykkelritt/${page.slug}`, label: `Mer om ${page.slug === "styrkeproven" ? "Styrkeprøven" : race.name}` } };
    // The rest of the rides share one page, «Andre ritt», each under its own heading.
    return race.page ? race : { ...race, page: { href: `/sykkelritt/andre-ritt#${race.id}`, label: `Mer om ${race.name}` } };
  });
}

/* ── News ─────────────────────────────────────────────────────────────────
   Headlines, dates and bylines are the club's own, from baerumock.no/news.
   The text under each is a short summary written for the prototype, and the
   slug never carries a person's name (see articleSlug in lib/content.ts). */

interface NewsInput {
  id: string;
  slug: string;
  nodeId: string;
  title: string;
  lead: string;
  body: string[];
  author: string;
  date: string;
  photo?: string;
  home?: boolean;
  /** Structured body (headings, lists, links) for a notice that is more than paragraphs. */
  blocks?: Block[];
}

const link = (text: string, href: string): Inline => ({ type: "link", text, href });
const t = text;

/* The partner deal with Anton Sport, as the club sent it to members. */
const ANTON_CLUB_URL = "https://www.antonsport.no/klubbmedlemskap/99900325";
const antonSportBenefits: Block[] = [
  { type: "heading", text: "Slik gjør du det" },
  {
    type: "list",
    ordered: true,
    items: [
      [t("Trykk på denne lenken: "), link("antonsport.no/klubbmedlemskap", ANTON_CLUB_URL), t(".")],
      [t("Er du medlem i Anton Club fra før? Da logger du inn via lenken, og velger ja på spørsmål om du vil legge til klubbavtalen til profilen din.")],
      [t("Er du ikke medlem av Anton Club fra før? Da trykker du på «Bli medlem» via lenken, registrerer deg, og velger ja på spørsmål om du vil legge til klubbavtalen til profilen din.")],
    ],
  },
  para([
    t("Fiks ferdig! Du får nå alltid BOCs medlemsfordeler når du oppgir telefonnummeret ditt i Anton Sports butikker, eller logger inn på profilen din på "),
    link("antonsport.no", "https://www.antonsport.no"),
    t("."),
  ]),
  para([t("Kontaktperson hos Anton Sport Bekkestua som kjenner avtalen med BOC: Mattis Andersen.")]),
  { type: "heading", text: "Medlemsfordeler i Anton Sport" },
  {
    type: "list",
    items: [
      [t("20 % bonus i Anton Club. Gjelder i alle Anton Sport-butikker og på "), link("antonsport.no", "https://www.antonsport.no"), t(".")],
      [t("Egen serviceavtale med fastpris på gull- og sølvservice. Gjelder kun hos Anton Sport Bekkestua og Milslukern.")],
      [t("5 % kickback til klubben: 5 % av alt du handler som medlem går direkte tilbake til BOC.")],
    ],
  },
  { type: "heading", text: "Hva er bonus?" },
  para([
    t("Bonus er noe Anton Sport gir medlemmene tilbake for alle kjøp av varer til ordinær pris. Det fungerer som en slags Anton-penger du kan kjøpe andre varer og tjenester for. Bonusen regnes alltid i kroner: 100 kroner i bonus tilsvarer 100 kroner. Du finner din personlige bonus på alle produktene i nettbutikken, og du kan alltid se hvor mye bonus du har tjent opp på profilen din."),
  ]),
  { type: "heading", text: "Er bonus det samme som rabatt?" },
  para([
    t("Ikke helt. Bonus er litt som å få en tilgodelapp: bonusen du samler opp, kan du bruke som betalingsmiddel på en senere handel, mens rabatt er et fratrekk i prisen når du handler."),
  ]),
  { type: "heading", text: "Serviceavtale" },
  para([
    t("Service på sykkelen kan du få gjort både hos Anton Sport Bekkestua og hos Milslukern. Reserver time her: "),
    link("antonsport.no/bikefolder", "https://www.antonsport.no/bikefolder"),
    t("."),
  ]),
  para([
    t("Hva som inngår i sølv- og gullservice, og vilkårene for avtalen, står i "),
    link("BOCs serviceavtale (PDF)", "https://spond.com/storage/upload/F6EEC0F9DC58AC9102A8E6089F535006/1771887013_3FDE0798/BOC_Service.pdf"),
    t("."),
  ]),
  { type: "heading", text: "Bli med!" },
  para([
    t("Å være medlem i Anton Club gjennom BOC gir fordeler både for deg og for klubben. Ta steget i dag, og vær med på å støtte BOC samtidig som du sparer penger. "),
    link("Bli medlem i Anton Club", ANTON_CLUB_URL),
    t("."),
  ]),
];

export const BOC_BENEFITS_SLUG = "medlemsfordeler-hos-anton-sport";

/* NorgesCup 2026: the results as the club reported them, retold for the
   prototype. Every rider is a mention, so anonymising one leaves the
   neutral phrase in their place. */
const norgescupBmx: Block[] = [
  para([t("Med sesongavslutningen på Sviland er NorgesCupen 2026 kjørt ferdig, og sammenlagtlista har flere BOC-ryttere helt i toppen.")]),
  { type: "heading", text: "Pallen sammenlagt" },
  {
    type: "list",
    items: [
      [m("bp-jorgen-lillemoen", "Jørgen Lillemoen", "En BOC-rytter"), t(" – 1. plass, og klassevinner")],
      [m("bp-valters-zabelis", "Valters Zabelis", "En BOC-rytter"), t(" – 2. plass")],
      [m("bp-ludvig-lier-tonne", "Ludvig Lier Tønne", "En BOC-rytter"), t(" – 3. plass")],
    ],
  },
  { type: "heading", text: "Like bak" },
  {
    type: "list",
    items: [
      [m("bp-nikolai-houge-haaland", "Nikolai Houge-Haaland", "En BOC-rytter"), t(" – 4. plass")],
      [m("bp-elias-haveland", "Elias Haveland", "En BOC-rytter"), t(" – 4. plass")],
      [m("bp-marcus-haugen", "Marcus Haugen", "En BOC-rytter"), t(" – 7. plass")],
    ],
  },
  para([
    t("Siste runde på Sviland ga også en fin avslutning for de yngre: i klassen 11–12 år kjørte "),
    m("bp-ulrik-krydsby", "Ulrik Krydsby", "en av våre ryttere"),
    t(" inn til 2. plass. Det lover godt for rytterne som kommer etter de etablerte."),
  ]),
  para([t("Gratulerer til alle BOC-rytterne med en sterk sesong i NorgesCupen!")]),
];

const NEWS: NewsInput[] = [
  {
    id: "b-a-norgescup-bmx",
    slug: "sammenlagt-norgescupen-bmx-2026",
    nodeId: "b-bmx",
    title: "Sterke sammenlagtresultater for BOC BMX i NorgesCupen 2026",
    lead: "Sesongen ble avsluttet på Sviland, og sammenlagt i NorgesCupen endte flere BOC-ryttere på pallen og like bak.",
    body: [],
    blocks: norgescupBmx,
    author: "bu-thelia",
    date: "2026-09-22",
    photo: "b-ph-bmx-norgescup",
    home: true,
  },
  {
    id: "b-a-anton-club",
    slug: BOC_BENEFITS_SLUG,
    nodeId: "b-boc",
    title: "Bli medlem i Anton Club knyttet til BOC",
    lead: "Bli medlem i Anton Club, så skaffer du deg gode fordeler hos vår partner Anton Sport samtidig som du støtter BOC.",
    body: [],
    blocks: antonSportBenefits,
    author: "bu-christian",
    date: "2026-02-24",
  },
  {
    id: "b-a-utfor-nc",
    slug: "topplassering-i-norgescupen-i-utfor",
    nodeId: "b-downhill",
    title: "Topplasseringer på BOCs Ulrik Gerner",
    lead: "Klubbens utforrytter vant runde 2 av Norgescupen på Trysil i klassen M Senior.",
    body: [
      "Vinnertiden ble 3.34 i en løype der de fleste tapte tid i de tekniske partiene øverst.",
      "Resultatet følger opp en solid plassering i årets NM, og lover godt for utformiljøet i klubben.",
    ],
    author: "bu-eivind",
    date: "2026-09-01",
    photo: "b-ph-ulrik-gerner",
    home: true,
  },
  {
    id: "b-a-nm-bmx",
    slug: "seks-pallplasser-i-nm-bmx",
    nodeId: "b-bmx",
    title: "Fine prestasjoner fra BOC BMX under NM",
    lead: "Klubben stilte med en liten tropp på Klepp, og kjørte inn til seks pallplasser og ett NM-gull.",
    body: [
      "I Boys 14 tok klubben både gull og bronse i samme klasse, og flere av de yngste rytterne kjørte sine første NM-heat.",
      "Trenerne trekker fram at hele troppen forbedret startene sine gjennom helgen.",
    ],
    author: "bu-thelia",
    date: "2026-06-20",
    photo: "b-ph-bmx-air",
    home: true,
  },
  {
    id: "b-a-aremark",
    slug: "sterk-helg-i-aremark-og-rade",
    nodeId: "b-bmx",
    title: "Sterk helg for BMX gruppen – topp innsats i Aremark og Råde",
    lead: "RegionsCup i Aremark lørdag og regionsmesterskap i Råde søndag ga mange pallplasser.",
    body: [
      "Klubben stilte med bred tropp begge dager, og flere ryttere kjørte seg til finale i sine klasser.",
      "Foresatte stilte som funksjonærer i depot og på kiosk gjennom helgen.",
    ],
    author: "bu-thelia",
    date: "2026-06-07",
    photo: "b-ph-landevei-group",
  },
  {
    id: "b-a-bruksmarked",
    slug: "bmx-bruksmarked-under-treningen",
    nodeId: "b-bmx",
    title: "BMX Mini Bruksmarked torsdag 21.mai",
    lead: "Ta med utstyr og klær du vil selge eller bytte, så rigger vi opp fra kl. 18.30.",
    body: [
      "Markedet holder til ved klubbhuset mens treningen pågår. Foresatte hjelper til med rigging og salg.",
      "Har du utstyr barna har vokst fra, er dette en enkel måte å sende det videre i klubben.",
    ],
    author: "bu-thelia",
    date: "2026-05-20",
  },
  {
    id: "b-a-rekruttsykling",
    slug: "rekruttsykling-bmx-6-mai",
    nodeId: "b-bmx-rekrutt",
    title: "Rekruttsykling BMX 6.mai kl 18.00",
    lead: "Åpen økt for alle som vil prøve BMX, uansett nivå og alder.",
    body: [
      "Trenerne tar imot på banen og deler inn i grupper. Klubben låner ut hjelm og beskyttelse til dem som trenger det.",
      "Møt opp i god tid, så rekker vi en runde på banen før økten starter.",
    ],
    author: "bu-thelia",
    date: "2026-05-06",
    photo: "b-ph-bmx-berm",
  },
  {
    id: "b-a-sesongapning-bmx",
    slug: "sesongapning-for-bmx-lop",
    nodeId: "b-bmx",
    title: "Sesongåpning for BMX‑løp",
    lead: "Elleve ryttere fra klubben var på startstreken i sesongens første løp i Region Øst.",
    body: [
      "De yngste klassene kjørte sine første løp for året, og klubben hadde ryttere i finale i flere aldersklasser.",
      "Arrangementet ble gjennomført i fint vær og med god stemning i depot.",
    ],
    author: "bu-thelia",
    date: "2026-04-20",
  },
  {
    id: "b-a-lokale-lop",
    slug: "lokale-bmx-lop-2026",
    nodeId: "b-bmx",
    title: "Lokale BMX løp 2026",
    lead: "Oversikt over løpene i regionen gjennom sesongen, fra Gresshoppa i april til halloweenløpet i november.",
    body: [
      "Alle løp til og med 12 år er barneleker, uten rangering. Klubben stiller med telt, kiosk og lagleder på de fleste løpene.",
      "Invitasjon og påmelding legges ut i Spond i forkant av hvert løp.",
    ],
    author: "bu-thelia",
    date: "2026-04-18",
    home: true,
  },
  {
    id: "b-a-foreldremote-bmx",
    slug: "bmx-foreldremote-14-april",
    nodeId: "b-bmx",
    title: "BMX Foreldremøte 14.april kl 18.30",
    lead: "Foreldremøte på klubbhuset om sesongen, dugnad og gruppeinndeling.",
    body: ["Vi går gjennom treningstider, løpskalender og hvilke oppgaver klubben trenger hjelp til gjennom sesongen."],
    author: "bu-thelia",
    date: "2026-04-14",
  },
  {
    id: "b-a-sesongstart-terreng",
    slug: "sesongstart-terreng",
    nodeId: "b-terreng",
    title: "Sesongstart Terreng",
    lead: "Treningene starter opp igjen mandag 13. april, og hele vårens økter ligger i Spond.",
    body: [
      "Oppmøtested varierer mellom gruppene, og noen økter er ikke låst ennå. Følg med i Spond for detaljer.",
      "Det kommer flere arrangementer utover våren: spesialtreninger, turer og mekkekveld på klubbhuset.",
    ],
    author: "bu-eivind",
    date: "2026-04-08",
    photo: "b-ph-downhill",
    home: true,
  },
  {
    id: "b-a-sesongstart-bmx",
    slug: "sesongstart-2026-bmx",
    nodeId: "b-bmx",
    title: "Sesongstart 2026 – BMX",
    lead: "Datoene før oppstart: banedugnad, klubbhusdugnad, påsketreff, treningsstart og foreldremøte.",
    body: [
      "Treningene starter 9. april, etter to dugnadskvelder på bane og klubbhus i slutten av mars.",
      "Treningstider og gruppeinndeling publiseres fortløpende. Nye og gamle medlemmer er like velkomne.",
    ],
    author: "bu-thelia",
    date: "2026-03-21",
  },
  {
    id: "b-a-anton-sport",
    slug: "ny-samarbeidspartner-anton-sport",
    nodeId: "b-boc",
    title: "Ny samarbeidspartner",
    lead: "Anton Sport overtar som klubbens partner på utstyr og verksted.",
    body: [
      "Den forrige avtalen tok slutt da samarbeidspartneren valgte å trappe ned på sykkel.",
      "Den nye avtalen gir medlemmene fordelaktige priser på utstyr og tilgang til verksted med erfarne mekanikere.",
    ],
    author: "bu-christian",
    date: "2026-02-24",
    photo: "b-ph-bmx-berm",
  },
  {
    id: "b-a-klubbtoy",
    slug: "klubbtoy-med-tidlig-leveranse",
    nodeId: "b-boc",
    title: "Klubbtøy for tidlig leveranse i 2026",
    lead: "Kalas har åpnet et nytt bestillingsvindu, med levering i god tid før sesongen.",
    body: [
      "Bestillingsvinduet er åpent til og med 4. januar, med estimert forsendelse i begynnelsen av mars.",
      "Trenger du nytt tøy til klubbturen til Mallorca, er dette sjansen.",
    ],
    author: "bu-christian",
    date: "2025-12-15",
    photo: "b-ph-landevei-group",
  },
  {
    id: "b-a-spinning",
    slug: "spinning-i-gjonneshallen-for-alle",
    nodeId: "b-spinning",
    title: "BOC Spinning - tilbud for alle!",
    lead: "Spinningtimene i Gjønneshallen er i gang igjen, med instruktører fra klubben.",
    body: [
      "Det er økter både tirsdag og torsdag gjennom vinteren, og timene er åpne for alle medlemmer.",
      "Utesesongen er på hell, og spinning er en enkel måte å holde beina i gang til våren.",
    ],
    author: "bu-christian",
    date: "2025-10-21",
    photo: "b-ph-spinning",
    home: true,
  },
  {
    id: "b-a-regionscup-hjemme",
    slug: "regionscup-pa-hjemmebane",
    nodeId: "b-bmx",
    title: "BMX-helg med full fart: RegionsCup #3 og #4 hos BOC og Moss!",
    lead: "122 ryttere til start i Bærum Sykkelpark, og rundt 350 personer innom anlegget gjennom dagen.",
    body: [
      "Klubben arrangerte RegionsCup Øst #3 på hjemmebane, med kiosk, klubbtelt og speaker på plass.",
      "Dagen etter fortsatte helgen med løp i Moss. En stor takk til alle frivillige som sto på hele uken i forkant.",
    ],
    author: "bu-thelia",
    date: "2025-10-11",
    photo: "b-ph-bmx-air",
  },
  {
    id: "b-a-avslutning-terreng",
    slug: "sesongavslutning-terreng-2025",
    nodeId: "b-terreng",
    title: "Sesongavslutning Terreng",
    lead: "Sesongen ble rundet av på Eineåsen med kort økt, konkurranser og grilling.",
    body: [
      "Terrenggruppene har hatt høyt aktivitetsnivå gjennom hele sesongen, med turer, spesialtreninger og ritt.",
      "Selv om de faste ettermiddagstreningene er over, fortsetter turer og økter gjennom vinteren.",
    ],
    author: "bu-eivind",
    date: "2025-10-09",
    photo: "b-ph-terreng-berm",
  },
  {
    id: "b-a-genus-open",
    slug: "genus-open-by-boc-2025",
    nodeId: "b-boc",
    title: "OSLO's RÅESTE - GENUS OPEN by BOC - 2025",
    lead: "Klubbens eget ritt ble arrangert for sjuende gang, fra Bogstad gjennom Sørkedalen og opp til Tryvann.",
    body: [
      "Løypa går fra Bogstad badeplass inn til vendepunktet i Sørkedalen, før den siste stigningen på grusvei opp til toppen av slalåmbakken.",
      "Rittet arrangeres sammen med klubbens hovedsamarbeidspartner, og det ble kåret vinnere i flere klasser.",
    ],
    author: "bu-christian",
    date: "2025-08-21",
    photo: "b-ph-landevei-coast",
  },
  {
    id: "b-a-nm-utfor",
    slug: "pallplasser-i-nm-i-utforsykling",
    nodeId: "b-downhill",
    title: "Unge talenter fra Bærum på toppen av pallen i Norgesmesterskapet i utforsykling",
    lead: "To av klubbens unge ryttere kjørte seg til pallplass i den tekniske NM-løypa i Drammen.",
    body: [
      "Løypa bød på smale partier, store hopp og vanskelige steinseksjoner, og krevde like mye hode som fart.",
      "Resultatene viser at utformiljøet i klubben har vokst seg sterkt de siste sesongene.",
    ],
    author: "bu-christian",
    date: "2025-08-17",
    photo: "b-ph-downhill",
  },
  {
    id: "b-a-sommersesong-bmx",
    slug: "sterk-sommersesong-for-bmx",
    nodeId: "b-bmx",
    title: "Sterk sommersesong for BOC BMX – 3 store løp med imponerende innsats",
    lead: "NM i Moss, EuropaCup i Ängelholm og VM i København på rad og rekke.",
    body: [
      "Klubbens ryttere har levert både nasjonalt og internasjonalt gjennom sommeren.",
      "Oppsummeringene fra hvert av de tre løpene ligger som egne saker her på nyhetssidene.",
    ],
    author: "bu-thelia",
    date: "2025-08-10",
    photo: "b-ph-landevei-group",
  },
  {
    id: "b-a-vm-bmx",
    slug: "vm-bmx-i-kobenhavn",
    nodeId: "b-bmx",
    title: "Verdensmesterskap BMX – København, 28. juli–2. august: flere i 16-delsfinale!",
    lead: "Klubben stilte med sju ryttere i Challenge-klassen, og flere tok seg videre fra innledende heat.",
    body: [
      "Mesterskapet gikk over fire dager for Challenge-utøverne, med 56 norske ryttere til start totalt.",
      "For flere av klubbens ryttere var dette det første internasjonale mesterskapet.",
    ],
    author: "bu-thelia",
    date: "2025-08-09",
    photo: "b-ph-bmx-air",
  },
  {
    id: "b-a-europacup",
    slug: "europacup-i-angelholm",
    nodeId: "b-bmx",
    title: "EuropaCup #9 og #10 – Ängelholm, Sverige: Kurt tar seier i Cruiser 45+!",
    lead: "Over 800 ryttere fra hele Europa, og seier til klubben i Cruiser 45+.",
    body: [
      "Løpene gikk på en moderne bane med både fem og åtte meters startrampe og krevende pro-seksjoner.",
      "Flere av klubbens unge ryttere fikk verdifull erfaring i sterke felt.",
    ],
    author: "bu-thelia",
    date: "2025-08-08",
    photo: "b-ph-bmx-berm",
  },
];

/* Member stories behind the front page's example quotes (Club.testimonials):
   one short portrait each, written for the prototype about the invented demo
   riders and marked as examples on the page. Every mention of the member is
   a mention, so anonymising them leaves the neutral phrase. Kept out of the
   news lists (Article.memberStory). */
interface MemberStoryInput {
  personId: string;
  slug: string;
  nodeId: string;
  photoId: string;
  date: string;
  name: string;
  neutral: string;
  title: string;
  lead: string;
  before: string;
  quote: string;
  after: string;
}

const MEMBER_STORIES: MemberStoryInput[] = [
  {
    personId: "bp-demo-silje",
    slug: "medlem-silje-boc1",
    nodeId: "b-boc1",
    photoId: "b-ph-demo-silje",
    date: "2026-09-15",
    name: "Silje",
    neutral: "En av rytterne på BOC 1",
    title: " holder følge i BOC 1",
    lead: " begynte å sykle landevei for tre år siden. I år tok hun steget opp til BOC 1, den raskeste fellesgruppa.",
    before: "BOC 1 holder 33–37 km/t og kjører ofte drag og rulling på flatt terreng. Gruppa trener tirsdag og torsdag fra Bekkestua torg, og kjører langtur fra Kaffebrenneriet i Sandvika på lørdager.",
    quote: "Jeg kom fra løping og trodde BOC 1 var for proffe for meg. Nå er drag og rulling på tirsdagene høydepunktet i uka.",
    after: "På onsdagene bytter hun til terrengsykkelen og kjører stitrening med Terreng Senior på Kolsås. Det er lett å være med i flere grupper samtidig.",
  },
  {
    personId: "bp-demo-trond",
    slug: "medlem-trond-boc3",
    nodeId: "b-boc3",
    photoId: "b-ph-demo-trond",
    date: "2026-09-13",
    name: "Trond",
    neutral: "En av rytterne på BOC 3",
    title: " fant tempoet i BOC 3",
    lead: " begynte å sykle i gruppe da han fylte femti. Nå møter han BOC 3 på Bekkestua to kvelder i uka.",
    before: "BOC 3 holder 27–30 km/t, for dem som har syklet en del og vil ha jevn fart i gruppe. Gruppa kjører tirsdag og torsdag fra Bekkestua torg, og langtur fra Kaffebrenneriet på lørdager.",
    quote: "Jeg trodde landevei i gruppe var for unge og raske. I BOC 3 er farten akkurat passe, og praten går hele veien.",
    after: "Når formen er god, kjører han med BOC 2 i stedet. Det er lett å bytte gruppe fra tur til tur, så man kan velge fart etter dagsformen.",
  },
  {
    personId: "bp-demo-rebekka",
    slug: "medlem-rebekka-junior",
    nodeId: "b-junior",
    photoId: "b-ph-demo-rebekka",
    date: "2026-09-02",
    name: "Rebekka",
    neutral: "En av juniorene",
    title: "s første ritt",
    lead: " sykler i juniorgruppa på Landevei, og stilte på sitt første ritt i sommer sammen med resten av gruppa.",
    before: "Juniorene trener intervaller fra Bærum Idrettspark på tirsdager og kjører langtur med resten av klubben i helgene. Mange av dem kom fra ungdomsgruppa.",
    quote: "Juniorgruppa ga meg både treningskompiser og mitt første ritt. Det hadde jeg aldri turt å stille på alene.",
    after: "På lørdagene sykler hun ofte langtur med BOC 2. Det er lett å bytte gruppe fra tur til tur, og ingen trenger å melde seg ut av den ene for å prøve den andre.",
  },
  {
    personId: "bp-demo-sander",
    slug: "medlem-sander-bmx",
    nodeId: "b-bmx-voksen",
    photoId: "b-ph-demo-sander",
    date: "2026-09-12",
    name: "Sander",
    neutral: "En av BMX-rytterne",
    title: " og startgrinda",
    lead: " begynte på BMX som sjuåring. I dag trener han med Gruppe 3 i Bærum Sykkelpark to kvelder i uka.",
    before: "Det første året handlet mest om å komme seg rundt banen uten å gå av sykkelen. Nå øver gruppa på starter, svinger og hopp, og trenerne deler inn etter hva hver enkelt er klar for.",
    quote: "Det beste er startgrinda. Når den faller, er det bare å tråkke så hardt du kan. Og etter treningen får vi is.",
    after: "Når klubben arrangerer RegionsCup på hjemmebane, står foreldrene som funksjonærer i depot og på kiosken, mens rytterne kjører heat etter heat.",
  },
  {
    personId: "bp-demo-robin",
    slug: "medlem-robin-zwift",
    nodeId: "b-zwift",
    photoId: "b-ph-demo-robin",
    date: "2026-09-05",
    name: "Robin",
    neutral: "En av rytterne på Zwift",
    title: " sykler sammen hele vinteren",
    lead: " sykler på Zwift med klubben fra november til mars, to kvelder i uka.",
    before: "Om vinteren arrangerer klubben Meetups på Zwift mandag og onsdag. «Stay together» er på, så alle holder sammen uansett watt.",
    quote: "Zwift om vinteren gjør at jeg holder formen uten å sykle alene. Med «Stay together» kommer vi i mål som en gruppe.",
    after: "Når sesongen starter igjen i april, bytter han til BOC 1 fra Bekkestua. Mange sykler i flere grupper gjennom året, og det er lett å bytte.",
  },
  {
    personId: "bp-demo-magnus",
    slug: "medlem-magnus-downhill",
    nodeId: "b-downhill",
    photoId: "b-ph-demo-magnus",
    date: "2026-09-08",
    name: "Magnus",
    neutral: "En av utforrytterne",
    title: " viser vei på Kolsås",
    lead: " kom til Downhill – Enduro fra terrenggruppa for barn og ungdom. Nå er han en av dem de nye følger etter.",
    before: "Utforgruppa trener på Kolsås og reiser på fellesturer til Drammen og Hafjell. Det tekniske lærer man best ved å kjøre bak noen som har kjørt linja før.",
    quote: "Jeg lærte å kjøre bratt sammen med folk som var litt bedre enn meg. Nå er det jeg som viser de nye linjene på Kolsås.",
    after: "Fullface-hjelm og beskyttelse er påbudt på alle utforøkter, og klubben har noe utstyr til utlån for dem som vil prøve først.",
  },
  {
    personId: "bp-demo-camilla",
    slug: "medlem-camilla-boc4",
    nodeId: "b-boc4",
    photoId: "b-ph-demo-camilla",
    date: "2026-08-20",
    name: "Camilla",
    neutral: "En av rytterne på BOC 4",
    title: " startet i BOC 4",
    lead: " kjøpte sin første landeveissykkel i fjor, og ble med i BOC 4 samme vår.",
    before: "BOC 4 holder 24–27 km/t og er gruppa for deg som er ny på landevei eller vil sykle sosialt. Gruppa møtes på Bekkestua torg tirsdag og torsdag, og kjører langtur fra Kaffebrenneriet på lørdager.",
    quote: "BOC 4 var perfekt da jeg var ny på landevei. Vi holder rolig tempo, stopper for kaffe, og ingen sykler alene hjem.",
    after: "Road Captain viser hvordan man sykler i gruppe, og det er lov å spørre om alt.",
  },
];

const memberStories = (): Article[] =>
  MEMBER_STORIES.map((s) => {
    const who = m(s.personId, s.name, s.neutral);
    return {
      id: `b-a-${s.slug}`,
      slug: s.slug,
      nodeId: s.nodeId,
      title: [who, text(s.title)],
      lead: [who, text(s.lead)],
      blocks: [
        para([text(s.before)]),
        { type: "quote", content: [text(s.quote)], attribution: [m(s.personId, s.name, "")], speakerPersonId: s.personId },
        para([text(s.after)]),
      ],
      heroPhotoId: s.photoId,
      status: "published" as const,
      authorUserId: "bu-gunhild",
      createdAt: `${s.date}T08:30`,
      publishedAt: `${s.date}T09:00`,
      onHomepage: false,
      memberStory: true,
      aboutPersonId: s.personId,
      example: true,
    };
  });

const articles = (): Article[] => [
  ...memberStories(),
  ...NEWS.map((n) => ({
    id: n.id,
    slug: n.slug,
    nodeId: n.nodeId,
    title: [text(n.title)],
    lead: [text(n.lead)],
    blocks: n.blocks ?? n.body.map((p) => para([text(p)])),
    heroPhotoId: n.photo,
    status: "published" as const,
    authorUserId: n.author,
    createdAt: `${n.date}T08:30`,
    publishedAt: `${n.date}T09:00`,
    onHomepage: !!n.home,
  })),
];

export function bocSeed(ctx: SeedCtx): Db {
  return {
    version: 1,
    seededOn: ctx.today,
    club: club(),
    themes: themeSeed(),
    nodes: nodes(ctx),
    venues: venues(),
    people: people(ctx),
    users: users(),
    photos: photos(),
    articles: articles(),
    series: series(ctx),
    activities: activities(ctx),
    races: races(ctx),
    privacyRequests: [],
    privacyContacts: [],
    externals: [],
    consentRequests: [],
    audit: [],
  };
}
