import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import bocMain from "@/components/assets/BOC-main.png";
import bocWhite from "@/components/assets/BOC-white.png";
import { Deck, PrintDeck, type DeckSlide } from "@/components/deck/deck";
import { Frame, Slants } from "@/components/deck/parts";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Innspill til strategien 2027–2030", robots: { index: false, follow: false } };

/**
 * Jakob's contribution to BOC's strategy for 2027–2030: five slides to support a spoken discussion, not to be read.
 * The challenge (recruiting adults of 20–40), a social model alongside today's training groups, open low-threshold
 * events as a way in (Bulltempoen as the main example), a proposed pilot budget for marketing, and a way of working
 * that ends on the question to the meeting.
 *
 * Facts and figures: the member counts (about 1 000 ten years ago, about 600 today) are approximate figures given by
 * the club, shown as such; the bars are drawn to their ratio, and «ca. 40 % færre» is (1 000 − 600) / 1 000. There is
 * no documented age distribution, so the 20–40 group is shown as an impression, not a number. The budget (3 events ×
 * 5 000 kr = 15 000 kr) is a proposal, not a decision. What younger riders want is written as a possibility, not as
 * established fact.
 *
 * Responsibility: the slides are recommendations. The last one separates the strategic recommendation from the
 * operational work, which needs event leads appointed by the club; Jakob is not presented as running the effort.
 *
 * Built from the club's deck pieces (components/deck): dark slides with the Frame, and the last slide on the club's
 * yellow (tone "brand") with a dark block (.page-dark) for the question. Listed on /presentasjoner.
 */

const EYEBROW = "BOC · Strategi 2027–2030";

/** A dark card on the slide's surface, as on the club's other decks. */
function Card({ children, accent, compact, className }: { children: ReactNode; accent?: boolean; compact?: boolean; className?: string }) {
  return (
    <div className={cn("rounded-lg bg-surface px-10", compact ? "py-7" : "py-9", accent ? "ring-2 ring-[var(--club-primary)]" : "ring-1 ring-line", className)}>{children}</div>
  );
}

