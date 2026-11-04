import type { Metadata } from "next";
import Image from "next/image";
import bocWhite from "@/components/assets/BOC-white.png";
import qrSignup from "@/components/assets/qr-bli-gruppeleder.svg";
import { Deck, type DeckSlide } from "@/components/deck/deck";
import { Bullets, Frame, Slants, Slashes, Step } from "@/components/deck/parts";
import { formatDayMonth } from "@/lib/dates";
import { TASKS_UNTIL } from "@/lib/leader-tasks";

export const metadata: Metadata = { title: "Gruppeleder på nettsiden", robots: { index: false, follow: false } };

/**
 * TEMPORARY (lib/leader-tasks.ts): the deck shown to the group leaders at their meeting on 4 November 2026, for them
 * to follow along and for the recording of it. Always dark, like the club's other decks (components/deck). It gives the
 * way in (/bli-gruppeleder, the e-mailed code), the two tasks and where feedback goes. Not listed on /presentasjoner.
 * Remove it with the rest of the temporary code when the round is over.
 */

const EYEBROW = "BOC · Gruppeledermøte";
const SIGNUP = "boc.jakobjolstad.com/bli-gruppeleder";
const LOGIN = "boc.jakobjolstad.com/logg-inn";

/**
 * The QR code for https://boc.jakobjolstad.com/bli-gruppeleder, made once with macOS's own generator (CIQRCodeGenerator,
 * level M) and checked by decoding it again; a static file, so nothing is made or sent at runtime. It has its own white
 * quiet zone. If the address changes, make a new one.
 */
function Qr({ size }: { size: number }) {
  return <Image src={qrSignup} alt="QR-kode til siden der du blir gruppeleder" width={size} height={size} className="rounded-lg" unoptimized />;
}

/** The address as a big link, the one thing people need to type in. */
function Address({ url, size = 64 }: { url: string; size?: number }) {
  return (
    <a href={`https://${url}`} className="inline-block rounded-lg bg-surface px-10 py-6 font-display font-medium tracking-[-0.015em] text-[var(--club-primary)] ring-1 ring-line" style={{ fontSize: size }}>
      {url}
    </a>
  );
}

