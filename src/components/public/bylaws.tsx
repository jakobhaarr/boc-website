import { ArrowUpRight, FileText } from "lucide-react";
import { Section } from "@/components/ui/guides";
import { TextLink } from "@/components/ui/primitives";
import { formatDateFull } from "@/lib/dates";
import type { Bylaws } from "@/lib/types";

/**
 * The bylaws as a part of another page (Styret, Om klubben): when they were last revised, the way into the full text
 * on /vedtekter, and the club's own PDF.
 */
export function BylawsSection({ bylaws, tone = "default" }: { bylaws: Bylaws; tone?: "default" | "sunken" }) {
  return (
    <Section id="vedtekter" labelledBy="vedtekter-tittel" tone={tone} rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
      <div className="page grid-page gap-y-8">
        <div className="col-span-4 md:col-span-8 lg:col-span-3">
          <p className="t-eyebrow">Vedtekter</p>
          <h2 id="vedtekter-tittel" className="mt-3 t-h2">
            Lov for klubben
          </h2>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-8 lg:col-start-4">
          <p className="max-w-[62ch] t-body text-ink-2">
            Klubbens lov bygger på idrettens lovnorm. Den sier hvordan årsmøtet og styret arbeider, hvordan gruppene styres, og hva som gjelder om lovendring og oppløsning. Sist revidert på årsmøtet {formatDateFull(bylaws.revised)}.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <TextLink href="/vedtekter" className="t-small">
              Les vedtektene
            </TextLink>
            <a href={bylaws.pdf} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 t-small font-medium text-club hover:text-club-hover">
              <FileText aria-hidden className="size-4" />
              Last ned som PDF
              <ArrowUpRight aria-hidden className="size-3.5" />
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}

/** The whole text on /vedtekter: a contents list beside the sections, each with its § in the club's colour, then the record of the latest change. */
export function BylawsText({ bylaws }: { bylaws: Bylaws }) {
  return (
    <div className="page grid-page gap-y-10 pt-10">
      <nav aria-label="Innhold" className="col-span-4 md:col-span-8 lg:col-span-3">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
          <p className="t-label font-semibold">Innhold</p>
          <ol className="mt-3 grid gap-1.5 t-small">
            {bylaws.sections.map((s) => (
              <li key={s.n}>
                <a href={`#paragraf-${s.n}`} className="flex gap-2 text-ink-2 hover:text-ink">
                  <span className="w-9 shrink-0 text-ink-3 tnum">§ {s.n}</span>
                  {s.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#endringer" className="flex gap-2 text-ink-2 hover:text-ink">
                <span className="w-9 shrink-0 text-ink-3" />
                Siste endring
              </a>
            </li>
          </ol>
        </div>
      </nav>

      <div className="col-span-4 md:col-span-8 lg:col-span-8 lg:col-start-5">
        <div className="grid gap-12">
          {bylaws.sections.map((s) => (
            <section key={s.n} id={`paragraf-${s.n}`} aria-labelledby={`p-${s.n}`} className="scroll-mt-[calc(var(--header-h)+1.5rem)] border-t border-guide pt-6">
              <h2 id={`p-${s.n}`} className="flex items-baseline gap-4 t-h3">
                <span className="font-display text-[1.75rem] leading-none font-medium tracking-[-0.012em] text-club tnum">§ {s.n}</span>
                {s.title}
              </h2>
              <div className="mt-4 max-w-[68ch] space-y-3 t-body text-ink-2">
                {s.clauses.map((c, i) => (
                  <div key={i} className={c.no ? "grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-2" : undefined}>
                    {c.no && <span className="text-ink-3 tnum">{c.no}</span>}
                    <div className="space-y-2">
                      {c.text && <p>{c.text}</p>}
                      {c.items && (
                        <ol className="list-decimal space-y-1.5 pl-5 marker:text-ink-3">
                          {c.items.map((it) => (
                            <li key={it.text} className="pl-1">
                              {it.text}
                              {it.sub && (
                                <ol className="mt-1.5 list-[lower-alpha] space-y-1 pl-5 marker:text-ink-3">
                                  {it.sub.map((x) => (
                                    <li key={x} className="pl-1">
                                      {x}
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </li>
                          ))}
                        </ol>
                      )}
                      {c.after && <p>{c.after}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section id="endringer" aria-labelledby="endringer-tittel" className="scroll-mt-[calc(var(--header-h)+1.5rem)] rounded-xl bg-sunken p-6 ring-1 ring-line sm:p-8">
            <h2 id="endringer-tittel" className="t-h3">
              Endringsprotokoll
            </h2>
            <p className="mt-2 t-small font-medium text-ink">{bylaws.amendment.adopted}</p>
            <p className="mt-3 max-w-[68ch] t-body text-ink-2">{bylaws.amendment.intro}</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 t-body text-ink-2 marker:text-ink-3">
              {bylaws.amendment.changes.map((c) => (
                <li key={c} className="pl-1">
                  {c}
                </li>
              ))}
            </ol>
            <p className="mt-3 t-body text-ink-2">{bylaws.amendment.effect}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
