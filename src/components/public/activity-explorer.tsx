"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AgeChoice, ageById, type AgeId } from "@/components/public/age-choice";
import { CategoryFilter } from "@/components/public/category-filter";
import { HoverArrow } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { LevelId, Photo as PhotoRecord } from "@/lib/types";
import { Photo } from "./photo";

export interface ExplorerGroup {
  id: string;
  name: string;
  href: string;
  ageRange: [number, number];
  ageLabel?: string;
  schedule: string;
  summary?: string;
  /** Levels between the branch and the group, e.g. ["J16"] for J16-2 under Jenter. */
  path: string[];
  photo?: PhotoRecord;
  levels?: LevelId[];
  /** The club's pick among equally good matches in the finder. */
  recommendFirst?: boolean;
}

export interface ExplorerBranch {
  id: string;
  name: string;
  groups: ExplorerGroup[];
}

export interface ExplorerSport {
  id: string;
  name: string;
  href: string;
  summary?: string;
  ages: string;
  photo?: PhotoRecord;
  groupCount: number;
  branchLabel: string;
  branches: ExplorerBranch[];
}

/**
 * "Finn din aktivitet". Three steps that mirror the club structure:
 * sport → branch and age → the group itself. The left rail sits exactly on
 * the grid's fourth column line; the photo follows the row you point at.
 */