export default function GroupLeaderDeck() {
  const until = formatDayMonth(TASKS_UNTIL);

  const slides: DeckSlide[] = [
    {
      id: "tittel",
      tone: "dark",
      title: "Gruppeleder på nettsiden",
      content: (
        <>
          <Slants />
          <Slashes className="h-72" />
          <div className="relative flex h-full flex-col justify-end px-[120px] pb-[120px]">
            <Image src={bocWhite} alt="BOC" className="mb-14 h-14 w-auto self-start" />
            <p className="text-[26px] font-semibold tracking-[0.14em] text-[var(--club-primary)] uppercase">Gruppeledermøte</p>
            <h2 className="mt-5 max-w-[1250px] font-display text-[112px] leading-[0.98] font-medium tracking-[-0.022em]">Din gruppe på nettsiden.</h2>
            <p className="mt-8 text-[34px] text-ink-2">Slik kommer du inn, og de to oppgavene du får de neste to ukene.</p>
          </div>
        </>
      ),
    },
    {
      id: "kom-inn",
      tone: "dark",
      title: "Slik kommer du inn",
      content: (
        <Frame eyebrow={EYEBROW} title="Slik kommer du inn." muted="Det tar ett minutt." logo={bocWhite}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-16">
            <div className="grid gap-10">
              <div>
                <p className="mb-5 text-[26px] text-ink-2">Skann koden, eller skriv adressen:</p>
                <Address url={SIGNUP} size={52} />
              </div>
              <div className="grid gap-5">
                <Step n={1}>Skriv navn og e-postadressen din.</Step>
                <Step n={2}>Velg gruppa du er ansvarlig for.</Step>
                <Step n={3}>Skriv inn koden du får på e-post.</Step>
              </div>
            </div>
            <Qr size={380} />
          </div>
        </Frame>
      ),
    },
    {
      id: "koden",
      tone: "dark",
      title: "Koden på e-post",
      content: (
        <Frame eyebrow={EYEBROW} title="Koden kommer på e-post." muted="Sjekk spam." size={68} logo={bocWhite}>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-20">
            <div>
              {/* An example of the six digits the sign-in sends; not a real code. */}
              <p className="text-[24px] text-ink-3">Seks siffer, slik som dette (eksempel):</p>
              <div className="mt-5 flex gap-4" aria-hidden>
                {["4", "8", "2", "1", "7", "5"].map((d, i) => (
                  <span key={i} className="flex h-[120px] w-[88px] items-center justify-center rounded-lg bg-surface font-display text-[64px] font-medium ring-1 ring-line">
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <Bullets
              items={[
                <>
                  Kommer ikke e-posten? Se i <strong className="font-semibold">spam-mappen</strong> (søppelpost).
                </>,
                <>
                  Du får en <strong className="font-semibold">ny kode hver gang</strong> du logger inn.
                </>,
                "Ingen passord å huske.",
              ]}
            />
          </div>
        </Frame>
      ),
    },
    {
      id: "logge-inn",
      tone: "dark",
      title: "Slik logger du inn neste gang",
      content: (
        <Frame eyebrow={EYEBROW} title="Neste gang." muted="Samme vei inn." logo={bocWhite}>
          <div className="grid gap-10">
            <div>
              <p className="mb-5 text-[26px] text-ink-2">Logg inn her:</p>
              <Address url={LOGIN} size={56} />
            </div>
            <div className="grid gap-5">
              <Step n={1}>Skriv e-postadressen du registrerte deg med.</Step>
              <Step n={2}>Vi sender en ny kode. Sjekk spam-mappen om den ikke kommer.</Step>
              <Step n={3}>Skriv inn koden, så er du inne.</Step>
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "oppgaver",
      tone: "brand",
      title: "To oppgaver",
      content: (
        <>
          <Slants />
          <div className="relative flex h-full flex-col justify-center px-[120px]">
            <p className="text-[26px] font-semibold tracking-[0.14em] uppercase opacity-70">Innen {until}</p>
            <h2 className="mt-5 font-display text-[112px] leading-[1] font-medium tracking-[-0.022em]">To oppgaver.</h2>
            <ol className="mt-14 space-y-8 text-[44px] leading-[1.2] font-medium tracking-[-0.012em]">
              <li className="flex items-center gap-8">
                <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[var(--club-on-primary)] font-display text-[40px] font-semibold text-[var(--club-primary)]">1</span>
                Inviter en bidragsyter til gruppa.
              </li>
              <li className="flex items-center gap-8">
                <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[var(--club-on-primary)] font-display text-[40px] font-semibold text-[var(--club-primary)]">2</span>
                Publiser en nyhet fra mobilen.
              </li>
            </ol>
          </div>
        </>
      ),
    },
    {
      id: "oppgave-1",
      tone: "dark",
      title: "Oppgave 1: inviter en bidragsyter",
      content: (
        <Frame eyebrow={`${EYEBROW} · Oppgave 1`} title="Inviter en bidragsyter." logo={bocWhite} size={72}>
          <div className="grid gap-6">
            <Step n={1}>Åpne «Brukere og tilgang», eller trykk «Inviter bidragsyter» på oversikten.</Step>
            <Step n={2}>Trykk «Inviter bruker», og skriv navn og e-post.</Step>
            <Step n={3}>Velg gruppa di, og bestem selv hva personen skal få lov til.</Step>
            <Step n={4}>Trykk «Inviter». Personen får en e-post og logger inn med kode, som du.</Step>
          </div>
          <p className="mt-10 max-w-[1150px] text-[26px] leading-[1.4] text-ink-3">Du kan aldri gi mer tilgang enn du har selv. Du kan endre eller ta bort tilgangen senere.</p>
        </Frame>
      ),
    },
    {
      id: "oppgave-2",
      tone: "dark",
      title: "Oppgave 2: publiser en nyhet fra mobilen",
      content: (
        <Frame eyebrow={`${EYEBROW} · Oppgave 2`} title="Publiser en nyhet fra mobilen." logo={bocWhite} size={68}>
          <div className="grid gap-6">
            <Step n={1}>Logg inn på mobilen, og trykk plusstegnet nederst.</Step>
            <Step n={2}>Skriv nyheten til gruppa di, og legg til et bilde hvis du har et.</Step>
            <Step n={3}>Trykk «Publiser». Så står den på gruppesiden.</Step>
          </div>
          <p className="mt-10 max-w-[1150px] text-[26px] leading-[1.4] text-ink-3">Er personer med på bildet, spør nettsiden dem om lov på e-post før bildet vises.</p>
        </Frame>
      ),
    },
    {
      id: "tilbakemelding",
      tone: "dark",
      title: "Gi tilbakemelding",
      content: (
        <Frame eyebrow={EYEBROW} title="Si fra underveis." muted="Hvor som helst." logo={bocWhite}>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-20">
            <Bullets
              items={[
                "Trykk «Tilbakemelding» nederst til høyre, på hvilken side som helst.",
                "Skriv hva som var uklart, og legg ved skjermbilde hvis du vil vise det.",
                "Send så mange du vil. Jeg leser alt.",
              ]}
            />
            <div className="justify-self-center">
              <span className="inline-flex items-center gap-4 rounded-full bg-[var(--ink)] px-12 py-7 text-[40px] font-medium text-[var(--background)]">Tilbakemelding</span>
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "slutt",
      tone: "dark",
      title: "Kom i gang",
      content: (
        <>
          <Slants />
          <Slashes className="h-72" />
          <div className="relative flex h-full flex-col justify-end px-[120px] pb-[120px]">
            <Image src={bocWhite} alt="BOC" className="mb-14 h-14 w-auto self-start" />
            <p className="text-[26px] font-semibold tracking-[0.14em] text-[var(--club-primary)] uppercase">Kom i gang nå</p>
            <h2 className="mt-5 font-display text-[88px] leading-[1] font-medium tracking-[-0.022em]">Lag brukeren din.</h2>
            <div className="mt-10">
              <Address url={SIGNUP} size={60} />
            </div>
            <div className="absolute right-[120px] bottom-[120px]">
              <Qr size={340} />
            </div>
            <p className="mt-8 max-w-[1000px] text-[30px] text-ink-2">Koden kommer på e-post. Sjekk spam-mappen. Oppgavene skal være gjort innen {until}.</p>
          </div>
        </>
      ),
    },
  ];

  return <Deck slides={slides} title="Gruppeleder på nettsiden" />;
}
