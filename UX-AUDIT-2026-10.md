# BOC-nettsiden: UX-audit

Dato: 6. oktober 2026. Omfang: BOC-klubben i prototypen, gått gjennom i nettleser på `localhost:3100` (desktop 1280 px og mobil 375 px) som tre personer: **nytt potensielt medlem**, **medlem** (inkludert innlogget forelder) og **administrator/gruppeleder**. Dette er en ren UX-audit. Sikkerhet, data og drift ligger i [AUDIT-2026-10.md](AUDIT-2026-10.md) og er ikke gjentatt her.

**Slik leser du funnene.** «Verifisert» betyr at jeg så det i nettleseren eller målte det. «Kode» betyr at jeg leste det i kildekoden. Alvorlighet: **P0** skader førsteinntrykket eller får noen til å gjøre feil. **P1** gjør en vanlig oppgave tregere eller mer usikker enn nødvendig. **P2** er finpuss.

**Hva jeg ikke har gjort.** Ingen test mot den levende produksjonssiden (dev-server med minnelager), ingen ekte telefon, ingen skjermleser, ingen kontrastmåling, ingen Lighthouse eller Core Web Vitals (bare filstørrelser), ingen brukertest. Ikke gått i dybden på: Nyheter og enkeltartikler, Om klubben, Styret, Mallorca, Personvern, samtykkesiden for foresatte (`/samtykke/[token]`), mørk modus, Oslo Sportsklubb (demoklubben) og seksjonsadmin-rollen. Det som står om dem er ikke vurdert.

**Testspor.** Jeg publiserte ett testinnlegg («UX-test: tirsdagsintervaller») som Gunhild Berg i dev-serverens minnelager for å teste publiseringsflyten. Det er slettet og ligger i «Slettet» (30 dagers papirkurv) til serveren startes på nytt. Ingenting ble avlyst eller endret ellers.

---

## 0. Vurderingen

Dette er en nettside som tydelig er laget av noen som bryr seg. Tonen er riktig («Bare møt opp», «Du blir ikke kjørt fra»), informasjonsarkitekturen følger hvordan en klubb faktisk fungerer, og admin har en egenskap de fleste klubbverktøy mangler: den forteller deg hva som venter på deg («Trenger oppmerksomhet») i stedet for å vise en meny.

Svakheten er ikke manglende funksjoner. Den er at **løftene på forsiden og detaljene under ikke alltid stemmer overens**, og at noen av de viktigste øyeblikkene er overlatt til tilfeldighetene:

1. Klubbens modell er god (landevei om sommeren, Zwift om vinteren), men gruppesiden forteller den ikke: når BOC 3 hviler i oktober står det fortsatt «Tir og tor 18.00» og «Bli med på trening», uten et ord om Zwift. Et nytt medlem kan møte opp på Bekkestua torg til ingen.
2. Første skjerm på mobil bærer en 8,3 MB rå PNG. Førsteinntrykket er det som koster mest å få feil, og det er det som er tyngst.
3. En forelder med femåring kan ikke svare på veiviserens første spørsmål.
4. Admin er laget for å være ett verktøy for alle roller. Det gir ryddig kode, men en forelder og en lagleder ser nesten samme skall som en klubbadmin, med navn og begreper som ikke er deres.

Skåre (mitt skjønn, ikke en måling): nytt medlem 7/10, medlem 6/10, lagleder 7,5/10, klubbadmin 7,5/10.

---

## 1. Nytt potensielt medlem

**Reisen jeg gikk:** forsiden → «Finn gruppen din» (40–59 år, landevei, 22–25 km/t) → anbefalt BOC 3 → «Slik blir du med første gang» → gruppesiden → Bli medlem → Barn og ungdom → Aktiviteter → Sykkelritt → søk → 404.