/** Small caps label, the eyebrow's style inside a card. */
function Label({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return <p className={cn("text-[20px] font-semibold tracking-[0.12em] uppercase", accent ? "text-[var(--club-primary)]" : "text-ink-3")}>{children}</p>;
}

function List({ items, size = 30 }: { items: string[]; size?: number }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-4 leading-[1.25] tracking-[-0.01em]" style={{ fontSize: size }}>
          <span aria-hidden className="mt-[0.45em] block size-2.5 shrink-0 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** One member count as a bar, its length in proportion to 1 000. */
function MemberBar({ label, value, now }: { label: string; value: number; now?: boolean }) {
  return (
    <div className="grid grid-cols-[260px_minmax(0,1fr)] items-center gap-8">
      <p className="text-[28px] text-ink-2">{label}</p>
      <div className="flex items-center gap-6">
        <div
          className={cn("flex h-[92px] items-center rounded-md px-7", now ? "bg-[var(--club-primary)] text-[var(--club-on-primary)]" : "bg-muted text-ink")}
          style={{ width: `${(value / 1000) * 100}%` }}
        >
          <span className="font-display text-[52px] font-medium tracking-[-0.015em] tabular-nums">ca. {value.toLocaleString("nb-NO")}</span>
        </div>
      </div>
    </div>
  );
}

export default async function StrategyDeck({ searchParams }: { searchParams: Promise<{ pdf?: string }> }) {
  const { pdf } = await searchParams;

  const slides: DeckSlide[] = [
    {
      id: "utfordringen",
      tone: "dark",
      title: "Hvor er neste generasjon BOC-medlemmer?",
      content: (
        <Frame eyebrow={`${EYEBROW} · Utfordringen`} title="Hvor er neste generasjon BOC-medlemmer?" size={72} logo={bocWhite}>
          <div className="grid h-full grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-12">
            <div className="flex flex-col justify-center gap-7">
              <Label>Medlemmer, omtrentlige tall</Label>
              <MemberBar label="For ti år siden" value={1000} />
              <MemberBar label="I dag" value={600} now />
              <p className="text-[26px] text-ink-3">Ca. 40 % færre medlemmer.</p>
            </div>
            <div className="flex flex-col gap-7">
              <Card accent>
                <Label accent>20–40 år</Label>
                <p className="mt-3 font-display text-[44px] leading-[1.1] font-medium tracking-[-0.015em]">Få av medlemmene er unge voksne.</p>
                <p className="mt-3 text-[22px] text-ink-3">Et inntrykk, ikke målt. Vi har ingen sikre tall på alder.</p>
              </Card>
              <p className="text-[30px] leading-[1.3] text-ink-2">Treffer aktivitetene, møteplassene og kommunikasjonen vår denne gruppa?</p>
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "sykkelmiljo",
      tone: "dark",
      title: "Folk kommer for syklingen. De blir for miljøet.",
      content: (
        <Frame eyebrow={`${EYEBROW} · Aktivitet`} title="Folk kommer for syklingen." muted="De blir for miljøet." size={64} logo={bocWhite}>
          <div className="flex h-full flex-col gap-6">
            <div className="grid flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-8">
              <Card compact>
                <Label>Det vi har i dag</Label>
                <p className="mt-1 mb-4 font-display text-[44px] font-medium tracking-[-0.015em]">Treningsgruppa</p>
                <List items={["Faste treningsgrupper", "Rullekjøring", "Konkurranse", "Etablert miljø"]} size={27} />
              </Card>
              <div aria-hidden className="flex items-center font-display text-[96px] leading-none font-medium text-[var(--club-primary)]">
                +
              </div>
              <Card accent compact>
                <Label accent>Mulig tillegg</Label>
                <p className="mt-1 mb-4 font-display text-[44px] font-medium tracking-[-0.015em]">Sykkelmiljøet</p>
                <List items={["Sosiale fellesturer", "Fellesstarter", "Lavterskelkonkurranser", "Sosiale møteplasser", "Åpent for ikke-medlemmer"]} size={27} />
              </Card>
            </div>
            <p className="text-[32px] leading-[1.25] tracking-[-0.01em]">
              Vi beholder det vi har, <span className="text-ink-3">og bygger noe i tillegg for nye målgrupper.</span>
            </p>
          </div>
        </Frame>
      ),
    },
    {
      id: "apne-arrangementer",
      tone: "dark",
      title: "Gi folk en grunn til å komme før de melder seg inn",
      content: (
        <Frame eyebrow={`${EYEBROW} · Rekruttering`} title="Gi folk en grunn til å komme" muted="før de melder seg inn." size={72} logo={bocWhite}>
          <div className="grid h-full grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-10">
            <Card accent className="flex flex-col">
              <Label accent>Hovedeksempel</Label>
              <p className="mt-2 font-display text-[80px] leading-[1] font-medium tracking-[-0.02em]">Bulltempoen</p>
              <p className="mt-5 text-[30px] text-ink-2">Bakketempo, enkel tidtaking og grillmat.</p>
              <p className="mt-2 text-[30px] text-ink-2">Åpent for alle, også ikke-medlemmer.</p>
              {/* What the events are for, as three steps. */}
              <div className="mt-auto flex items-center gap-4 pt-8 text-[26px] font-medium">
                {["Interesse", "Relasjoner", "Fast gruppe"].map((step, i) => (
                  <div key={step} className="flex items-center gap-4">
                    {i > 0 && (
                      <span aria-hidden className="text-[var(--club-primary)]">
                        →
                      </span>
                    )}
                    <span className="rounded-md bg-muted px-5 py-2.5">{step}</span>
                  </div>
                ))}
              </div>
            </Card>
            <div className="flex flex-col gap-8">
              <div>
                <p className="font-display text-[120px] leading-[0.9] font-medium tracking-[-0.03em] text-[var(--club-primary)]">3</p>
                <p className="mt-3 text-[32px] leading-[1.2]">åpne lavterskelarrangementer som test i 2027</p>
              </div>
              <div>
                <Label>Andre mulige konsepter</Label>
                <div className="mt-4">
                  <List items={["Social Ride med flere fartsgrupper", "Uformelt klubbmesterskap", "Grillmat, premier og lokale sykkelbutikker"]} size={28} />
                </div>
              </div>
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "markedsforing",
      tone: "dark",
      title: "Synlighet utenfor dagens medlemsmasse",
      content: (
        <Frame eyebrow={`${EYEBROW} · Kommunikasjon`} title="Synlighet utenfor" muted="dagens medlemsmasse." size={72} logo={bocWhite}>
          <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-8">
            <Card accent className="flex flex-col">
              <Label accent>Forslag til pilotbudsjett</Label>
              {/* Three equal blocks of 5 000 kr adding up to 15 000 kr. */}
              <div className="mt-6 grid gap-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-baseline justify-between rounded-md bg-muted px-5 py-3 text-[26px]">
                    <span className="text-ink-2">Arrangement {n}</span>
                    <span className="font-medium tabular-nums">5 000 kr</span>
                  </div>
                ))}
              </div>
              <p className="mt-auto pt-6 font-display text-[64px] leading-none font-medium tracking-[-0.02em] tabular-nums">15 000 kr</p>
              <p className="mt-3 text-[22px] text-ink-3">Et forslag, ikke vedtatt.</p>
            </Card>
            <Card>
              <Label>Annonsering</Label>
              <div className="mt-6">
                <List items={["Instagram og Facebook", "Oslo, Bærum og Asker", "Ekte bilder og korte videoer", "Enkel påmelding på nettsiden"]} size={26} />
              </div>
              <p className="mt-8 text-[26px] leading-[1.3] font-medium">Godt innhold betyr mer enn store beløp.</p>
            </Card>
            <Card>
              <Label>Slik måler vi</Label>
              <div className="mt-6">
                <List items={["Påmeldte", "Faktiske deltakere", "Andel ikke-medlemmer", "Nye medlemskap", "Deltar på senere aktiviteter"]} size={26} />
              </div>
            </Card>
          </div>
        </Frame>
      ),
    },
    {
      id: "handling",
      tone: "brand",
      title: "Små eksperimenter. Målbare resultater.",
      content: (
        <>
          <Slants />
          <Image src={bocMain} alt="" className="absolute top-[104px] right-[120px] h-9 w-auto" />
          <div className="relative flex h-full flex-col px-[120px] pt-[110px] pb-[96px]">
            <p className="text-[22px] font-semibold tracking-[0.12em] uppercase">{EYEBROW} · Fra strategi til handling</p>
            <h2 className="mt-5 font-display text-[72px] leading-[1.04] font-medium tracking-[-0.019em]">Små eksperimenter. Målbare resultater.</h2>
            <ol className="mt-12 grid grid-cols-6 gap-4">
              {[
                ["Styret vedtar en avgrenset pilot", ""],
                ["Klubben utpeker arrangements­ansvarlige", ""],
                ["Nettsiden og markedsføringen tas i bruk", ""],
                ["Arrangementene gjennomføres", "2027"],
                ["Resultatene evalueres", "Høsten 2027"],
                ["Det som virker, videreføres", "2028–2030"],
              ].map(([text, when], i) => (
                <li key={text} className="flex flex-col rounded-lg bg-[var(--club-on-primary)]/8 px-5 py-6">
                  <span className="font-display text-[48px] leading-none font-semibold">{i + 1}</span>
                  <span className="mt-4 text-[24px] leading-[1.25] font-medium">{text}</span>
                  {when && <span className="mt-auto pt-4 text-[19px] font-semibold tracking-[0.08em] uppercase opacity-70">{when}</span>}
                </li>
              ))}
            </ol>
            {/* The recommendation and the work it takes, kept apart: the slides recommend, the club appoints people to run it. */}
            <div className="mt-8 grid grid-cols-2 gap-4 text-[26px] leading-[1.3]">
              <p>
                <strong className="font-semibold">Strategisk anbefaling:</strong> hva vi tester, og hvorfor.
              </p>
              <p>
                <strong className="font-semibold">Operativt ansvar:</strong> egne arrangementsansvarlige, utpekt av klubben.
              </p>
            </div>
            <div className="page-dark mt-auto rounded-lg px-12 py-10">
              <p className="font-display text-[64px] leading-[1.1] font-medium tracking-[-0.018em]">Hva kan vi forplikte oss til å teste i 2027?</p>
            </div>
          </div>
        </>
      ),
    },
  ];

  // ?pdf is the page the PDF is made from (scripts/make-pdf.sh): every slide in turn, one per page.
  if (pdf !== undefined) return <PrintDeck slides={slides} title="Innspill til strategien 2027–2030" />;
  return <Deck slides={slides} title="Innspill til strategien 2027–2030" pdfHref="/pdf/boc-strategi-2027-2030.pdf" />;
}
