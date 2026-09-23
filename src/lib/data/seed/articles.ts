import { m, para, rt } from "@/lib/rich-text";
import type { Article } from "@/lib/types";
import type { SeedCtx } from "./context";

const NORA = "p-nora";

type ArticleInput = Omit<Article, "status" | "createdAt"> & Partial<Pick<Article, "status" | "createdAt">>;

const article = (a: ArticleInput): Article => ({
  status: "published",
  createdAt: a.publishedAt ?? "",
  ...a,
});

export function articleSeed({ at }: SeedCtx): Article[] {
  return [
    article({
      id: "a-lyn",
      slug: "j16-2-snudde-kampen-mot-lyn",
      nodeId: "j16-2",
      title: rt`${m(NORA, "Nora Hansen", "J16-2")} snudde kampen mot Lyn`,
      lead: rt`J16-2 lå under 0–1 til pause, men vant 3–1 over Lyn på Voldsløkka.`,
      heroPhotoId: "ph-lyn-hero",
      blocks: [
        para(
          rt`${m(NORA, "Nora Hansen", "En av spillerne")} scoret to mål mot Lyn, begge etter innlegg fra venstre. ${m("p-ida", "Ida Berg", "En annen spiller")} satte inn 3–1 fem minutter før slutt.${m(NORA, " Nora har spilt i klubben siden hun var sju år, og kom inn i J16-2 i vår.", "")}`,
        ),
        para(rt`Lyn tok ledelsen etter en corner midtveis i første omgang. J16-2 hadde mer av ballen, men skapte lite før pause.`),
        {
          type: "quote",
          speakerPersonId: NORA,
          content: rt`Vi snakket om å tørre å spille oss ut bakfra. Da vi fikk ballen langs bakken, kom sjansene.`,
          attribution: rt`${m(NORA, "Nora Hansen", "")}`,
        },
        { type: "gallery", photoIds: ["ph-lyn-2", "ph-lyn-3", "ph-lyn-4", "ph-lyn-5", "ph-lyn-6"] },
        {
          type: "quote",
          speakerPersonId: "p-kristin",
          content: rt`Jeg er mest fornøyd med at ingen ga seg da vi lå under. Det var hele lagets seier.`,
          attribution: rt`${m("p-kristin", "Kristin Bråten", "Treneren")}, hovedtrener`,
        },
        para(rt`Neste kamp er borte mot Skeid på lørdag. Oppmøte ved klubbhuset kl. 11.15 for felles transport.`),
      ],
      authorUserId: "u-marte",
      createdAt: at(-2, "20:12"),
      publishedAt: at(-2, "20:41"),
      onHomepage: true,
      relatedActivityId: "act-lyn",
      reviewedByUserId: "u-kari",
    }),
    article({
      id: "a-skiskole",
      slug: "pamelding-til-skiskolen",
      nodeId: "langrenn-barn",
      title: rt`Påmelding til skiskolen åpner 1. oktober`,
      lead: rt`Skiskolen er for barn fra 6 til 10 år og holder til i lysløypa ved Sognsvann.`,
      heroPhotoId: "ph-ski-trail",
      blocks: [
        para(
          rt`Vi starter når det er nok snø, vanligvis i begynnelsen av desember. Skiskolen går på søndager kl. 11.00–12.00, og barna deles inn i grupper etter hvor vant de er med ski.`,
        ),
        para(rt`Det er plass til 60 barn. Påmeldingen skjer i Spond, og lenken publiseres her 1. oktober.`),
      ],
      authorUserId: "u-kari",
      publishedAt: at(-1, "12:05"),
      onHomepage: false,
    }),
    article({
      id: "a-karusell",
      slug: "14-ungdommer-til-start-i-lillomarka-karusellen",
      nodeId: "terreng-u13",
      title: rt`14 ungdommer til start i Lillomarka-karusellen`,
      lead: rt`Siste runde for sesongen gikk i gjørmete løyper ved Grefsenkollen.`,
      heroPhotoId: "ph-mtb-group",
      blocks: [
        para(rt`Klubben stilte med 14 ryttere i klassene 13–14 og 15–16 år. Løypa var 4,2 kilometer, og de yngste kjørte tre runder.`),
        { type: "gallery", photoIds: ["ph-pumptrack", "ph-mtb-rider"] },
        para(
          rt`Karusellen er ikke et mesterskap, og alle som har fullført minst tre ritt i løpet av sesongen får premie. Neste sesong starter i mai.`,
        ),
      ],
      authorUserId: "u-silje",
      publishedAt: at(-3, "19:48"),
      onHomepage: false,
      homepageRequested: true,
    }),
    article({
      id: "a-g14",
      slug: "g14-1-videre-i-kretscupen",
      nodeId: "g14-1",
      title: rt`G14-1 videre i kretscupen`,
      lead: rt`Laget slo Bækkelaget 3–2 etter å ha ligget under 0–2, og møter Frigg i neste runde.`,
      heroPhotoId: "ph-g14",
      blocks: [
        para(rt`Kampen ble spilt på Voldsløkka i regn og sterk vind. Alle tre målene kom i løpet av de siste tjue minuttene.`),
        para(rt`Neste runde spilles hjemme mot Frigg. Tidspunkt står i aktivitetskalenderen.`),
      ],
      authorUserId: "u-torarne",
      publishedAt: at(-4, "08:30"),
      onHomepage: false,
    }),
    article({
      id: "a-j11-trenere",
      slug: "j11-trenger-to-foreldretrenere",
      nodeId: "j11",
      title: rt`J11 trenger to foreldretrenere`,
      lead: rt`Laget har 18 spillere og én trener. Klubben betaler kurset Grasrottreneren for nye trenere.`,
      blocks: [
        para(
          rt`Du trenger ikke å ha spilt fotball selv. Treningene er onsdager kl. 17.00–18.00 på Myraløkka, og fotballforbundet har ferdige økter som er enkle å følge.`,
        ),
        para(rt`Ta kontakt med ${m("p-torarne", "Tor Arne Vik", "lederen for fotballavdelingen")} hvis du kan tenke deg å bidra.`),
      ],
      authorUserId: "u-torarne",
      publishedAt: at(-5, "11:15"),
      onHomepage: true,
    }),
    article({
      id: "a-kiosk",
      slug: "kioskvaktene-for-hosten",
      nodeId: "fotball",
      title: rt`Kioskvaktene for høsten er satt opp`,
      lead: rt`Alle lag i fotballavdelingen har fått tildelt vakter på Voldsløkka fram til sesongslutt.`,
      blocks: [
        para(
          rt`Kiosken er fotballavdelingens viktigste inntektskilde og dekker blant annet dommerutgifter i barnefotballen. Hvert lag har ansvar for to eller tre lørdager i løpet av høsten.`,
        ),
        para(rt`Vaktene står i aktivitetskalenderen og i Spond. Kan dere ikke, bytt direkte med et annet lag og gi beskjed til kioskansvarlig.`),
      ],
      authorUserId: "u-torarne",
      publishedAt: at(-6, "16:40"),
      onHomepage: false,
    }),
    article({
      id: "a-kretslag",
      slug: "tre-spillere-fra-j16-til-kretslagssamling",
      nodeId: "j16",
      title: rt`Tre spillere fra J16 til kretslagssamling`,
      lead: rt`Oslo Fotballkrets har tatt ut spillere født i 2010 til høstens samlinger.`,
      heroPhotoId: "ph-kretslag",
      blocks: [
        para(
          rt`${m("p-maja", "Maja Lie", "Én spiller")} og ${m("p-leah", "Leah Johansen", "én spiller")} fra J16-1${m(NORA, " og Nora Hansen fra J16-2", " og én spiller til")} er tatt ut til Oslo Fotballkrets' samling for spillere født i 2010.`,
        ),
        para(
          rt`Samlingene er en del av kretsens spillerutvikling og består av fire økter gjennom høsten. Uttaket er gjort av kretsens trenere etter kamper i kretsserien.`,
        ),
        para(rt`Første samling er på Ullevaal kunstgress. Tidspunkt og oppmøte står i aktivitetskalenderen.`),
      ],
      authorUserId: "u-torarne",
      publishedAt: at(-9, "14:05"),
      onHomepage: false,
    }),
    article({
      id: "a-mjosa",
      slug: "treningsgruppe-1-syklet-mjosa-rundt",
      nodeId: "tg1",
      title: rt`Treningsgruppe 1 syklet Mjøsa rundt`,
      lead: rt`Ni ryttere fullførte 240 kilometer med 31,4 km/t i snitt.`,
      heroPhotoId: "ph-landevei-group",
      blocks: [
        para(
          rt`Gruppa startet fra Hamar kl. 06.00 og syklet nordover mot Lillehammer. Det var sju grader ved start, og motvind hele veien fra Lillehammer ned til Gjøvik.`,
        ),
        {
          type: "quote",
          speakerPersonId: "p-magnus",
          content: rt`Vi holdt sammen hele veien. På en sånn tur er det viktigste at alle kommer i mål i samme gruppe.`,
          attribution: rt`${m("p-magnus", "Magnus Wold", "Turlederen")}, turleder`,
        },
        para(rt`Turen var sesongens siste langtur. Fra oktober går Treningsgruppe 1 over til innendørsøkter på onsdager.`),
      ],
      authorUserId: "u-henrik",
      publishedAt: at(-12, "18:22"),
      onHomepage: true,
    }),
    article({
      id: "a-barmark",
      slug: "barmarkssesongen-er-i-gang",
      nodeId: "langrenn",
      title: rt`Barmarkssesongen er i gang for langrenn`,
      lead: rt`Ungdom trener rulleski på Holmenkollen tirsdager og løper intervaller ved Sognsvann torsdager.`,
      heroPhotoId: "ph-ski-classic",
      blocks: [
        para(
          rt`Juniorgruppa har fått individuelle treningsplaner fra ${m("p-per", "Per Ivar Strand", "treneren")}, og trener sammen med ungdomsgruppa på tirsdager.`,
        ),
        para(rt`På rulleski er hjelm, refleksvest og briller påbudt. Klubben har noen par rulleski til utlån, spør trenerne.`),
      ],
      authorUserId: "u-kari",
      publishedAt: at(-15, "10:00"),
      onHomepage: false,
    }),
    article({
      id: "a-lysanlegg",
      slug: "nytt-lysanlegg-pa-voldslokka",
      nodeId: "osk",
      title: rt`Nytt lysanlegg på Voldsløkka`,
      lead: rt`LED-lysene på bane 1 og 2 er på plass, og banene kan brukes til kl. 22.00 hele vinteren.`,
      heroPhotoId: "ph-voldslokka",
      blocks: [
        para(
          rt`Anlegget er finansiert av Oslo kommune og spillemidler, med et tilskudd fra Sagene Sparebank. Det nye lyset bruker omtrent halvparten så mye strøm som det gamle.`,
        ),
        para(rt`Banetider for vinteren blir sendt ut til lagene i løpet av oktober.`),
      ],
      authorUserId: "u-kari",
      publishedAt: at(-20, "13:30"),
      onHomepage: true,
    }),
    article({
      id: "a-sesongstart",
      slug: "nye-treningstider-for-j16-2",
      nodeId: "j16-2",
      title: rt`Nye treningstider for J16-2 fra skolestart`,
      lead: rt`Laget trener nå tirsdag og torsdag på Voldsløkka, og har fått fast tid på bane 2.`,
      heroPhotoId: "ph-season-1",
      blocks: [
        para(
          rt`Fra skolestart trener J16-2 tirsdag og torsdag kl. 18.00–19.30 på Voldsløkka kunstgress, bane 2. Søndagsøkten sammen med J16-1 fortsetter på Myraløkka når det ikke er kamp.`,
        ),
        para(
          rt`Vi har plass til to–tre spillere til. Er du født i 2010 eller 2011 og vil prøve en økt, send en melding til ${m("p-marte", "lagleder Marte Solberg", "laglederen")}.`,
        ),
        { type: "gallery", photoIds: ["ph-season-2", "ph-season-3"] },
        para(rt`Husk å svare på kampinnkallinger i Spond innen torsdag kveld, så vi vet hvor mange vi er.`),
      ],
      authorUserId: "u-marte",
      publishedAt: at(-38, "09:12"),
      onHomepage: false,
    }),
    article({
      id: "a-norwaycup",
      slug: "j16-2-til-kvartfinale-i-norway-cup",
      nodeId: "j16-2",
      title: rt`J16-2 til kvartfinale i Norway Cup`,
      lead: rt`Etter fem kamper på Ekebergsletta røk laget ut mot Stabæk etter straffesparkkonkurranse.`,
      heroPhotoId: "ph-cup-1",
      blocks: [
        para(
          rt`Laget vant gruppen med to seire og én uavgjort, og slo Kjelsås 2–0 i åttedelsfinalen.${m(NORA, " Nora Hansen ble kåret til kampens spiller.", "")}`,
        ),
        para(
          rt`I kvartfinalen sto det 1–1 etter full tid. ${m("p-frida", "Keeper Frida Holm", "Keeperen")} reddet to straffer, men Stabæk vant 4–3 etter straffesparkkonkurransen.`,
        ),
        { type: "gallery", photoIds: ["ph-cup-2", "ph-cup-3", "ph-cup-4", "ph-cup-5"] },
        para(rt`Takk til alle foreldre som tok vakter på skolen og i kiosken i løpet av uka.`),
      ],
      authorUserId: "u-marte",
      publishedAt: at(-44, "21:30"),
      onHomepage: false,
    }),

    /* ── Awaiting approval ──────────────────────────────────────────────── */
    article({
      id: "a-heming",
      slug: "seier-i-treningskampen-mot-heming",
      nodeId: "j16-2",
      title: rt`Seier i treningskampen mot Heming`,
      blocks: [
        para(
          rt`Fin kamp i regnet på Myraløkka. Jentene vant 2–1, og ${m("p-thea", "Thea Nilsen", "en av spillerne")} scoret begge målene. Takk til Heming som stilte lag på kort varsel!`,
        ),
      ],
      status: "pending",
      authorUserId: "u-jonas",
      createdAt: at(-1, "21:10"),
      onHomepage: false,
    }),
  ];
}