### Det som fungerer (og bør vernes)
- **Veiviseren** er den beste enkeltdelen av siden. Tre spørsmål, et tydelig svar («Her passer du inn», «Anbefalt for deg»), to alternativer under. Den spør ikke etter klubbspråk, og forklarer det den må («Enkel/Avansert» på tempospørsmålet).
- **«Første trening»-seksjonen** på gruppesiden svarer på det folk faktisk er redde for: tempo, distanse, utstyr, hvem du skal se etter, «Hvis du ikke henger med: du blir ikke kjørt fra». Dette er sjelden godt gjort.
- **Ærlig dato-språk** på Sykkelritt: «CA. 30 april, dato ikke kunngjort, var 1. mai 2026». Siden later ikke som den vet.
- **Spond-bruen** forklarer at du velger «I'm a member» selv om du ikke er medlem ennå. Det er akkurat stedet de fleste ville stoppet.
- **404-siden** («Calle 404») er et lite mesterverk i tone, og den gir to veier videre.
- **Medlemshistoriene** er merket «Eksempel». Riktig og ærlig.

### Funn

**N1 (P1). Gruppesiden viser ikke at Zwift er vinteren for landeveisgruppene.** *(Delvis rettet 6. oktober: «Om vinteren»-blokk med lenke til Zwift-siden på Landevei og BOC 1–4, og landevei-sesongen forlenget til oktober. Sesongstatus i hero og i veiviseren gjenstår.)* *Verifisert + kode. Rettet etter innspill: Zwift er klubbens vintertilbud for alle som sykler landevei om sommeren, så «Fellestreninger hele året» stemmer for klubben som helhet.*
Modellen er riktig og enkel: landevei april–september, Zwift 1. november–31. mars. Problemet er at den ikke fortelles der avgjørelsen tas. I dag, 6. oktober, viser BOC 3 «Tir og tor 18.00 / Søn 10.00» i hero, knappen «Bli med på trening», og veiviseren anbefaler gruppen med «3 treninger i uka». At gruppen er i pause, og at Zwift tar over, står først lengst ned i «Første trening» og i terminlisten. «Neste trening» skjules bevisst mellom sesonger (`nextTrainingFor` ser maks åtte uker frem), så siden mangler akkurat det som ville avslørt det. Det som i tillegg er uklart: Zwift starter 1. november, så 6.–31. oktober er en periode hvor landevei har pauset og vinteren ikke har begynt (bortsett fra Mallorca-turen). Jeg vet ikke om klubben har noe da, og siden sier det ikke.
*Konsekvens:* Et nytt medlem kan møte opp på Bekkestua torg en tirsdag i oktober til ingen, uten å ha fått vite at klubben har et vintertilbud.
*Forslag:* Vis sesongen i hero ved siden av tidene: «Sommersesong april–september. Fra 1. november sykler gruppa Zwift, mandag og onsdag 19.00», med lenke til Zwift. La veiviseren si hva som er aktivt nå, og la landeveisresultater utenfor sesong peke på Zwift som «vinterens versjon av denne gruppen». Si hva som gjelder i oktoberhullet.

**N2 (P0). Førsteinntrykket er 8,3 MB.** *Verifisert (filstørrelser) + kode.*
Mobil-heroen er `hero-mobile.png`, 8,3 MB, levert som rå fil. Forsiden refererer til 34 bilder på til sammen ca. 32 MB, og `Photo` bruker en vanlig `<img>` uten `srcset` og uten Next sin bildeoptimalisering (`src/components/public/photo.tsx`). Jeg målte ikke ytelse, så jeg vet ikke hva det blir i ekte 4G, men heroen på en telefon er raskt ti ganger tyngre enn den bør være. På en treg forbindelse får brukeren en grå flate der bildet skal være: det var det jeg selv så de første sekundene.
*Forslag:* Kjør alle seedbilder gjennom `next/image` med `sizes`, eller legg ferdig skalerte AVIF/WebP ved siden av originalene. Hero: maks ca. 200 KB mobil, 400 KB desktop. Sett en fast `aspect-ratio` og en dempet bakgrunnsfarge slik at flaten ikke hopper.

