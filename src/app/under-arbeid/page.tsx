import type { Metadata, Viewport } from "next";
import { ClubCrest } from "@/components/public/crest";
import { loadSite } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Under arbeid", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

/** TEMPORARY (lib/holding.ts): shown on the club's own domain until the site is opened. */
export default async function HoldingPage() {
  const { db } = await loadSite();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-[var(--header-bg)]">
        <div className="flex h-20 items-center px-5 sm:px-10">
          <ClubCrest letters={db.club.shortName} logo={db.club.logo} tone="dark" className={db.club.logo === "wordmark" ? "h-7 w-auto" : "h-9 w-auto"} />
        </div>
      </header>
      <div aria-hidden className="h-1.5 bg-[var(--club-primary)]" />
      <main className="flex flex-1 items-center px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-xl">
          <p className="t-label font-semibold text-ink-3">{db.club.name}</p>
          <h1 className="mt-3 text-[2rem] leading-tight font-semibold tracking-[-0.02em] sm:text-[2.5rem]">Ny nettside på vei</h1>
          <p className="mt-4 text-ink-2">Vi gjør de siste justeringene før den nye nettsiden åpner. Kom tilbake om kort tid.</p>
        </div>
      </main>
    </div>
  );
}
