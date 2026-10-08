import { ArrowUpRight, FileText } from "lucide-react";
import { Section } from "@/components/ui/guides";
import { TextLink } from "@/components/ui/primitives";
import { formatDateFull } from "@/lib/dates";
import type { AnnualMeeting } from "@/lib/types";

const Doc = ({ doc }: { doc: AnnualMeeting["documents"][number] }) => (
  <a href={doc.href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 t-small font-medium text-club hover:text-club-hover">
    <FileText aria-hidden className="size-4" />
    {doc.label}
    <ArrowUpRight aria-hidden className="size-3.5" />
  </a>
);

/**
 * The annual meetings as a part of another page (Styret, Om klubben): one line per year with its date and the two
 * documents, newest first, and the way on to /årsmøter for the decisions and the elections.
 */
export function AnnualMeetingsSection({ meetings, tone = "default" }: { meetings: AnnualMeeting[]; tone?: "default" | "sunken" }) {
  if (meetings.length === 0) return null;
  return (
    <Section id="arsmoter" labelledBy="arsmoter-tittel" tone={tone} rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
      <div className="page grid-page gap-y-8">
        <div className="col-span-4 md:col-span-8 lg:col-span-3">
          <p className="t-eyebrow">Årsmøter</p>
          <h2 id="arsmoter-tittel" className="mt-3 t-h2">
            Sakspapirer og protokoller
          </h2>
          <p className="mt-4 t-small text-ink-2">Årsmøtet er klubbens øverste organ. Det godkjenner årsberetning og regnskap, fastsetter kontingenten og velger styret.</p>
          <TextLink href="/årsmøter" className="mt-4 t-small">
            Vedtak og styrevalg per år
          </TextLink>
        </div>
        <ul className="col-span-4 md:col-span-8 lg:col-span-9 lg:col-start-4">
          {meetings.map((m) => (
            <li key={m.year} className="grid gap-x-6 gap-y-2 border-t border-guide py-4 last:border-b sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-baseline">
              <span className="font-display text-[1.5rem] leading-none font-medium tracking-[-0.012em] text-club tnum">{m.year}</span>
              <span className="t-small text-ink-2">
                {formatDateFull(m.date)}
                {m.place ? `, ${m.place}` : ""}
              </span>
              <span className="flex flex-wrap gap-x-5 gap-y-1">
                {m.documents.map((d) => (
                  <Doc key={d.label} doc={d} />
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/** One meeting in full on /årsmøter: when, who could vote, the documents, what was decided and who was elected. */
export function AnnualMeetingCard({ meeting: m }: { meeting: AnnualMeeting }) {
  return (
    <article id={String(m.year)} aria-labelledby={`arsmote-${m.year}`} className="scroll-mt-[var(--header-h)] border-t border-guide pt-8">
      <div className="grid-page gap-y-6">
        <div className="col-span-4 md:col-span-8 lg:col-span-3">
          <h2 id={`arsmote-${m.year}`} className="font-display text-[2.5rem] leading-none font-medium tracking-[-0.022em] text-club tnum">
            {m.year}
          </h2>
          <p className="mt-3 t-small text-ink-2">
            {formatDateFull(m.date)}
            {m.place ? `, ${m.place}` : ""}
          </p>
          <p className="mt-1 t-small text-ink-3">{m.attendance}</p>
          <div className="mt-4 flex flex-col gap-2">
            {m.documents.map((d) => (
              <Doc key={d.label} doc={d} />
            ))}
          </div>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-4">
          <h3 className="t-label font-semibold">Dette ble vedtatt</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 t-body text-ink-2">
            {m.decisions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:col-start-9">
          <h3 className="t-label font-semibold">Styret som ble valgt</h3>
          <ul className="mt-3 space-y-1.5 t-small">
            {m.board.map((b) => (
              <li key={`${b.role}-${b.name}`} className="flex justify-between gap-3 border-b border-line pb-1.5">
                <span>
                  <span className="text-ink">{b.name}</span> <span className="text-ink-3">{b.role.toLowerCase()}</span>
                </span>
                {b.term && <span className="shrink-0 text-ink-3">{b.term}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