**N3 (P1). Veiviseren glemmer de yngste, og aldersgrensene er ikke enige.** *Verifisert.*
Nederste barnetrinn er «6–9 år». BMX Gruppe 1 er for 5–7-åringer, og forsiden sier «fra 5 til 17 år». En forelder til en femåring kan ikke svare. I tillegg: Barn og ungdom-siden sier både «Fra 5–17 år» og «Fra 5 til 19 år», og 17–18-åringer (Junior) står i voksenkolonnen i veiviseren men på Barn og ungdom-siden.
*Forslag:* Lag et steg «5 år eller yngre» eller gjør første trinn «Under 10 år». Én kilde til aldersgrenser, utledet fra gruppene i stedet for skrevet for hånd i hver tekst.

**N4 (P1). Hva det koster er ikke egentlig svart på.** *Verifisert.*
«Treningsavgift kommer i tillegg der gruppa har det» står på to sider, uten ett eneste beløp. Setningen om familierabatt er vanskelig å lese («samme adresse og med samme betaler»). Kontaktpersonene på Bli medlem er lederne for terreng og BMX, uansett hva du leter etter; en voksen landeveisinteressert får dem likevel.
*Forslag:* Vis treningsavgift per gruppe der den finnes, ellers «ingen treningsavgift». Skriv en totalpris for et typisk scenario («Voksen, landevei: 700 kr + treningsavgift X»). Kontaktpersonen skal følge det du kom fra (gruppe eller disiplin), med `post@` som reserve.

**N5 (P1). Søket finner bare titler.** *Verifisert + kode.*
«pris» og «kontingent» gir «Ingen treff». Indeksen er sider, grupper og nyheter, filtrert på tittel (`src/lib/search.ts`). Ord folk faktisk skriver («pris», «hjelm», «Spond», «Zwift», «barn», «kontingent», «Mallorca») treffer bare hvis de tilfeldigvis står i en tittel. Tomtreff er en blindvei uten forslag.
*Forslag:* Legg til søkeord og korte sammendrag per indeksoppføring (kontingent → Bli medlem). Ved null treff: vis de fem vanligste snarveiene og «Spør oss».

**N6 (P1). Mobil: den viktigste knappen er gjemt.** *Verifisert.*
«Bli med» finnes bare i hamburgermenyen og ser der ut som alle andre rader. Søk og tema-bytte er 36 × 36 px, menyknappen 40 × 40 (anbefalt minimum 44). På forsiden er 100 interaktive elementer under 44 px i høyde eller bredde (mange er tekstlenker som «Alt om landevei», 21 px høye). Forsiden er 13,8 skjermhøyder lang.
*Forslag:* Behold en kompakt «Bli med» i toppfeltet på mobil. Gi alle ikoner 44 px treffflate. Vurder å korte inn forsiden på mobil (historier som én stripe, ikke karusell).

**N7 (P2). Veiviserens små friksjoner.** *(«Usikker» på tempospørsmålet er lagt til 6. oktober.)* *Verifisert.*
Hvert valg krever «Neste» også når det bare finnes ett svar. Alle alternativer er like gule, så det valgte skilles bare av en liten hake og kantlinje. Tempospørsmålet («hvilken fart holder du på en rolig langtur alene?») er vanskelig for en nybegynner; «Under 22 km/t: rolig tur, gjerne med stopp» hjelper, men «Jeg vet ikke» mangler.
*Forslag:* Auto-gå videre på enkeltvalg. Gi valgt kort en tydeligere fyll. Legg til «Vet ikke ennå, vis meg de rolige».

**N8 (P2). Gradientflatene.** *Verifisert.*
Sykkelritt-heroen er et blått, abstrakt gradient der leseren forventer et bilde av ryttere, og BOC 3-heroen viste en grå flate før bildet kom. Jeg forstår at gradienten er en bevisst reserve for rammer uten bilde, men på akkurat Sykkelritt er den første skjermen om ritt uten et eneste ritt i seg.

