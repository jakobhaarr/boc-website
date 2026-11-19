import type { Metadata } from "next";
import { ChevronDown, ListChecks, Target } from "lucide-react";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Approval, ApprovalSummary, GoalPanel, GoalsToggle, StrategyDiscussion, Thread, ThreadCount } from "@/components/public/strategy-discussion";
import { Section } from "@/components/ui/guides";
import { loadSite } from "@/lib/data/queries";
import {
  GENERAL,
  GOALS,
  goalHeading,
  goalOfPoint,
  IDEA,
  QUESTIONS,
  QUESTIONS_INTRO,
  STRATEGY,
  strategyPoints,
  VALUES,
  type StrategyGoal,
  type StrategyPoint,
} from "@/lib/strategy-2027-2030";
import { listApprovals, listComments } from "@/lib/strategy-comments";

/**
 * Working page for «Virksomhetsidé og strategi 2027–2030» (text in lib/strategy-2027-2030.ts, comments in
 * lib/strategy-comments.ts). Reached only by its link: it is in no menu, not in the site search (which is built from the
 * club's data, lib/search.ts) and the site has no sitemap or feed. Not indexed. Anyone with the link reads, comments and
 * approves the document as it is (STRATEGY.version). The six goals are folded by default (GoalPanel).
 */
