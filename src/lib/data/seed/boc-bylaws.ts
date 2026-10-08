import type { Bylaws } from "@/lib/types";

/**
 * «Lov for Bærum og Omegn Cykleklubb», last revised at the annual meeting of 11 March 2026 (the club's PDF, read in
 * October 2026). The text follows the club's, section by section; only the layout is the site's. It leans on the
 * Norwegian Sports Confederation's model bylaws, so many sections refer to NIF's own law.
 */
export const BOC_BYLAWS: Bylaws = {
  title: "Lov for Bærum og Omegn Cycleklubb",
  founded: "16.12.1968",
  revised: "2026-03-11",
  basis: "Vedtatt i samsvar med lovnorm for idrettslag vedtatt av Idrettsstyret 16.12.2025 med ikrafttredelse 01.01.2026.",
  pdf: "https://spond.com/storage/upload/F6EEC0F9DC58AC9102A8E6089F535006/1773264311_1ABB61BF/BOC_Lov_revidert_2026_03_11.pdf",
  sections: [
    { n: 1, title: "Formål", clauses: [
      { text: "Idrettslagets formål er å drive idrett organisert i Norges idrettsforbund og olympiske og paralympiske komité (NIF)." },
      { text: "Arbeidet skal preges av frivillighet, demokrati, lojalitet og likeverd." },
      { text: "All idrettslig aktivitet skal bygge på de verdier som er vedtatt av Idrettstinget." },
    ] },
    { n: 2, title: "Organisasjon", clauses: [
      { no: "(1)", text: "Idrettslaget er selveiende og frittstående med utelukkende personlige medlemmer." },
      { no: "(2)", text: "Idrettslaget er medlem av Norges Cykleforbund og Norges Triatlonforbund. For regler om idrettslagets plikt til å være medlem av et særforbund, gjelder NIFs lov §10-1 (4)." },
      { no: "(3)", text: "Idrettslaget er medlem av NIF og dermed tilsluttet Viken Idrettskrets og Bærum idrettsråd." },
      { no: "(4)", text: "For regler om representasjonsrett gjelder NIFs lov §10-3 (1)." },
      { no: "(5)", text: "For regler om plikt til å overholde overordnede organisasjonsledds regelverk og vedtak gjelder NIFs lov §2-2 og §2-3." },
    ] },
    { n: 3, title: "Medlemmer", clauses: [
      { no: "(1)", text: "For regler om opptak av medlemmer, utmelding, fratakelse av medlemskap mv. gjelder NIFs lov §10-4 og §10-6." },
      { no: "(2)", text: "For idrettslagets plikt til å registrere opplysninger i idrettens medlems- og organisasjonsregister, gjelder forskrift om idrettens medlems- og organisasjonsregister, jf. NIFs lov § 10-5." },
    ] },
    { n: 4, title: "Kjønnsfordeling", clauses: [
      { text: "For regler om kjønnsfordeling i styre, utvalg mv. og ved representasjon til årsmøte/ting i overordnet organisasjonsledd, gjelder NIFs lov §2-4." },
    ] },
    { n: 5, title: "Stemmerett, valgbarhet og forslagsrett", clauses: [
      { text: "For regler om stemmerett, valgbarhet og forslagsrett gjelder NIFs lov §2-5, §2-6 og §2-7." },
    ] },
    { n: 6, title: "Inhabilitet", clauses: [{ text: "For regler om inhabilitet gjelder NIFs lov §2-8." }] },
    { n: 7, title: "Vedtaksførhet, flertallskrav og protokoll", clauses: [{ text: "For regler om vedtaksførhet, flertallskrav og protokoll gjelder NIFs lov §2-9." }] },
    { n: 8, title: "Refusjon og godtgjørelse", clauses: [{ text: "For regler om refusjon av utgifter og godtgjørelse gjelder NIFs lov §2-10." }] },
    { n: 9, title: "Regnskap og revisjon", clauses: [{ text: "For regler om regnskap og revisjon gjelder NIFs lov §1-7, §2-11, §2-13 og §2-14." }] },
    { n: 10, title: "Årsmøtet", clauses: [
      { no: "(1)", text: "Årsmøtet er idrettslagets høyeste myndighet og avholdes hvert år innen utgangen av mars." },
      { no: "(2)", text: "Ordinært og ekstraordinært årsmøte gjennomføres i samsvar med denne lov og NIFs lov §2-15, §2-16, §2-17, §2-19 og §2-20." },
      {
        no: "(3)",
        text: "Årsmøtets oppgaver:",
        items: [
          { text: "Godkjenne de stemmeberettigede medlemmene" },
          { text: "Velge dirigent(er)" },
          { text: "Velge protokollfører(e)" },
          { text: "Velge to medlemmer til å underskrive protokollen" },
          { text: "Godkjenne forretningsorden" },
          { text: "Godkjenne innkallingen" },
          { text: "Godkjenne saklisten" },
          { text: "Behandle idrettslagets årsberetning" },
          { text: "Behandle", sub: ["idrettslagets regnskap", "styrets økonomiske beretning", "kontrollutvalgets beretning", "eventuell beretning fra engasjert revisor"] },
          { text: "Behandle saker som fremgår av godkjent sakliste" },
          { text: "Fastsette", sub: ["medlemskontingent på minst kr 50", "eventuell treningsavgift, eller gi styret fullmakt til å fastsette treningsavgifter"] },
          { text: "Vedta idrettslagets budsjett" },
          { text: "Behandle idrettslagets organisasjonsplan" },
          {
            text: "Velge",
            sub: [
              "Styre med leder, nestleder, 4 styremedlemmer og ett varamedlem",
              "Kontrollutvalg med leder, og ett medlem og ett varamedlem",
              "Representanter til ting og møter i de organisasjonsledd idrettslaget har representasjonsrett eller gi styret fullmakt til å oppnevne representantene",
              "Valgkomité med leder, og ett medlem og ett varamedlem",
              "Eventuelt øvrige valg i henhold til idrettslagets organisasjonsplan",
            ],
          },
          { text: "Beslutte om det skal engasjeres revisor til å revidere idrettslagets regnskap." },
        ],
        after: "Ledere og nestledere velges enkeltvis. Øvrige medlemmer velges samlet. Deretter velges varamedlemmene samlet. Der det velges flere varamedlemmer skal det velges 1. varamedlem, 2. varamedlem osv. For regler om stemmegivningen på årsmøtet, gjelder NIFs lov § 2-21.",
      },
      { no: "(4)", text: "Kontrollutvalget arbeider i henhold til NIFs lov § 2-12." },
      { no: "(5)", text: "Valgkomiteen arbeider i henhold til NIFs lov § 2-18." },
    ] },
    { n: 11, title: "Styret", clauses: [
      { no: "(1)", text: "Idrettslaget ledes og forpliktes av styret, som representerer idrettslaget utad." },
      { no: "(2)", text: "Styret er idrettslagets høyeste myndighet mellom årsmøtene, men visse beslutninger kan kun vedtas av årsmøtet iht. § 10 (3) og NIFs lov § 2-22." },
      {
        no: "(3)",
        text: "Forvaltningen av, og tilsynet med, alle deler av idrettslagets virksomhet hører under styret. Styret skal sørge for:",
        items: [
          { text: "at idrettslagets formål ivaretas" },
          { text: "forsvarlig organisering av idrettslagets virksomhet og økonomistyring, herunder vurdere idrettslagets forsikringsbehov og tegne nødvendige forsikringer." },
          { text: "at beslutninger fattes i samsvar med overordnete organisasjonsledds regelverk og vedtak, idrettslagets lov og årsmøtets vedtak" },
          { text: "registrere opplysninger iht. § 3 (2)" },
          { text: "at det oppnevnes en ansvarlig for politiattestordningen, dersom idrettslaget organiserer idrett for mindreårige eller personer med utviklingshemming" },
          { text: "at det oppnevnes en ansvarlig for barneidretten, dersom idrettslaget organiserer barneidrett" },
        ],
      },
      { no: "(4)", text: "Styret kan oppnevne komiteer/utvalg til ivaretakelse av løpende eller enkeltstående oppgaver, og utarbeide mandat/instruks for disse." },
      { no: "(5)", text: "Styret skal oppnevne representanter til årsmøter/ting i overordnede organisasjonsledd dersom årsmøtet ikke har valgt representanter." },
      { no: "(6)", text: "Styret skal avholde møter når lederen bestemmer det eller minst 2 av styrets medlemmer forlanger det." },
    ] },
    { n: 12, title: "Grupper", clauses: [
      { no: "(1)", text: "Idrettslagets årsmøte kan beslutte å opprette og nedlegge grupper, og hvordan disse skal organiseres og ledes." },
      {
        no: "(2)",
        text: "Dersom idrettslagets årsmøte, ved behandlingen av organisasjonsplanen, har vedtatt å opprette grupper med gruppestyrer, gjelder følgende:",
        items: [
          { text: "Hver gruppe skal ha et gruppestyre på minst tre medlemmer. Gruppestyret velges på årsmøtet eller oppnevnes av styret etter fullmakt fra årsmøtet." },
          { text: "Gruppen bør ha minst ett årlig møte der gruppen diskuterer gruppens økonomi og aktiviteten i gruppen, og forslår kandidater til gruppestyret, samt gir eventuelle innspill til saker som behandles av styret eller årsmøtet." },
          { text: "Gruppestyret konstituerer seg selv, med mindre annet er besluttet av årsmøtet." },
          { text: "Gruppestyret fastsetter eventuell treningsavgift innenfor rammen av fullmakt gitt av årsmøtet eller styret." },
        ],
      },
      { no: "(3)", text: "Gruppestyret eller representanter for grupper kan ikke inngå avtaler eller på annen måte forplikte idrettslaget uten fullmakt fra styret eller årsmøtet, og innenfor de rammer som er fastsatt av styret eller årsmøtet." },
    ] },
    { n: 13, title: "Lovendring", clauses: [{ text: "For regler om lovendring gjelder NIFs lov § 2-2." }] },
    { n: 14, title: "Oppløsning", clauses: [
      {
        no: "(1)",
        text: "Idrettslaget kan vedta oppløsning:",
        items: [{ text: "ved et enstemmig vedtak om oppløsning på årsmøtet, eller" }, { text: "ved å vedta oppløsning med 2/3 flertall på to påfølgende årsmøter, der det etterfølgende årsmøtet må avholdes minimum tre måneder og maksimum 6 måneder senere." }],
        after: "En forutsetning for et gyldig vedtak om oppløsning, er at idrettslaget skriftlig varsler idrettskrets og særforbund senest 14 dager før idrettslagets årsmøte behandler forslag om oppløsning.",
      },
      { no: "(2)", text: "Sammenslutning med andre idrettslag anses ikke som oppløsning av idrettslaget. Vedtak om sammenslutning eller utmelding fra særforbund, og nødvendige lovendringer i tilknytning til dette, fattes med 2/3 flertall av årsmøtet." },
      { no: "(3)", text: "For regler om utmelding og tap av medlemskap i NIF, gjelder NIFs lov § 10-2." },
    ] },
  ],
  amendment: {
    adopted: "Vedtatt på årsmøte 11.3.2026.",
    intro: "Årsmøtet vedtok å oppdatere klubbens lov til gjeldende lovnorm vedtatt av Idrettsstyret 16.12.2025 med ikrafttredelse 01.01.2026. Hovedendringer:",
    changes: [
      "Oppdatert til lovnorm 2025/2026.",
      "Endret verdigrunnlag i § 1.",
      "Oppdatert kjønnsfordeling (§ 4).",
      "Presisering om underslagsforsikring (§ 9).",
      "Strukturtilpasning av årsmøtebestemmelser.",
      "Presisering av styrets forsikringsansvar.",
      "Harmonisering av gruppebestemmelser.",
    ],
    effect: "Loven trer i kraft umiddelbart etter vedtak.",
  },
};