---

## 2. Medlem (og forelder)

Dette er den tynneste persona fordi mye av medlemslivet bor i Spond og ikke på nettsiden. Det er riktig prinsipp (nettsiden eier ukerytmen, Spond eier enkeltøkter og påmelding). Spørsmålet er om nettsiden gjør nok i grenseflaten.

### Det som fungerer
- **Aktiviteter** har filter på disiplin og alder, «Kommende» og «Treningstider» som faner, og et årshjul. Avlysninger vises med én gang.
- **Ritt-siden** forteller hvilke av *dine* grupper som kjører hvilket ritt («Gruppene våre: BOC 1, BOC 2»).
- **Beredskapsplanen** er lenket der du trenger den, før du kjører ritt.

### Funn

**M1 (P1). Tre kalendere som ikke snakker sammen.** *Verifisert.*
Gruppesidens terminliste, Aktiviteter og Sykkelritt viser delvis de samme tingene på tre måter. På Aktiviteter kommer et 12-måneders Gantt-skjema (seks rader, to sesonger) *før* listen over hva som skjer snart; på mobil er raden «Landevei, 12 ritt, 2 turer, Trening» avkortet i en smal kolonne. Medlemmet som vil vite «når er neste ting for meg» må forbi alt dette.
*Forslag:* Gi Aktiviteter «Neste for deg» øverst (husk valgt gruppe i nettleseren), og legg årshjulet som sekundærvisning under en fane.

**M2 (P1). Det finnes ikke et sted for «mine ting».** *Verifisert.*
Et medlem uten admin-rolle har ingen innlogget visning. Det er et bevisst valg (Spond er hjem), men det betyr at nettsiden alltid må kunne svare helt anonymt: «Hva skjer neste uke i min gruppe?». I dag svarer den for sesonger og ritt, ikke for uka.
*Forslag:* Behold ingen kontoer, men husk gruppevalg lokalt og vis «Din gruppe» som en tynn stripe øverst på forsiden og Aktiviteter for tilbakevendende besøkende.

**M3 (P1). Foresatt får et administrasjonsskall.** *Verifisert.*
Rune (foresatt, Gruppe 2) logger inn og får samme oversikt som en lagleder: «Trenger oppmerksomhet: Alt er i orden», «Skriv et innlegg», «Din tilgang: Skrive innlegg, Se alt innhold i området», og en «Struktur»-fane som viser alle klubbens roller og styret. Det en forelder faktisk trenger finnes ikke her: hvilket samtykke jeg har gitt for barnet, hva klubben har registrert, hvordan jeg trekker samtykket, hva som har vært på nett om barnet mitt. Dette er det personvernmodellen lover, og det mangler som en synlig flate.
*Forslag:* Gi foresatt en egen, liten startside («Mitt barn»: samtykke, hvor barnet er omtalt, trekk tilbake, spør klubben) og fjern «Struktur» og «Se alt innhold» som navn.

**M4 (P2). Tomme tilstander.** *Verifisert.*
Bidragsyter og foresatt har en «Sist publisert»-boks som bare er en tittelstripe, uten tekst. En tom boks leses som en feil.
*Forslag:* En linje: «Du har ikke sendt inn noe ennå. Skriv første innlegg».

---

## 3. Administrator og gruppeleder

**Reisen jeg gikk:** lagleder (Gunhild Berg, Ungdom og Junior): oversikt → nytt innlegg med bilder → Innlegg → Grupper → rediger Ungdom → Første trening → Aktiviteter → «Avlys». Bidragsyter (Tone Krogh), foresatt (Rune Fjeld) og klubbadmin (Christian Adriaenssens): oversikt, bilder, medlemmer, person, brukere, personvern, innstillinger, struktur. Mobil admin ble sjekket for klubbadmin.

