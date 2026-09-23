"use client";

import { ChevronRight, Search, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Select } from "@/components/ui/field";
import { Avatar, chipClass, Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { PrivacyStatus } from "@/lib/types";
import { PrivacyStatusBadge } from "./bits";

export interface PersonRowView {
  id: string;
  name: string;
  birthYear?: number;
  memberships: { role: string; node: string }[];
  groupIds: string[];
  sportId?: string;
  account: string;
  hasUser: boolean;
  presence: { photos: number; text: number; activities: number };
  status: PrivacyStatus;
  consent: "granted" | "declined" | "unknown";
  openRequest: boolean;
}

type View = "all" | "attention" | "consent" | "restricted" | "anonymised";

const VIEWS: { id: View; label: string; test: (r: PersonRowView) => boolean }[] = [
  { id: "all", label: "Alle", test: () => true },
  { id: "attention", label: "Forespørsler", test: (r) => r.openRequest },
  { id: "consent", label: "Mangler samtykke", test: (r) => r.status === "visible" && r.consent === "unknown" },
  { id: "restricted", label: "Ikke publiser", test: (r) => r.status === "restricted" },
  { id: "anonymised", label: "Anonymisert", test: (r) => r.status === "anonymised" },
];

function presenceText(p: PersonRowView["presence"]) {
  const parts = [
    p.photos ? `${p.photos} ${p.photos === 1 ? "bilde" : "bilder"}` : "",
    p.text ? `${p.text} ${p.text === 1 ? "omtale" : "omtaler"}` : "",
    p.activities ? `${p.activities} ${p.activities === 1 ? "aktivitet" : "aktiviteter"}` : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Ingen";
}

export function PeopleTable({ rows, groups, initialView }: { rows: PersonRowView[]; groups: { id: string; label: string }[]; initialView: View }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>(initialView);
  const [group, setGroup] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("nb");
    const test = VIEWS.find((v) => v.id === view)!.test;
    return rows.filter(
      (r) =>
        test(r) &&
        (!group || r.groupIds.includes(group)) &&
        (!q || r.name.toLocaleLowerCase("nb").includes(q) || r.memberships.some((m) => m.node.toLocaleLowerCase("nb").includes(q))),
    );
  }, [rows, query, view, group]);

  const requests = rows.filter((r) => r.openRequest);

  return (
    <div>
      {requests.length > 0 && view === "all" && (
        <div className="mb-5 flex flex-col gap-3 rounded-lg border border-danger/25 bg-danger-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2.5 t-small text-ink">
            <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
            <span>
              <span className="font-semibold">{requests.length === 1 ? "1 åpen forespørsel" : `${requests.length} åpne forespørsler`} om anonymisering.</span>{" "}
              {requests.map((r) => r.name).join(", ")}.
            </span>
          </p>
          <Link href={`/admin/personer/${requests[0].id}`} className="t-small font-medium text-danger underline underline-offset-4">
            Behandle
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Visning" className="scroll-x -mx-4 flex gap-1.5 px-4 md:mx-0 md:px-0">
          {VIEWS.map((v) => {
            const count = rows.filter(v.test).length;
            return (
              <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)} className={chipClass(view === v.id)}>
                {v.label}
                <span className={cn("tnum", view === v.id ? "text-ink-inverse/70" : "text-ink-3")}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-64">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
            <label htmlFor="people-search" className="sr-only">
              Søk etter person eller gruppe
            </label>
            <input
              id="people-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søk etter navn eller gruppe"
              className="h-10 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[15px] placeholder:text-ink-3 hover:border-ink-3 focus:border-focus focus:ring-[3px] focus:ring-focus/20 focus:outline-none sm:text-sm"
            />
          </div>
          <div className="sm:w-56">
            <label htmlFor="people-group" className="sr-only">
              Gruppe
            </label>
            <Select id="people-group" value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="">Alle grupper</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
        <div
          aria-hidden
          className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_7.5rem_1rem] gap-4 border-b border-line bg-sunken/50 px-5 py-2.5 t-meta text-ink-3 lg:grid"
        >
          <span>Person</span>
          <span>Gruppe og rolle</span>
          <span>Konto</span>
          <span>Offentlig synlig i</span>
          <span>Personvern</span>
          <span />
        </div>
        {filtered.length === 0 ? (
          <p className="px-5 py-8 t-small text-ink-2">Ingen personer passer med filteret.</p>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/personer/${r.id}`}
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-sunken/50 sm:px-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_7.5rem_1rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={r.name} size={32} tone={r.status === "anonymised" ? "muted" : "neutral"} />
                    <span className="min-w-0">
                      <span className="block truncate t-label font-semibold">{r.name}</span>
                      <span className="block truncate t-small text-ink-3 lg:hidden">
                        {r.memberships.map((m) => `${m.role}, ${m.node}`).join(" · ")}
                      </span>
                      {r.birthYear && <span className="hidden t-meta text-ink-3 lg:block">Født {r.birthYear}</span>}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 justify-self-end lg:hidden">
                    {r.openRequest && <Status tone="danger">Forespørsel</Status>}
                    <PrivacyStatusBadge status={r.status} />
                  </span>
                  <span className="hidden min-w-0 t-small lg:block">
                    {r.memberships.map((m) => (
                      <span key={`${m.role}-${m.node}`} className="block truncate">
                        <span className="text-ink">{m.node}</span> <span className="text-ink-3">· {m.role}</span>
                      </span>
                    ))}
                  </span>
                  <span className="hidden truncate t-small text-ink-2 lg:block">{r.account}</span>
                  <span className={cn("col-span-2 truncate t-small lg:col-span-1", r.presence.photos + r.presence.text + r.presence.activities ? "text-ink-2" : "text-ink-3")}>
                    <span className="lg:hidden text-ink-3">Synlig i: </span>
                    {presenceText(r.presence)}
                    {r.status === "visible" && r.consent === "unknown" && <span className="text-warning"> · mangler samtykke</span>}
                  </span>
                  <span className="hidden items-center gap-1.5 lg:flex">
                    {r.openRequest ? <Status tone="danger">Forespørsel</Status> : <PrivacyStatusBadge status={r.status} />}
                  </span>
                  <ChevronRight aria-hidden className="hidden size-4 text-ink-3 transition-transform group-hover:translate-x-0.5 lg:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 t-small text-ink-3 tnum">
        Viser {filtered.length} av {rows.length}
      </p>
    </div>
  );
}