export const metadata: Metadata = {
  title: "Strategi 2027–2030 (utkast)",
  description: "Utkast til virksomhetsidé og strategi 2027–2030 for Bærum og Omegn Cykleklubb, til diskusjon etter strategimøtet.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

/** Room for the sticky site header when a direct link lands on a point. */
const ANCHOR = "scroll-mt-[calc(var(--header-h)+1rem)]";

export default async function StrategyPage() {
  const { db } = await loadSite();
  if (db.club.id !== "boc") notFound();
  const [comments, approvals] = await Promise.all([
    listComments().catch((e) => {
      console.error("[strategi] kunne ikke hente kommentarene", e);
      return null;
    }),
    // Read on its own, so the page and its comments still work if this part fails.
    listApprovals().catch((e) => {
      console.error("[strategi] kunne ikke hente godkjenningene", e);
      return null;
    }),
  ]);
  const points = strategyPoints();
  const formerIds = Object.fromEntries(points.flatMap((p) => p.formerIds.map((f) => [f, p.id])));
  const label = (id: string) => points.find((p) => p.id === id)?.label ?? id;
  const goalOf = Object.fromEntries(points.flatMap((p) => [p.id, ...p.formerIds].map((id) => [id, goalOfPoint(p.id)] as const)).filter((e): e is [string, string] => !!e[1]));

  return (
    <StrategyDiscussion
      initial={comments ?? []}
      initialApprovals={approvals}
      loadFailed={comments === null}
      names={STRATEGY.names}
      pointIds={points.map((p) => p.id)}
      formerIds={formerIds}
      goalOf={goalOf}
      version={STRATEGY.version}
      versionLabel={STRATEGY.versionLabel}
    >
      <Section className="pb-8 lg:pb-12">
        <div className="page pt-6 lg:pt-10">
          <div className="max-w-[62ch]">
            <p className="t-eyebrow">{STRATEGY.club}</p>
            <h1 className="mt-3 t-h1">{STRATEGY.title}</h1>
            <p className="mt-4 inline-flex rounded-md bg-warning-surface px-3 py-1.5 t-small font-medium text-warning">{STRATEGY.draft}</p>
            <blockquote className="mt-6 border-l-2 border-club-surface pl-4 font-display text-[1.25rem] leading-snug text-ink">{STRATEGY.motto}</blockquote>
            <p className="mt-6 t-small text-ink-2">
              Teksten er ikke vedtatt. Trykk på et mål for å se delmål og tiltak, og «Kommenter» ved et punkt for å skrive hva du mener. Kan du stille deg bak teksten slik den
              står, kan du godkjenne den nederst på siden.
            </p>
            <div className="mt-2">
              <ApprovalSummary />
            </div>
          </div>
        </div>
      </Section>

      <Section rule="top" className="pb-20 lg:pb-28">
        <div className="page grid-page gap-y-8 pt-8 lg:pt-10">
          <nav aria-label="Innhold" className="col-span-4 md:col-span-8 lg:col-span-3">
            {/* A phone folds the contents away; a wide screen keeps them beside the text. */}
            <details className="group rounded-lg bg-sunken ring-1 ring-line lg:hidden">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 t-label font-semibold text-ink [&::-webkit-details-marker]:hidden">
                Innhold
                <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-3">
                <Contents />
              </div>
            </details>
            <div className="hidden lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:block">
              <p className="t-label font-semibold">Innhold</p>
              <div className="mt-2">
                <Contents />
              </div>
            </div>
          </nav>

          <article className="col-span-4 md:col-span-8 lg:col-span-8 lg:col-start-5">
            <div className="grid gap-14">
              <Block id={IDEA.id} heading={IDEA.heading}>
                {IDEA.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <Thread pointId={IDEA.id} label={label(IDEA.id)} />
              </Block>

              <Block id={VALUES.id} heading={VALUES.heading}>
                {VALUES.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <Thread pointId={VALUES.id} label={label(VALUES.id)} />
              </Block>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3 border-t border-guide pt-4">
                  <p className="t-label font-semibold text-ink-2">Seks målområder</p>
                  <GoalsToggle />
                </div>
                {GOALS.map((g) => (
                  <Goal key={g.id} goal={g} label={label} />
                ))}
              </div>

              <section id="apne-sporsmal" aria-labelledby="apne-sporsmal-tittel" className={`${ANCHOR} border-t border-guide pt-6`}>
                <h2 id="apne-sporsmal-tittel" className="t-h2">
                  Åpne spørsmål til videre behandling
                </h2>
                <p className="mt-4 max-w-[68ch] t-body text-ink-2">{QUESTIONS_INTRO}</p>
                <ol className="mt-8 grid gap-6">
                  {QUESTIONS.map((q, i) => {
                    const goal = GOALS.find((g) => g.id === q.goal)!;
                    return (
                      <li key={q.id} id={q.id} className={`${ANCHOR} rounded-xl bg-surface p-5 ring-1 ring-line sm:p-6 target:ring-2 target:ring-focus`}>
                        <h3 className="flex gap-3 t-h3 text-[1.0625rem]">
                          <span className="text-club tnum">{i + 1}.</span>
                          <span>{q.title}</span>
                        </h3>
                        <p className="mt-2 t-small text-ink-2">
                          Gjelder{" "}
                          <a href={`#${goal.id}`} className="font-medium text-club underline-offset-2 hover:underline">
                            {goalHeading(goal)}
                          </a>
                        </p>
                        <div className="mt-3 max-w-[68ch] space-y-3 t-body text-ink">
                          {q.body.map((p) => (
                            <p key={p}>{p}</p>
                          ))}
                        </div>
                        <Thread pointId={q.id} label={`${label(q.id)}: ${q.title}`} />
                      </li>
                    );
                  })}
                </ol>
              </section>

              <Block id={GENERAL.id} heading={GENERAL.heading} tone="sunken">
                {GENERAL.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <Thread pointId={GENERAL.id} label={label(GENERAL.id)} />
              </Block>

              <section id="godkjenning" aria-labelledby="godkjenning-tittel" className={`${ANCHOR} rounded-xl bg-club-tint p-5 ring-1 ring-line sm:p-8`}>
                <h2 id="godkjenning-tittel" className="t-h2">
                  Godkjenning
                </h2>
                <p className="mt-4 max-w-[68ch] t-body text-ink">
                  Godkjenn hvis du kan stille deg bak dokumentet slik det står nå ({STRATEGY.versionLabel}). Har du innspill, skriv dem heller ved punktet det gjelder. Du kan
                  trekke godkjenningen senere.
                </p>
                <Approval />
              </section>
            </div>
          </article>
        </div>
      </Section>
    </StrategyDiscussion>
  );
}

function Contents() {
  const item = (href: string, text: ReactNode, count?: ReactNode) => (
    <li>
      <a href={href} className="flex min-h-10 items-center py-1 text-ink-2 hover:text-ink lg:min-h-0">
        <span>{text}</span>
        {count}
      </a>
    </li>
  );
  return (
    <ol className="grid t-small">
      {item(`#${IDEA.id}`, IDEA.heading, <ThreadCount pointId={IDEA.id} />)}
      {item(`#${VALUES.id}`, VALUES.heading, <ThreadCount pointId={VALUES.id} />)}
      {GOALS.map((g) => (
        <li key={g.id}>
          <a href={`#${g.id}`} className="flex min-h-10 items-center py-1 text-ink-2 hover:text-ink lg:min-h-0">
            <span>{goalHeading(g)}</span>
            <ThreadCount ids={[g.id, ...g.subgoals.map((p) => p.id), ...g.measures.map((p) => p.id)]} />
          </a>
        </li>
      ))}
      {item("#apne-sporsmal", "Åpne spørsmål", <ThreadCount ids={QUESTIONS.map((q) => q.id)} />)}
      {item(`#${GENERAL.id}`, GENERAL.heading, <ThreadCount pointId={GENERAL.id} />)}
      {item("#godkjenning", "Godkjenning")}
    </ol>
  );
}

function Block({ id, heading, tone, children }: { id: string; heading: string; tone?: "sunken"; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-tittel`}
      className={tone === "sunken" ? `${ANCHOR} rounded-xl bg-sunken p-5 ring-1 ring-line sm:p-8` : `${ANCHOR} border-t border-guide pt-6`}
    >
      <h2 id={`${id}-tittel`} className="t-h2">
        {heading}
      </h2>
      <div className="mt-4 max-w-[68ch] space-y-4 t-body text-ink">{children}</div>
    </section>
  );
}

function Goal({ goal, label }: { goal: StrategyGoal; label: (id: string) => string }) {
  const ids = [goal.id, ...goal.subgoals.map((p) => p.id), ...goal.measures.map((p) => p.id)];
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return (
    <GoalPanel
      goalId={goal.id}
      heading={goalHeading(goal)}
      meta={`${count(goal.subgoals.length, "delmål", "delmål")} · ${count(goal.measures.length, "tiltak", "tiltak")}`}
      countIds={ids}
      className={ANCHOR}
    >
      <PointList kind="subgoals" goalId={goal.id} points={goal.subgoals} label={label} />
      <PointList kind="measures" goalId={goal.id} points={goal.measures} label={label} />
      <div className="mt-6 border-t border-line pt-4">
        <p className="t-small font-medium text-ink-2">Kommentarer til hele målområdet</p>
        <Thread pointId={goal.id} label={`${label(goal.id)} (hele målområdet)`} className="mt-0" />
      </div>
    </GoalPanel>
  );
}

/**
 * Subgoals and measures as two distinct blocks: subgoals (what the club wants to achieve) on the club's tint with a
 * target, measures (what it will do) on the plain surface with a checklist, each point numbered within its block.
 */
function PointList({ kind, goalId, points, label }: { kind: "subgoals" | "measures"; goalId: string; points: StrategyPoint[]; label: (id: string) => string }) {
  const sub = kind === "subgoals";
  const title = sub ? "Delmål" : "Tiltak";
  const headingId = `${goalId}-${sub ? "delmal" : "tiltak"}`;
  const Icon = sub ? Target : ListChecks;
  return (
    <div className={`overflow-hidden rounded-lg [&+&]:mt-5 ring-1 ${sub ? "bg-club-tint ring-club-surface/40" : "bg-surface ring-line-strong"}`}>
      <div className={`flex items-center gap-3 px-3 py-3 sm:px-4 ${sub ? "" : "border-b border-line bg-sunken"}`}>
        <span aria-hidden className={`flex size-8 shrink-0 items-center justify-center rounded-md ${sub ? "bg-club-surface text-on-club" : "bg-inverse text-ink-inverse"}`}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 id={headingId} className="t-h3">
            {title}
          </h3>
          <p className="t-small text-ink-2">{sub ? "Hva vi vil oppnå" : "Hva vi skal gjøre"}</p>
        </div>
        <span className="ml-auto t-meta text-ink-3 tnum">{points.length}</span>
      </div>
      <ol aria-labelledby={headingId} className={`grid divide-y ${sub ? "divide-club-surface/40 border-t border-club-surface/40" : "divide-line"}`}>
        {points.map((p, i) => (
          <li
            key={p.id}
            id={p.id}
            className={`${ANCHOR} grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 px-3 pt-4 pb-2 sm:px-4 target:bg-surface target:shadow-[inset_3px_0_0_var(--focus)]`}
          >
            <span
              aria-hidden
              className={`mt-0.5 flex size-7 items-center justify-center t-label font-semibold tnum ${sub ? "rounded-full bg-surface text-club ring-1 ring-club-surface/50" : "rounded-md bg-sunken text-ink ring-1 ring-line-strong"}`}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="t-body text-ink">
                <span className="sr-only">{`${title} ${i + 1}: `}</span>
                {p.text}
              </p>
              <Thread pointId={p.id} label={label(p.id)} className="mt-1" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
