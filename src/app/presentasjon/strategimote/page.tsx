import type { Metadata } from "next";
import Image from "next/image";
import bocMain from "@/components/assets/BOC-main.png";
import bocWhite from "@/components/assets/BOC-white.png";
import { Deck, PrintDeck, type DeckSlide } from "@/components/deck/deck";
import { Frame, Slants } from "@/components/deck/parts";

export const metadata: Metadata = { title: "Innspill til strategimøtet", robots: { index: false, follow: false } };

/**
 * Jakob's two slides for BOC's strategy meeting on 19 November 2026: a two-minute contribution to Steinar's draft
 * strategy, which the group already has in front of it (so no title, agenda or summary). Slide 1 ties the Zwift
 * sessions to goal 1 and ends on a proposed line for the strategy; slide 2 ties the first ride to goal 3 and leaves
 * the BOC4 question open for discussion. «Rundt 25 faste deltakere» describes the group, not turnout per session.
 *
 * The same two slides are in public/pdf/boc-strategimote-2026-11-19.pptx, built on the club's PowerPoint template
 * (public/maler/BOC-presentasjonsmal.pptx), and that file carries the speaker notes; the web deck has no notes.
 * Slide 1 is dark like the club's other decks, slide 2 is on the club's yellow (tone "brand"), as the template's
 * «Gul» layout for the one point that should stand out. Listed on /presentasjoner.
 */

const EYEBROW = "BOC · Strategimøte";

export default async function StrategyMeetingDeck({ searchParams }: { searchParams: Promise<{ pdf?: string }> }) {
  const { pdf } = await searchParams;

  const slides: DeckSlide[] = [
    {
      id: "zwift",
      tone: "dark",
      title: "Zwift er allerede en del av helårstilbudet",
      content: (
        <Frame eyebrow={`${EYEBROW} · Mål 1`} title="Zwift er allerede en del av helårstilbudet." size={72} logo={bocWhite}>
          <div className="grid gap-10">
            <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-8">
              <div className="rounded-lg bg-surface px-12 py-12 ring-1 ring-line">
                <p className="font-display text-[64px] leading-[1.05] font-medium tracking-[-0.015em]">Mandag og onsdag kl. 19</p>
                <p className="mt-4 text-[36px] text-ink-2">Fellesøkter fra november til mars</p>
              </div>
              <div className="rounded-lg bg-surface px-12 py-12 ring-1 ring-line">
                <p className="font-display text-[64px] leading-[1.05] font-medium tracking-[-0.015em]">Rundt 25</p>
                <p className="mt-4 text-[36px] text-ink-2">faste deltakere</p>
              </div>
            </div>
            <div className="rounded-lg bg-surface px-12 py-11 ring-2 ring-[var(--club-primary)]">
              <p className="text-[22px] font-semibold tracking-[0.12em] text-[var(--club-primary)] uppercase">Mitt forslag til strategitekst</p>
              <p className="mt-4 font-display text-[50px] leading-[1.1] font-medium tracking-[-0.015em]">«BOC tilbyr faste fellesøkter på Zwift gjennom vinteren.»</p>
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "forste-tur",
      tone: "brand",
      title: "Hva gjør det lettere å bli med på første tur?",
      content: (
        <>
          <Slants />
          <Image src={bocMain} alt="" className="absolute top-[104px] right-[120px] h-9 w-auto" />
          <div className="relative flex h-full flex-col px-[120px] pt-[110px] pb-[96px]">
            <p className="text-[22px] font-semibold tracking-[0.12em] uppercase">{EYEBROW} · Mål 3: flere medlemmer med på aktivitet</p>
            <h2 className="mt-5 max-w-[1200px] font-display text-[72px] leading-[1.04] font-medium tracking-[-0.019em]">Hva gjør det lettere å bli med på første tur?</h2>
            {/* The question gets the most room: a dark block on the yellow, with the dark tokens of .page-dark. */}
            <div className="page-dark mt-12 flex flex-1 items-center rounded-lg px-14 py-10">
              <p className="font-display text-[60px] leading-[1.12] font-medium tracking-[-0.018em]">
                Kan vi spørre noen som begynte å sykle med BOC4, hva som gjorde at de møtte opp første gang?
              </p>
            </div>
            <p className="mt-8 text-[34px] leading-[1.25] tracking-[-0.01em]">Jeg kan bruke svarene til å gjøre det lettere å finne riktig gruppe på den nye nettsiden.</p>
          </div>
        </>
      ),
    },
  ];

  // ?pdf is the page the PDF is made from (scripts/make-pdf.sh): every slide in turn, one per page.
  if (pdf !== undefined) return <PrintDeck slides={slides} title="Innspill til strategimøtet" />;
  return <Deck slides={slides} title="Innspill til strategimøtet" pdfHref="/pdf/boc-strategimote-2026-11-19.pdf" />;
}