### Det som fungerer
- **Oversikten** er ikke en meny, den er en innboks: «2 bilder venter på kontroll», «Mangler fotosamtykke», «Grupper uten kontaktperson», hver med en handling. Det er riktig.
- **Mobil admin** har en fast bunnlinje (Oversikt, Grupper, **+**, Innlegg, Mer) og er mer gjennomtenkt enn de fleste desktop-verktøy.
- **Innleggsskjemaet** er kort («Overskrift, noen setninger og gjerne et bilde. Resten ordner seg.») med live forhåndsvisning av hvordan det ser ut på nettsiden og hvor det havner («Vises på Ungdom og på sidene for Barn og ungdom, Landevei og Sykkel»).
- **Rollehonest tekst:** «Din tilgang» forteller hva du kan; knappen heter «Send til godkjenning» for bidragsyter og «Publiser» for lagleder.
- **Arv i gruppeeditoren:** «Nå står det: … (fra Landevei)» under hvert felt er den riktige løsningen på «hva om jeg lar det stå tomt».
- **Avlys-dialogen** har valgfri grunn og to ærlige knapper («Behold» / «Avlys aktiviteten»).
- **Sletting av innlegg** forteller konsekvensen i klartekst (30 dager, kan gjenopprettes).

### Funn

**A1 (P1). Lagleders viktigste oppgaver ligger under «Klubben ▾».** *Verifisert + kode.*
Lagleder-navigasjonen er Oversikt, Innlegg, Sitater, **Klubben ▾**, Medlemmer. Å endre gruppesiden og avlyse en økt (det en lagleder gjør mest etter å ha skrevet innlegg) ligger bak en nedtrekksmeny som heter etter klubben, ikke etter laget hennes. «Sitater» (medlemshistorier) har en egen toppfane. Rekkefølgen speiler hva *systemet* har, ikke hva *hun* gjør.
*Forslag:* Navngi etter oppgave og eierskap: «Mitt lag» (gruppeside, aktiviteter, medlemmer) som egen fane for lagleder; flytt «Sitater» under innhold. På desktop kan oversikten ha hurtiglenker «Endre gruppeside» og «Avlys en økt» ved siden av «Skriv et innlegg».

**A2 (P1). Aktiviteter er en lesevisning med én knapp.** *Verifisert.*
Siden viser de neste to ukene og «Avlys» på hver rad. Du kan ikke flytte tid eller sted for én gang, legge til en ekstra økt eller se *hvorfor* en fast økt står der. Avlys-dialogen sier at økten «vises som avlyst på nettsiden», men ikke at medlemmene *ikke* får beskjed og at det må gjøres i Spond også. Det er to sannheter: nettsiden og Spond kan si forskjellig om samme økt.
*Forslag:* Si det rett ut i dialogen («Medlemmer får beskjed i Spond, ikke her. Husk å avlyse der også») og lenk til Spond-gruppen. Tilby «Flytt denne gangen» som en overstyring med samme tekst.

**A3 (P1). Bildespørsmålene er riktige, men uklare.** *Verifisert + kode.*
Det er sterkt å kreve «Hvem tok bildet?» og «Hvem er med?» før publisering. Men:
- Spørsmålet står i entall og gjelder hele innlegget (kode: én `photographer` og ett `tagged`-sett per innlegg), uansett om det er fire bilder fra to fotografer. Det gir feil kreditering uten at brukeren kan se det.
- Forklaringen er ett tett avsnitt med ord som «skjold» og «sladdes». Ikonet som forklares vises ikke der teksten står.
- Menyene for å velge personer er knapper med tilgjengelig navn «Utøver» (rolle, ikke navn), og avkrysningen «Ingen identifiserbare personer» har tilgjengelig navn «on». En skjermleser får ikke vite hvem du velger. (*Verifisert i tilgjengelighetstreet.*)
- Etter publisering vises «Publisert på Ungdom» med «Se innlegget», men ingen «Angre» der og da.
*Forslag:* Velg fotograf og personer per bilde (eller «Samme for alle»). Korte inn forklaringen til to setninger og lenk til «Hva betyr dette?». Gi alle knapper tilgjengelig navn. Legg til «Angre» på bekreftelsesskjermen i noen minutter.