export function ActivityExplorer({ sports, initialSportId }: { sports: ExplorerSport[]; initialSportId?: string }) {
  const [sportId, setSportId] = useState(initialSportId ?? sports[0]?.id);
  // Branches taken out of the list; every branch starts shown, as in Klubbåret.
  const [hidden, setHidden] = useState<string[]>([]);
  const [ageId, setAgeId] = useState<AgeId>("alle");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const sport = sports.find((s) => s.id === sportId) ?? sports[0];
  const age = ageById(ageId);
  const fits = (g: ExplorerGroup) => age.fits(g.ageRange);
  const branches = sport.branches;
  const visible = branches.filter((b) => !hidden.includes(b.id));
  // Named in the trail only when a single branch is left.
  const branch = visible.length === 1 && branches.length > 1 ? visible[0] : undefined;
  const sections = visible.map((b) => ({ ...b, groups: b.groups.filter(fits) })).filter((b) => b.groups.length);
  const total = sections.reduce((n, b) => n + b.groups.length, 0);
  // Long lists collapse after eight rows so the panel keeps its shape.
  const LIMIT = 8;
  let shown = 0;
  const limited = sections
    .map((b) => {
      const groups = expanded ? b.groups : b.groups.slice(0, Math.max(0, LIMIT - shown));
      shown += groups.length;
      return { ...b, groups };
    })
    .filter((b) => b.groups.length);
  const hovered = sections.flatMap((b) => b.groups).find((g) => g.id === hoverId);
  const panelPhoto = hovered?.photo ?? sport.photo;
  const countFor = (s: ExplorerSport) => s.branches.flatMap((b) => b.groups).filter(fits).length;
  const isSingle = (b: ExplorerBranch) => b.groups.length === 1 && b.groups[0].id === b.id;

  const chooseSport = (id: string) => {
    setSportId(id);
    setHidden([]);
    setHoverId(null);
    setExpanded(false);
  };

  // A club with one sport skips step 1 — there is nothing to choose there.
  const showSports = sports.length > 1;

  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-raised ring-1 ring-line">
      <div
        className={cn(
          "grid grid-cols-[minmax(0,1fr)]",
          showSports && "lg:grid-cols-[calc((100%_-_11*var(--grid-gap))*0.25_+_2.5*var(--grid-gap))_minmax(0,1fr)]",
        )}
      >
        {/* Step 1 — sport */}
        <div className={cn("border-b border-line p-3 sm:p-4 lg:border-r lg:border-b-0 lg:p-5", !showSports && "hidden")}>
          <p className="px-2 pt-1 pb-3 t-meta text-ink-3 max-lg:hidden">Idrett</p>
          <div role="tablist" aria-label="Idrett" aria-orientation="vertical" className="scroll-x flex gap-1.5 lg:flex-col lg:gap-1">
            {sports.map((s) => {
              const selected = s.id === sport.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="finn-aktivitet-panel"
                  onClick={() => chooseSport(s.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-lg p-2 pr-4 text-left transition-[background-color,box-shadow] duration-150 lg:pr-3",
                    selected ? "bg-sunken shadow-[inset_0_0_0_1px_var(--border)]" : "hover:bg-sunken/70",
                  )}
                >
                  {s.photo && <Photo photo={s.photo} ratio={1} sizes="64px" className="size-11 shrink-0 rounded-md sm:size-14" />}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[16px] font-semibold tracking-[-0.014em]", selected ? "text-ink" : "text-ink-2")}>{s.name}</span>
                    <span className="block t-small whitespace-nowrap text-ink-3">{s.ages}</span>
                  </span>
                  <span className={cn("t-meta tnum max-lg:hidden", selected ? "text-ink" : "text-ink-3")}>{countFor(s)}</span>
                </button>
              );
            })}
          </div>
          <div className="mx-2 mt-6 border-t border-line pt-5 max-lg:hidden">
            <p className="t-small text-ink-2">
              {sport.groupCount} grupper i {sport.name.toLowerCase()}, og alle kan prøve før de melder seg inn.
            </p>
            <Link href={sport.href} className="mt-3 inline-flex items-center t-small font-medium text-club hover:text-club-hover">
              Alt om {sport.name.toLowerCase()}
              <HoverArrow />
            </Link>
          </div>
        </div>

        {/* Steps 2 and 3 — branch and age, then the group */}
        <div id="finn-aktivitet-panel" role="tabpanel" aria-label={sport.name} className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            {branches.length > 1 ? (
              /* The same labels and logic as Klubbåret's filter: each branch in
                 its colour and icon, all shown to begin with, a press takes one
                 out of the list and «Vis alle» brings them back. */
              <CategoryFilter
                options={branches.map((b, index) => ({ id: b.id, label: b.name, icon: b.name, index, shown: !hidden.includes(b.id) }))}
                onPress={(id) => {
                  setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
                  setHoverId(null);
                  setExpanded(false);
                }}
                onReset={hidden.length ? () => setHidden([]) : undefined}
                className="-mx-4 px-4 sm:mx-0 sm:px-0"
              />
            ) : (
              <p className="t-small text-ink-2">{sport.summary}</p>
            )}
            <AgeChoice
              value={age.id}
              onChange={(id) => {
                setAgeId(id);
                setExpanded(false);
              }}
            />
          </div>

          <p aria-live="polite" className="mt-6 flex flex-wrap items-center gap-x-1 t-small text-ink-3">
            {showSports ? (
              <span className="font-medium text-ink">{sport.name}</span>
            ) : (
              <Link href={sport.href} className="font-medium text-ink hover:text-club">
                {sport.name}
              </Link>
            )}
            {branch && !isSingle(branch) && (
              <>
                <ChevronRight aria-hidden className="size-3.5" />
                <span className="font-medium text-ink">{branch.name}</span>
              </>
            )}
            <ChevronRight aria-hidden className="size-3.5" />
            <span>
              {total === 1 ? "1 gruppe" : `${total} grupper`}
              {age.id !== "alle" ? ` for ${age.label.toLowerCase()}` : ""}
            </span>
          </p>

          <div className="mt-3 grid gap-8 lg:grid-cols-[minmax(0,1fr)_13rem] xl:grid-cols-[minmax(0,1fr)_16rem]">
            <div key={`${sport.id}-${hidden.join(",")}-${age.id}`} className="anim-fade">
              {sections.length === 0 ? (
                <EmptyState
                  className="mt-2"
                  action={
                    <button type="button" onClick={() => setAgeId("alle")} className="inline-flex items-center t-small font-medium text-club">
                      Vis alle aldre
                      <HoverArrow />
                    </button>
                  }
                >
                  Ingen grupper i {branch && !isSingle(branch) ? branch.name : sport.name.toLowerCase()} for {age.label.toLowerCase()} akkurat nå.
                </EmptyState>
              ) : (
                limited.map((b) => (
                  <div key={b.id} className="mt-5 first:mt-0">
                    {!branch && branches.length > 1 && !isSingle(b) && <p className="border-b border-line pb-2 t-meta text-ink-3">{b.name}</p>}
                    <ul>
                      {b.groups.map((g) => (
                        <li key={g.id} className="border-b border-line last:border-b-0">
                          <Link
                            href={g.href}
                            onPointerEnter={() => setHoverId(g.id)}
                            onFocus={() => setHoverId(g.id)}
                            className="group -mx-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg px-3 py-3 transition-colors duration-150 hover:bg-sunken focus-visible:bg-sunken"
                          >
                            <span className="min-w-0">
                              <span className="flex flex-wrap items-baseline gap-x-1.5">
                                {g.path.map((p) => (
                                  <span key={p} className="t-small text-ink-3">
                                    {p} ›
                                  </span>
                                ))}
                                <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{g.name}</span>
                                {g.ageLabel && <span className="t-small text-ink-3">· {g.ageLabel}</span>}
                              </span>
                              <span className="mt-0.5 block truncate t-small text-ink-2">{g.schedule}</span>
                            </span>
                            <span className="flex items-center gap-3">
                              <span className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-[background-color,box-shadow,color] duration-150 group-hover:bg-surface group-hover:text-ink group-hover:shadow-card">
                                <HoverArrow className="!ml-0 -translate-x-px" />
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
              {!expanded && total > LIMIT && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-ink shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-sunken"
                >
                  Vis alle {total} grupper
                  <ChevronDown aria-hidden className="size-3.5 text-ink-3" />
                </button>
              )}
            </div>

            {panelPhoto && (
              <figure className="max-lg:hidden">
                <div className="sticky top-[calc(var(--header-h)+1.5rem)]">
                  <div key={panelPhoto.id} className="anim-fade">
                    <Photo photo={panelPhoto} ratio={4 / 5} sizes="260px" className="rounded-lg" />
                  </div>
                  <figcaption className="mt-3 t-small text-ink-3">{hovered ? (hovered.summary ?? hovered.name) : sport.summary}</figcaption>
                </div>
              </figure>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
