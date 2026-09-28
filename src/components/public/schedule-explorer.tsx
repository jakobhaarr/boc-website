"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActivityRow } from "@/components/public/activity";
import { AgeChoice, ageById, type AgeId } from "@/components/public/age-choice";
import { ClubYearView } from "@/components/public/club-year";
import { SpondButton } from "@/components/public/spond-button";
import { chipClass, EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { formatDayMonthShort, formatMonthYear, formatTimeRange, WEEKDAYS } from "@/lib/dates";
import type { ClubYear } from "@/lib/club-year";
import { groupNamesLabel } from "@/lib/group-names";
import type { NodeKind } from "@/lib/types";
import type { TimetableEntry } from "@/lib/timetable";
import type { ActivityView } from "@/lib/views";

export interface FilterNode {
  id: string;
  parentId: string | null;
  name: string;
  kind: NodeKind;
  levelLabel: string;
  ageRange?: [number, number];
}

type View = "kommende" | "treningstider";

/**
 * /aktiviteter: what is coming up, and when each group trains.
 *
 * The two answer different questions, so they are two tabs rather than one
 * long page: «Kommende» (the terminliste, open by default: the question most
 * people arrive with) and «Treningstider» (the weekly rhythm). A link that
 * ends in #treningstider or #terminliste opens its tab, as the group pages'
 * links do; a link to one activity (#<id>) opens «Kommende».
 *
 * One filter serves both. It selects rather than deselects: «Alle», or one
 * branch (a sport, in a multi-sport club), and then, under a chosen branch,
 * one of its groups, which is where a group page's link (?gruppe=boc-1)
 * lands. The age choice is the one from «Finn din aktivitet»: a session or a
 * date is kept when the group it belongs to is for that age; one without an
 * age (a whole branch, the club) is always kept.
 *
 * The weekly list is kept short: sessions that are the same in all but the
 * group (BOC 1–4 every Tuesday) are one row, a session title that only
 * repeats the group's name is dropped, and a session that has not started
 * yet or ends soon says so, since the list holds a whole season. Single
 * sessions, sign-ups and last-minute changes live in Spond.
 */
export function ScheduleExplorer({
  entries,
  events,
  nodes,
  rootId,
  today,
  initialNodeId,
  year,
  yearCategories,
}: {
  /** The club year, shown over the dates in «Kommende» and narrowed by the same filter. */
  year?: ClubYear;
  yearCategories?: string[];
  entries: TimetableEntry[];
  events: ActivityView[];
  nodes: FilterNode[];
  rootId: string;
  today: string;
  initialNodeId?: string;
}) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const childrenOf = useMemo(() => {
    const map = new Map<string, FilterNode[]>();
    for (const n of nodes) if (n.parentId) map.set(n.parentId, [...(map.get(n.parentId) ?? []), n]);
    return map;
  }, [nodes]);

  const top = childrenOf.get(rootId) ?? [];
  // The top-level node a node sits under, if any.
  const topOf = (id: string) => {
    let cur = byId.get(id);
    while (cur && cur.parentId !== rootId) cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    return cur;
  };
  const initialTop = initialNodeId ? topOf(initialNodeId) : undefined;

  // The branch chosen (or none, for all), and a group chosen under it.
  const [branchId, setBranchId] = useState<string | null>(initialTop?.id ?? null);
  const [focus, setFocus] = useState<string | null>(initialTop && initialNodeId !== initialTop.id ? initialNodeId! : null);
  const [ageId, setAgeId] = useState<AgeId>("alle");
  const age = ageById(ageId);
  const [view, setView] = useState<View>("kommende");

  // The tab from the address: #treningstider opens the weekly list.
  useEffect(() => {
    if (window.location.hash === "#treningstider") setView("treningstider");
  }, []);

  const branch = branchId ? byId.get(branchId) : undefined;
  const selected = (branch && focus) || branch?.id || rootId;

  // The path down to what is selected, starting at the filter's root.
  const lineage = useMemo(() => {
    const out: FilterNode[] = [];
    let cur = byId.get(selected);
    while (cur) {
      out.unshift(cur);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    const from = out.findIndex((n) => n.id === rootId);
    return from > 0 ? out.slice(from) : out;
  }, [byId, rootId, selected]);

  // Everything at or below the selection, plus the levels above a picked
  // group that run shared sessions (a J16 session belongs to J16-2 as well).
  const scope = useMemo(() => {
    const ids = new Set<string>();
    const walk = (id: string) => {
      ids.add(id);
      for (const c of childrenOf.get(id) ?? []) walk(c.id);
    };
    walk(selected);
    if (focus) for (const n of lineage) if (n.kind === "ageGroup" || n.kind === "discipline") ids.add(n.id);
    return ids;
  }, [childrenOf, lineage, selected, focus]);

  const fitsAge = (nodeId: string) => {
    const range = byId.get(nodeId)?.ageRange;
    return !range || age.fits(range);
  };

  // Rows of groups under the chosen branch, one per level down to the pick.
  const rows = branch
    ? lineage
        .slice(1)
        .map((parent, i) => ({
          parent,
          options: (childrenOf.get(parent.id) ?? []).filter((o) => !o.ageRange || age.fits(o.ageRange)),
          active: lineage[i + 2]?.id,
        }))
        .filter((r) => r.options.length > 0)
    : [];

  const writeUrl = (id: string, hash = window.location.hash) => {
    const path = id === rootId ? window.location.pathname : `${window.location.pathname}?gruppe=${id}`;
    window.history.replaceState(null, "", `${path}${hash}`);
  };
  const chooseBranch = (id: string | null) => {
    setBranchId(id);
    setFocus(null);
    writeUrl(id ?? rootId);
  };
  const pick = (id: string) => {
    setFocus(branch && id !== branch.id ? id : null);
    writeUrl(id);
  };
  const chooseView = (next: View) => {
    setView(next);
    writeUrl(selected, next === "treningstider" ? "#treningstider" : "#terminliste");
  };
  const filtered = branchId !== null || ageId !== "alle";
  const reset = () => {
    chooseBranch(null);
    setAgeId("alle");
  };

  // At «Alle» nothing is narrowed, so club-wide events (dugnad, medlemsmøte)
  // stay in, even when the filter starts at a sport.
  const everything = branchId === null;
  const sessions = entries.filter((e) => (everything || scope.has(e.nodeId)) && fitsAge(e.nodeId));
  const dated = events.filter((a) => (everything || scope.has(a.nodeId) || a.lineage.includes(selected)) && fitsAge(a.nodeId));
  const place = selected !== rootId ? lineage.slice(1).map((n) => n.name).join(" › ") : "hele klubben";
  const scopeLabel = age.id === "alle" ? place : `${place}, ${age.label.toLowerCase()}`;
  const spondLinks = [...new Map(sessions.filter((s) => s.spondUrl).map((s) => [s.nodeId, s])).values()];

  const months: { key: string; label: string; items: ActivityView[] }[] = [];
  for (const a of dated) {
    const key = a.date.slice(0, 7);
    const last = months[months.length - 1];
    if (last?.key === key) last.items.push(a);
    else months.push({ key, label: formatMonthYear(a.date), items: [a] });
  }

  const days = WEEKDAYS.map((day, i) => ({ day, rows: mergeSessions(sessions.filter((s) => s.weekday === i + 1)) })).filter((d) => d.rows.length);
  const branchLabel = top[0]?.levelLabel ?? "Disiplin";
  const tabs: { id: View; label: string; count: number }[] = [
    { id: "kommende", label: "Kommende", count: dated.length },
    { id: "treningstider", label: "Treningstider", count: days.reduce((n, d) => n + d.rows.length, 0) },
  ];

  return (
    <div>
      {/* Filter */}
      <div className="page">
        <div className="rounded-xl bg-surface p-4 shadow-card ring-1 ring-line sm:p-5">
          <div className="grid gap-3">
            {top.length > 1 && (
              <div className="grid items-center gap-x-4 gap-y-1.5 md:grid-cols-[6.5rem_minmax(0,1fr)]">
                <span className="t-meta text-ink-3">{byId.get(rootId)?.kind === "club" ? "Idrett" : branchLabel}</span>
                <div role="group" aria-label={branchLabel} className="scroll-x -mx-4 flex gap-1.5 px-4 sm:-mx-5 sm:px-5 md:mx-0 md:flex-wrap md:px-0">
                  <button type="button" aria-pressed={!branchId} onClick={() => chooseBranch(null)} className={chipClass(!branchId)}>
                    Alle
                  </button>
                  {top.map((t) => (
                    <button key={t.id} type="button" aria-pressed={branchId === t.id} onClick={() => chooseBranch(t.id)} className={chipClass(branchId === t.id)}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {rows.map((row) => {
              const label = row.options.find((o) => o.kind !== "team")?.levelLabel ?? row.options[0].levelLabel;
              return (
                <div key={row.parent.id} className="anim-rise grid items-center gap-x-4 gap-y-1.5 md:grid-cols-[6.5rem_minmax(0,1fr)]">
                  <span className="t-meta text-ink-3">{label}</span>
                  <div role="group" aria-label={label} className="scroll-x -mx-4 flex gap-1.5 px-4 sm:-mx-5 sm:px-5 md:mx-0 md:flex-wrap md:px-0">
                    <button type="button" aria-pressed={!row.active} onClick={() => pick(row.parent.id)} className={chipClass(!row.active)}>
                      Hele {row.parent.name}
                    </button>
                    {row.options.map((o) => (
                      <button key={o.id} type="button" aria-pressed={row.active === o.id} onClick={() => pick(o.id)} className={chipClass(row.active === o.id)}>
                        {o.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="grid items-center gap-x-4 gap-y-1.5 md:grid-cols-[6.5rem_minmax(0,1fr)]">
              <span className="t-meta text-ink-3">Alder</span>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <AgeChoice value={age.id} onChange={setAgeId} className="md:w-auto" />
                {filtered && (
                  <button type="button" onClick={reset} className="t-small text-ink-3 hover:text-ink">
                    Nullstill filter
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="page mt-8 lg:mt-10">
        <div role="tablist" aria-label="Vis" className="flex gap-6 border-b border-line">
          {tabs.map((t) => {
            const on = view === t.id;
            return (
              <button
                key={t.id}
                id={`fane-${t.id}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`panel-${t.id}`}
                onClick={() => chooseView(t.id)}
                className={cn(
                  "-mb-px flex items-baseline gap-2 border-b-2 pt-1 pb-3 text-[15px] font-semibold transition-colors",
                  on ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink",
                )}
              >
                {t.label}
                <span className={cn("t-meta tnum", on ? "text-ink-2" : "text-ink-3")}>{t.count}</span>
              </button>
            );
          })}
        </div>
        <p aria-live="polite" className="mt-4 t-small text-ink-3">
          Viser <span className="text-ink">{scopeLabel}</span>.
        </p>
      </div>

      {/* Kommende: the terminliste */}
      <div id="panel-kommende" role="tabpanel" aria-labelledby="fane-kommende" hidden={view !== "kommende"} className="page pt-6 pb-24">
        {/* The year at a glance first, the dates in full under it. */}
        {year && year.lanes.length > 0 && (
          <section aria-labelledby="aaret-tittel" className="mb-12 lg:mb-16">
            <h2 id="aaret-tittel" className="mb-4 t-label font-semibold">
              Året i ett blikk
            </h2>
            <ClubYearView year={year} categories={yearCategories} focus={branch?.name ?? null} />
          </section>
        )}
        <span id="terminliste" className="block scroll-mt-28" />
        {year && year.lanes.length > 0 && months.length > 0 && <h2 className="mb-4 t-label font-semibold">Alle datoer</h2>}
        {months.length === 0 ? (
          <EmptyState>Ingen datoer er publisert for {scopeLabel} ennå.</EmptyState>
        ) : (
          <div key={`t-${selected}-${age.id}`} className="anim-fade max-w-[56rem]">
            {months.map((m) => (
              <section key={m.key} aria-label={m.label} className="mt-8 first:mt-0">
                <h3 className="border-b border-ink pb-2 t-label font-semibold capitalize">{m.label}</h3>
                <div className="mt-1">
                  {m.items.map((a) => (
                    <ActivityRow key={a.id} activity={a} today={today} leading="date" />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Treningstider: the weekly rhythm */}
      <div id="panel-treningstider" role="tabpanel" aria-labelledby="fane-treningstider" hidden={view !== "treningstider"} className="page pt-6 pb-24">
        <span id="treningstider" className="block scroll-mt-28" />
        {days.length === 0 ? (
          <EmptyState>Ingen faste treninger registrert for {scopeLabel} nå.</EmptyState>
        ) : (
          <div key={`s-${selected}-${age.id}`} className="anim-fade max-w-[56rem] border-t border-line">
            {days.map(({ day, rows: dayRows }) => (
              <div key={day} className="grid gap-x-5 border-b border-line py-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                <p className="t-label font-semibold capitalize">{day}</p>
                <ul className="mt-2 sm:mt-0">
                  {dayRows.map((r) => (
                    <li key={r.key} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-baseline gap-x-4 py-1.5 md:grid-cols-[6.5rem_minmax(0,1fr)_13rem]">
                      <span className="t-small tnum text-ink">{formatTimeRange(r.start, r.end, r.startApprox)}</span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <Link href={r.href} className="text-[15px] font-semibold text-ink transition-colors hover:text-club">
                            {everything && r.branch && !r.label.includes(r.branch) && <span className="font-normal text-ink-3">{r.branch} · </span>}
                            {r.label}
                          </Link>
                          {r.title && <span className="t-small text-ink-2">{r.title}</span>}
                          {r.season(today) && (
                            <span className="rounded-sm bg-sunken px-1.5 text-[12px] leading-5 font-medium text-ink-2 ring-1 ring-line">{r.season(today)}</span>
                          )}
                        </span>
                        <span className="block truncate t-small text-ink-3 md:hidden">{[r.place, r.note].filter(Boolean).join(" · ")}</span>
                        {r.note && <span className="hidden truncate t-small text-ink-3 md:block">{r.note}</span>}
                      </span>
                      <span className="hidden truncate t-small text-ink-2 md:block">{r.place}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <p className="mt-6 max-w-[56rem] t-small text-ink-3">
          Her står rytmen gjennom sesongen. Enkeltøkter, påmelding og endringer i siste liten ligger i Spond.
          {spondLinks.length > 0 && spondLinks.length <= 3 && (
            <>
              {" "}
              {spondLinks.map((s, i) => (
                <span key={s.nodeId}>
                  {i > 0 && " · "}
                  <a href={s.spondUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-0.5 font-medium text-club hover:text-club-hover">
                    {s.nodeName} i Spond
                    <ArrowUpRight aria-hidden className="size-3.5" />
                  </a>
                </span>
              ))}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/* ─── One day's sessions, merged ─────────────────────────────────────── */

interface SessionRow {
  key: string;
  start: string;
  end: string;
  startApprox?: boolean;
  label: string;
  href: string;
  /** The branch (Landevei, BMX …), shown before a name that does not say it, while every branch is listed. */
  branch?: string;
  title?: string;
  place?: string;
  note?: string;
  /** «fra 1. okt.» for a session not started yet, «til 30. sep.» for one ending within three weeks. */
  season: (today: string) => string | undefined;
}

/** A session title that only repeats the group's name says nothing: «BMX Gruppe 1» on Gruppe 1, «Zwift: felles intervalløkt» on Zwift. */
function titleFor(e: TimetableEntry): string | undefined {
  if (!e.title) return undefined;
  // Soft hyphens (Terrengsykkel­skolen) are left out of the comparison.
  const name = e.nodeName.replace(/\u00AD/g, "").toLowerCase();
  const title = e.title.replace(/\u00AD/g, "").toLowerCase();
  if (title.startsWith(`${name}:`)) {
    const rest = e.title.slice(name.length + 1).trim();
    return rest.charAt(0).toUpperCase() + rest.slice(1);
  }
  return title.includes(name) || name.includes(title) ? undefined : e.title;
}

/** «BOC 1–4»: see groupNamesLabel. */
const namesLabel = groupNamesLabel;

const DAY = 86_400_000;

/**
 * Sessions that differ only in the group are one row: BOC 1–4 meet at the
 * same place and time, and four identical rows read as four things to go
 * to. A merged row links to the level above the groups when they share one.
 */
function mergeSessions(items: TimetableEntry[]): SessionRow[] {
  const groups = new Map<string, TimetableEntry[]>();
  for (const e of items) {
    const key = [e.start, e.end, e.place, titleFor(e), e.note, e.from, e.to].join("|");
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  return [...groups.entries()].map(([key, group]) => {
    const first = group[0];
    const sameParent = group.every((e) => e.parentId && e.parentId === first.parentId);
    return {
      key,
      start: first.start,
      end: first.end,
      startApprox: first.startApprox,
      label: group.length > 1 ? namesLabel(group.map((e) => e.nodeName)) : first.nodeName,
      href: group.length > 1 && sameParent && first.parentHref ? first.parentHref : first.nodeHref,
      branch: first.branchName,
      title: titleFor(first),
      place: first.place,
      note: first.note,
      season: (today: string) => {
        if (first.from > today) return `fra ${formatDayMonthShort(first.from)}`;
        const left = (Date.parse(first.to) - Date.parse(today)) / DAY;
        return left <= 21 ? `til ${formatDayMonthShort(first.to)}` : undefined;
      },
    };
  });
}

/** Where a group sends people for sign-ups and changes: a note, and the Spond button. */
export function SpondNote({ url, label, className }: { url: string; label: string; className?: string }) {
  return (
    <div className={cn("rounded-lg bg-sunken px-4 py-4 shadow-[inset_0_0_0_1px_var(--border)]", className)}>
      <p className="t-small text-ink-2">Påmelding, oppmøte og endringer i siste liten skjer i Spond.</p>
      <SpondButton url={url} label={label} className="mt-3" />
    </div>
  );
}
