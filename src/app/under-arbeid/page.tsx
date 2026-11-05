import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { ClubCrest } from "@/components/public/crest";
import { loadSite } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Under arbeid", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

/** The road, in the picture's own coordinates. The light rides along the same curve (`.hold-rider` in globals.css). */
const ROAD = "M-40 330 C 160 330, 220 250, 400 258 S 640 330, 800 262 S 1060 150, 1240 170";

const HEADLINE = ["Noe", "nytt", "er", "på", "vei"];

/**
 * TEMPORARY (lib/holding.ts): shown on the club's own domain until the site is opened. A dark page in the club's
 * header colours with a road that draws itself and a light that rides along it; every motion stops with reduced motion.
 */
export default async function HoldingPage() {
  const { db } = await loadSite();
  const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
  return (
    <div className="page-dark relative isolate flex min-h-dvh flex-col overflow-hidden bg-[var(--background)] text-ink">
      <div aria-hidden className="hold-glow -top-40 -left-32 size-[34rem]" />
      <div aria-hidden className="hold-glow -right-40 bottom-0 size-[30rem] [animation-delay:-6s] [animation-direction:alternate-reverse]" />

      <svg aria-hidden viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[46vh] w-full">
        <path d={ROAD} pathLength={1} fill="none" stroke="var(--header-link)" strokeOpacity="0.9" strokeWidth="4" strokeLinecap="round" className="hold-road" />
        <path d={ROAD} fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2" className="hold-lane" />
        <g className="hold-rider">
          <circle r="22" fill="var(--header-link)" opacity="0.22" />
          <circle r="9" fill="var(--header-link)" />
          <circle r="3.5" fill="#ffffff" />
        </g>
      </svg>

      <header>
        <div className="flex h-20 items-center px-5 sm:px-10">
          <ClubCrest letters={db.club.shortName} logo={db.club.logo} tone="dark" className={db.club.logo === "wordmark" ? "h-7 w-auto" : "h-9 w-auto"} />
        </div>
      </header>

      <main className="flex flex-1 items-center px-5 pt-6 pb-[34vh] sm:px-10">
        <div className="mx-auto w-full max-w-3xl">
          <p className="hold-fade inline-flex items-center gap-2.5 rounded-full border border-line bg-surface px-3.5 py-1.5 t-small font-medium text-ink-2" style={delay(150)}>
            <span aria-hidden className="hold-dot size-2.5 rounded-full bg-[var(--header-link)]" />
            Åpner snart
          </p>
          <h1 className="mt-6 text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.03em] sm:text-[4.5rem]">
            {HEADLINE.map((w, i) => (
              <span key={w} className={w === "nytt" ? "hold-word hold-accent" : "hold-word"} style={{ "--i": i } as CSSProperties}>
                {w}
                {i < HEADLINE.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
          <p className="hold-fade mt-6 max-w-xl text-lg text-ink-2 sm:text-xl" style={delay(1100)}>
            Vi bygger en ny nettside for {db.club.name}, der du finner treningene, nyhetene og veien inn i klubben på ett sted.
          </p>
        </div>
      </main>
    </div>
  );
}
