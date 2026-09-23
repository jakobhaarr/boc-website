"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ActivityRow } from "@/components/public/activity";
import { AgeChoice, ageById, type AgeId } from "@/components/public/age-choice";
import { CategoryFilter } from "@/components/public/category-filter";
import { chipClass, EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { formatMonthYear, formatTimeRange, WEEKDAYS } from "@/lib/dates";
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

/**
 * Training times and the terminliste, filtered by where in the club you are.
 *
 * The top row works like «Klubbåret» and «Finn din aktivitet»: every branch
 * (or sport, in a multi-sport club) is shown in its colour, a press takes it
 * out and «Vis alle» brings them back. With one branch left, its groups can be
 * picked one at a time below it, which is where a group page's link
 * (?gruppe=boc-1) lands. The age choice is the one from «Finn din aktivitet»:
 * a session or a date is kept when the group it belongs to is for that age;
 * one without an age (a whole branch, the club) is always kept.
 *
 * The weekly rhythm is what the website publishes; the dated list is what the
 * club has decided to announce. Individual sessions, sign-ups and last-minute
 * changes live in Spond, and every group links there.
 */
export function ScheduleExplorer({
  entries,
  events,
  nodes,
  rootId,
  today,
  initialNodeId,
}: {
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

  // Top-level choices taken out of the list; every one starts shown.
  const [hidden, setHidden] = useState<string[]>(() => (initialTop ? top.filter((t) => t.id !== initialTop.id).map((t) => t.id) : []));
  // A group picked below the single branch left, or nothing.
  const [focus, setFocus] = useState<string | null>(initialTop && initialNodeId !== initialTop.id ? initialNodeId! : null);
  const [ageId, setAgeId] = useState<AgeId>("alle");
  const age = ageById(ageId);

  const shownTop = top.filter((t) => !hidden.includes(t.id));
  const sole = shownTop.length === 1 ? shownTop[0] : undefined;
  const selected = (sole && focus) || sole?.id || rootId;

  // The path down to what is selected, starting at the filter's root — a
  // single-sport club starts at its sport, so there is no sport row to pick.
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

  // Everything at or below the shown nodes, plus the levels above a picked
  // group that run shared sessions (a J16 session belongs to J16-2 as well).
  const scope = useMemo(() => {
    const ids = new Set<string>();
    const walk = (id: string) => {
      ids.add(id);
      for (const c of childrenOf.get(id) ?? []) walk(c.id);
    };
    if (focus && sole) {
      walk(selected);
      for (const n of lineage) if (n.kind === "ageGroup" || n.kind === "discipline") ids.add(n.id);
    } else for (const t of shownTop) walk(t.id);
    return ids;
  }, [childrenOf, lineage, selected, focus, sole, shownTop]);

  // A node without an age of its own (a branch, the club) is kept for every age.
  const fitsAge = (nodeId: string) => {
    const range = byId.get(nodeId)?.ageRange;
    return !range || age.fits(range);
  };

  // Rows below the top one, for the single branch left.
  const rows = sole
    ? lineage
        .slice(1)
        .map((parent, i) => ({
          parent,
          options: (childrenOf.get(parent.id) ?? []).filter((o) => !o.ageRange || age.fits(o.ageRange)),
          active: lineage[i + 2]?.id,
        }))
        .filter((r) => r.options.length > 0)
    : [];

  const writeUrl = (id: string) => {
    const url = id === rootId ? window.location.pathname : `${window.location.pathname}?gruppe=${id}`;
    window.history.replaceState(null, "", url);
  };
  const setHiddenAndUrl = (next: string[]) => {
    setHidden(next);
    setFocus(null);
    const left = top.filter((t) => !next.includes(t.id));
    writeUrl(left.length === 1 ? left[0].id : rootId);
  };
  const pick = (id: string) => {
    setFocus(sole && id !== sole.id ? id : null);
    writeUrl(id);
  };
  const filtered = hidden.length > 0 || focus !== null || ageId !== "alle";
  const reset = () => {
    setHiddenAndUrl([]);
    setAgeId("alle");
  };

  // At the top of the filter nothing is narrowed, so club-wide events (dugnad,
  // medlemsmøte) stay visible even when the filter starts at a sport.
  const everything = hidden.length === 0;
  const sessions = entries.filter((e) => (everything || scope.has(e.nodeId)) && fitsAge(e.nodeId));
  const dated = events.filter((a) => (everything || scope.has(a.nodeId) || a.lineage.includes(selected)) && fitsAge(a.nodeId));
  const place =
    selected !== rootId ? lineage.slice(1).map((n) => n.name).join(" › ") : everything ? "hele klubben" : shownTop.map((t) => t.name).join(", ");
  const scopeLabel = age.id === "alle" ? place : `${place}, ${age.label.toLowerCase()}`;
  const spondLinks = [...new Map(sessions.filter((s) => s.spondUrl).map((s) => [s.nodeId, s])).values()];

  const months: { key: string; label: string; items: ActivityView[] }[] = [];
  for (const a of dated) {
    const key = a.date.slice(0, 7);
    const last = months[months.length - 1];
    if (last?.key === key) last.items.push(a);
    else months.push({ key, label: formatMonthYear(a.date), items: [a] });
  }

  return (
    <div>
      {/* Filter */}
      <div className="page">
        <div className="rounded-xl bg-surface p-4 shadow-card ring-1 ring-line sm:p-5">
          <div className="grid gap-2.5">
            {top.length > 1 && (
              <div className="grid items-center gap-x-4 gap-y-1.5 md:grid-cols-[6.5rem_minmax(0,1fr)]">
                <span className="t-meta text-ink-3">{byId.get(rootId)?.kind === "club" ? "Idrett" : top[0].levelLabel}</span>
                <CategoryFilter
                  options={top.map((t, index) => ({ id: t.id, label: t.name, icon: t.name, index, shown: !hidden.includes(t.id) }))}
                  onPress={(id) => setHiddenAndUrl(hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id])}
                  onReset={hidden.length ? () => setHiddenAndUrl([]) : undefined}
                  className="-mx-4 px-4 sm:-mx-5 sm:px-5 md:mx-0 md:flex-wrap md:px-0"
                />
              </div>
            )}
            <div className="grid items-center gap-x-4 gap-y-1.5 md:grid-cols-[6.5rem_minmax(0,1fr)]">
              <span className="t-meta text-ink-3">Alder</span>
              <AgeChoice value={age.id} onChange={setAgeId} className="md:w-auto md:justify-self-start" />
            </div>
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
          </div>

          {filtered && (
            <div className="mt-4 flex justify-end border-t border-line pt-4">
              <button type="button" onClick={reset} className="t-small text-ink-3 hover:text-ink">
                Nullstill filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Weekly rhythm */}
      <div className="page pt-12 lg:pt-16">
        <div className="grid-page gap-y-6">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <p className="t-eyebrow">Uke for uke</p>
            <h2 id="treningstider" className="mt-3 scroll-mt-28 t-h2">
              Treningstider
            </h2>
            <p aria-live="polite" className="mt-4 t-small text-ink-2">
              {sessions.length} faste {sessions.length === 1 ? "økt" : "økter"} i uken for <span className="text-ink">{scopeLabel}</span>.
            </p>
            <p className="mt-3 t-small text-ink-3">
              Enkeltøkter, påmelding og endringer i siste liten ligger i Spond. Her står rytmen som gjelder gjennom sesongen.
            </p>
            {spondLinks.length > 0 && spondLinks.length <= 3 && (
              <div className="mt-4 flex flex-col items-start gap-2">
                {spondLinks.map((s) => (
                  <a
                    key={s.nodeId}
                    href={s.spondUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover"
                  >
                    {s.nodeName} i Spond
                    <ArrowUpRight aria-hidden className="size-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-4 md:col-span-8 lg:col-span-9 lg:col-start-4">
            {sessions.length === 0 ? (
              <EmptyState>Ingen faste treninger registrert for {scopeLabel} nå.</EmptyState>
            ) : (
              <div key={`${selected}-${hidden.join(",")}-${age.id}`} className="anim-fade border-t border-line">
                {WEEKDAYS.map((day, i) => {
                  const items = sessions.filter((s) => s.weekday === i + 1);
                  if (!items.length) return null;
                  return (
                    <div key={day} className="grid gap-x-5 border-b border-line py-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                      <p className="t-label font-semibold capitalize">{day}</p>
                      <ul className="mt-2 sm:mt-0">
                        {items.map((s) => (
                          <li key={s.id} className="grid grid-cols-[7rem_minmax(0,1fr)] items-baseline gap-x-4 py-1.5">
                            <span className="t-small tnum text-ink">{formatTimeRange(s.start, s.end, s.startApprox)}</span>
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-baseline gap-x-2">
                                <Link href={s.nodeHref} className="text-[15px] font-semibold text-ink transition-colors hover:text-club">
                                  {s.nodeName}
                                </Link>
                                {s.title && <span className="t-small text-ink-2">{s.title}</span>}
                              </span>
                              <span className="block truncate t-small text-ink-3">
                                {[s.place, s.note].filter(Boolean).join(" · ")}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminliste */}
      <div className="page pt-14 pb-24 lg:pt-20">
        <div className="grid-page gap-y-6">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <p className="t-eyebrow">Datoer</p>
            <h2 id="terminliste" className="mt-3 scroll-mt-28 t-h2">
              Terminliste
            </h2>
            <p className="mt-4 max-w-[34ch] t-small text-ink-2">
              Kamper, ritt, cuper, samlinger, dugnad og arrangementer som er åpne for alle.
            </p>
          </div>
          <div className="col-span-4 md:col-span-8 lg:col-span-9 lg:col-start-4">
            {months.length === 0 ? (
              <EmptyState>Ingen datoer er publisert for {scopeLabel} ennå.</EmptyState>
            ) : (
              <div key={`t-${selected}-${hidden.join(",")}-${age.id}`} className="anim-fade">
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
        </div>
      </div>
    </div>
  );
}

/** Small link used by pages that send people to Spond for the details. */
export function SpondNote({ url, label, className }: { url: string; label: string; className?: string }) {
  return (
    <div className={cn("rounded-lg bg-sunken px-4 py-3.5 shadow-[inset_0_0_0_1px_var(--border)]", className)}>
      <p className="t-small text-ink-2">Påmelding, oppmøte og endringer i siste liten skjer i Spond.</p>
      <a href={url} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover">
        {label}
        <ArrowUpRight aria-hidden className="size-3.5" />
      </a>
    </div>
  );
}