**A4 (P1). Kontroll av bilder skjer på frimerker.** *Verifisert.*
På Bilder-siden er hvert bilde 128 px bredt og ikke klikkbart. Oppgaven er å avgjøre om riktig person er merket og om «Ingen identifiserbare personer» stemmer; det går ikke på et frimerke. Teksten sier også «blir det en rød varsel» (feil kjønn: «et rødt varsel»).
*Forslag:* Klikk for å åpne stort, med tagger og fotograf ved siden av, og tastatur (piltaster, Enter = godkjenn). Rett teksten.

**A5 (P1). Innleggslisten blander ting du kan og ikke kan.** *Verifisert.*
Gunhild (lagadministrator for Ungdom og Junior) ser åtte innlegg, men kan bare redigere to; de andre har bare «Vis» uten forklaring. Etter publisering kan ikke bilder byttes eller fjernes («Bilder og adressen til innlegget endres ikke her»), så en feil i bildet betyr å slette hele innlegget. Det finnes ikke søk, og ingen «Mine innlegg».
*Forslag:* «Mine» som standardfilter. Grå ut innlegg du ikke kan endre med tekst («Tilhører Terreng»). La bilder kunne byttes via kontroll-flyten fra A4.

**A6 (P1). «Kan ikke logge inn» uten årsak eller handling.** *Verifisert (dev) + kode.*
På Brukere og tilgang står «Kan ikke logge inn» på sju av åtte, uten å si hvorfor (ikke invitert? mangler e-post?) og uten en handling på raden. I dev er pålogging ikke koblet til, så dette kan være et prototypeartefakt. Verifiser mot produksjon.
*Forslag:* Tre tilstander med handling: «Invitert, venter», «Aktiv», «Deaktivert», og en «Send invitasjon på nytt» på raden.

**A7 (P1). Personsiden har den farlige handlingen øverst.** *Verifisert.*
På Filip Aunes side kommer **«Anonymiser permanent»** (med «Kan ikke angres») som første kort, *før* profil, medlemskap, foresatte og samtykke. En sjelden og uopprettelig handling har høyere plass enn det du kommer for å gjøre. Samme side viser også en uoverensstemmelse: «Samtykke gitt, 19. januar 2026» for en 14-åring mens «Ingen foresatt er registrert. Klubben har da ingen å spørre om samtykke». Hvem ga samtykket?
*Forslag:* Flytt til en egen «Personvern»-fane eller nederst, bak en tydelig skillelinje. Vis en advarsel når et barn har samtykke uten registrert foresatt.

**A8 (P2). Én ting, fire navn.** *Verifisert + kode.*
Toppmenyen sier «Folk», siden heter «Medlemmer», adressen er `/admin/personer`, tilbakelenken heter «Personer». Listen inneholder styremedlemmer, trenere og kontrollutvalg som ikke er medlemmer. «Eksterne» er uforklart. Kolonnen «Offentlig synlig i» viser «Ingen» for nesten alle mens «Personvern» viser «Synlig». Det leses som en motsigelse.
*Forslag:* Ett ord («Personer») overalt. Gi kolonnen en forklarende tittel («Nevnt på nettsiden»).

**A9 (P2). Stille avvisninger.** *Verifisert.*
En bidragsyter som går til `/admin/personer` sendes stille til oversikten uten forklaring. Forsiden av et kjent område som plutselig ikke finnes er forvirrende.
*Forslag:* Behold omdirigeringen, men vis en kort melding: «Du har ikke tilgang til Personer.»

