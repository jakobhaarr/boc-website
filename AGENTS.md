# Klubbnettside

Dette prosjektet er en interaktiv prototype av en nettsideplattform for norske
idrettsklubber. Demoen bruker de fiktive klubbene Oslo Sportsklubb og Bærum og
Omegn Cykleklubb.

## Prosjektregler

- Instruksjoner i denne filen gjelder foran instruksjoner fra overordnede mapper.
- Dette er ikke Strava-dashboardet i foreldremappen. Ikke innfør Strava-data,
  treningsanalyse eller regler fra dashboardprosjektet her.
- Bevar støtte for både fleridrettslag og klubber med én idrett.
- Bruk norsk bokmål i brukergrensesnittet, med mindre eksisterende innhold eller
  en konkret oppgave krever noe annet.
- Ikke presenter demodata som faktiske klubbdata. Nye eksempler skal passe inn i
  den eksisterende, fiktive datastrukturen.
- Bevar skillet mellom nettsidens publiserte ukerytme/terminliste og
  enkeltøkter, påmelding og sisteøyeblikksendringer i klubbens planleggingsverktøy.
- Alle skriveoperasjoner skal gå gjennom server actions med tilgangskontroll.
- Ta hensyn til personvernmodell og permanent anonymisering når personer,
  bilder eller redaksjonelt innhold endres.
- Følg det eksisterende designsystemet og klubbens temavariabler fremfor å
  hardkode farger eller lage parallelle UI-mønstre.
- Hold `README.md` oppdatert når arkitektur, demoruter eller sentrale
  produktvalg endres.
- Ikke installer pakker eller utfør eksterne handlinger uten å spørre først.
- Behandle denne filen som en beskyttet prosjektfil. Ikke slett, erstatt eller
  regenerer den som del av scaffolding eller oppsett.

## Teknisk oversikt

- Next.js 16 med App Router, React 19 og TypeScript.
- Tailwind CSS 4 og globale designtokens i `src/app/globals.css`.
- Typet mocklager i minnet i `src/lib/data/store.ts`, seedet fra
  `src/lib/data/seed/`.
- Offentlige sider ligger i `src/app/(public)/`; administrasjon ligger i
  `src/app/admin/`.
- Server actions ligger i `src/app/actions.ts`, og tilgangsregler i
  `src/lib/permissions.ts`.
- Prosjektet kjøres lokalt på port 3100 med `npm run dev`.

## Verifisering

- Les relevant dokumentasjon i `node_modules/next/dist/docs/` før endringer i
  Next.js-API-er eller konvensjoner.
- Kjør minst `npm run typecheck` etter kodeendringer.
- Kjør `npm run build` når endringen påvirker routing, rendering, konfigurasjon
  eller produksjonsbygget.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
