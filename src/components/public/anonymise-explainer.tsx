"use client";

import { useState } from "react";
import { CensorDemo } from "@/components/deck/censor-demo";
import { cn } from "@/lib/cn";

/**
 * «Slik fungerer anonymisering»: what happens to a person in pictures and
 * articles when they ask not to be recognised, shown on made-up examples, with
 * a switch between before and after. The three places are the three the club's
 * register changes (lib/privacy.ts): pictures, text, and everything else that
 * names someone. Everything on it is marked as an example.
 */
const TABS = [
  { id: "bilder", label: "Bilder" },
  { id: "artikler", label: "Artikler" },
  { id: "ellers", label: "Lister og adresser" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function AnonymiseExplainer({ photoSrc }: { photoSrc: string }) {
  const [tab, setTab] = useState<Tab>("bilder");
  const [after, setAfter] = useState(false);

  return (
    <div className="rounded-lg bg-surface p-5 shadow-card ring-1 ring-line sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Hva anonymiseringen gjelder" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "h-9 rounded-md border px-3 t-small font-medium transition-colors",
                tab === t.id ? "border-inverse bg-inverse text-ink-inverse" : "border-line-strong bg-surface text-ink hover:border-ink-3",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Før eller etter" className="inline-flex rounded-md border border-line-strong p-0.5">
          {([false, true] as const).map((v) => (
            <button
              key={String(v)}
              type="button"
              aria-pressed={after === v}
              onClick={() => setAfter(v)}
              className={cn("h-8 rounded-[5px] px-3 t-small font-medium transition-colors", after === v ? "bg-inverse text-ink-inverse" : "text-ink-2 hover:text-ink")}
            >
              {v ? "Etter" : "Før"}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" className="mt-5 grid items-start gap-6 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        {tab === "bilder" && (
          <>
            <div>
              <div className="overflow-hidden rounded-lg ring-1 ring-line">
                {after ? (
                  <CensorDemo src={photoSrc} regions={[{ x: 0.34, y: 0.12, w: 0.44, h: 0.4 }]} alt="Eksempelbilde der ansiktet er dekket av grov mosaikk" className="block h-auto w-full" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoSrc} alt="Eksempelbilde av en syklist" className="block h-auto w-full" />
                )}
              </div>
              <p className="mt-2 t-meta text-ink-3">Eksempelbilde</p>
            </div>
            <div className="space-y-3 t-body text-ink-2">
              <p>Personen dekkes til i bildet, og dette gjelder i alle bilder personen er merket i, også de som ble lagt ut for lenge siden.</p>
              <p>Er det ikke mulig å dekke personen til, tas bildet ned.</p>
            </div>
          </>
        )}

        {tab === "artikler" && (
          <>
            <p className="rounded-md bg-sunken px-4 py-4 t-body text-ink md:col-span-1">
              {after ? (
                <>
                  <span className="font-semibold">En av rytterne på BOC 1</span> satte pers på Enebakk Rundt.
                </>
              ) : (
                <>
                  <span className="font-semibold">Silje</span> satte pers på Enebakk Rundt og sa: «Jeg kom fra løping, og nå er tirsdag høydepunktet i uka.»
                </>
              )}
              <span className="mt-2 block t-meta font-normal text-ink-3">Eksempel</span>
            </p>
            <div className="space-y-3 t-body text-ink-2">
              <p>Navnet byttes ut med en nøytral formulering, for eksempel «en av rytterne på BOC 1». Det gjelder i tittel, ingress, tekst og bildetekster.</p>
              <p>Sitater fra personen tas bort helt.</p>
            </div>
          </>
        )}

        {tab === "ellers" && (
          <>
            <div className="rounded-md bg-sunken px-4 py-4 t-body text-ink">
              <p className="font-semibold">{after ? "Rytter" : "Silje Nordby"}</p>
              <p className="t-small text-ink-3">BOC 1</p>
              <p className="mt-3 break-all t-small text-ink-2">/nyheter/pers-paa-enebakk-rundt</p>
              <span className="mt-2 block t-meta text-ink-3">Eksempel</span>
            </div>
            <div className="space-y-3 t-body text-ink-2">
              <p>I lister over utøvere, trenere og aktiviteter byttes navnet ut med en nøytral betegnelse.</p>
              <p>Adressene til artiklene inneholder aldri navn, så de røper ikke hvem det var etterpå.</p>
            </div>
          </>
        )}
      </div>

      <ol className="mt-6 grid gap-3 border-t border-line pt-5 t-small text-ink-2 md:grid-cols-3">
        <li>
          <span className="font-semibold text-ink">1. Du ber om det.</span> Du trenger ikke å begrunne det. Skjemaet står rett under.
        </li>
        <li>
          <span className="font-semibold text-ink">2. Vi sjekker at det er deg.</span> For barn og andre sjekker vi at du kan be om det.
        </li>
        <li>
          <span className="font-semibold text-ink">3. Vi anonymiserer.</span> Alt over gjøres i gamle saker også. Det kan ikke angres.
        </li>
      </ol>
    </div>
  );
}