**A10 (P2). Gruppeeditoren åpner med et bilde på 440 px.** *Verifisert.*
Hovedbildet tar en hel desktopskjerm før det første tekstfeltet, med «Lagre og publiser» flytende midt i bildet. Tekstfeltene er det de fleste kommer for.
*Forslag:* Bilde som en kompakt rad («Bytt bilde» + miniatyr) og tekstfelt først.

**A11 (P2). Detaljer.** *Verifisert.*
Innstillinger viser en forhåndsvisning av klubbfarger med Oslo Sportsklubbs fotballinnhold i en BOC-klubb. Struktursiden sier «1 idretter». Innstillinger har prototypetekst («Innlogging er ikke koblet til i prototypen»). Brukermenyen har demobytte og «Tilbakestill til utgangspunktet» (dev; ikke vurdert i produksjon). Avlys-knappen har samme vekt på alle rader.

---

## 4. Tvers av alle tre

| Tema | Funn |
|---|---|
| **Bilder** | Rå, uskalerte filer overalt (N2). Grå flate under lasting. |
| **Berøring** | Mange mål under 44 px på offentlig mobil (N6); admin er bedre (filter 36, knapper 32–40). |
| **Tilgjengelighet** | Gode grunnlag (`lang="nb"`, én `h1` per side, hopp-til-innhold, ingen bilder uten `alt` på sidene jeg målte). Mangler: tilgjengelige navn på merkeknapper («Utøver», «on»), og brukermenyen i toppfeltet er en knapp uten tilgjengelig navn. Ikke testet med skjermleser. |
| **Språk** | «Fotosamtykke»/«samtykke», «gruppe/lag/avdeling/disiplin/aldersgruppe», «Klubbåret». Internt språk lekker ut: «sladdes», «skjold», «Road Captain» uten forklaring for nybegynnere. |
| **Konsistens** | Tre kalendere (M1), fire navn for personregisteret (A8), to aldersgrenser for barn (N3). |
| **Konsollen** | Dev-konsollen viser «Encountered a script tag while rendering React component» og en 404-ressurs. Ikke brukerrettet, men verdt å rydde. |

---

## 5. Anbefalt rekkefølge

**Denne uken (liten innsats, stor effekt)**
1. N1: sesongstatus og «Zwift tar over» i hero og i veiviserens resultat, og avklar oktoberhullet.
2. N2: bildeoptimalisering av hero og forsidebilder.
3. N3: «under 6 år»-trinn i veiviseren og én aldersgrense-kilde.
4. A9, A4 (rett «en rød varsel»), M4, A11: små tekst- og tilstandsfeil.
5. N6: «Bli med» i mobilens toppfelt og 44 px treffflater.

**Neste (medium)**
6. N4 + N5: treningsavgift per gruppe og søk med søkeord.
7. A1: «Mitt lag» for lagleder og omsortert navigasjon.
8. A3 + A4: bildemerking per bilde, klikkbar kontroll, tilgjengelige navn.
9. A2: Spond-tydelighet i Avlys og «Flytt denne gangen».
10. A7: personsidens rekkefølge og foresattvarsel.

**Deretter (større)**
11. M3: «Mitt barn»-startside for foresatte.
12. M1 + M2: «Neste for deg» på Aktiviteter og husket gruppevalg.
13. Brukertest med to–tre faktiske laglederne på telefon (A1–A5), og med to nye medlemmer på forsiden (N1, N3).

---

## 6. Hva som ikke er sett

Disse bør dekkes av en oppfølger: Nyheter og enkeltartikkel, Om klubben, Styret, Mallorca, Personvern og samtykkesiden, GA-banneret, mørk modus, Oslo Sportsklubb og flerlagsstrukturen, seksjonsadmin, innlogging med ekte e-postkode i produksjon, Spond-importen, tastaturnavigasjon og skjermleser, og ytelse målt i nettleseren (LCP, CLS). Ingen funn her hviler på brukertest.
