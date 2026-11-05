"use client";

import { ChevronRight, Merge, Search, ShieldAlert, Trash2, UserMinus, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { addPeopleToGroupAction, erasePeopleAction, removePeopleFromGroupAction, type BulkResult } from "@/app/actions";
import { MergeDialog } from "@/components/admin/merge-dialog";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/field";
import { Avatar, chipClass, Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { PrivacyStatus } from "@/lib/types";
import { PrivacyStatusBadge } from "./bits";

export interface PersonRowView {
  id: string;
  name: string;
  photo?: { src: string; focal?: { x: number; y: number } };
  birthYear?: number;
  memberships: { role: string; node: string }[];
  groupIds: string[];
  /** The groups the person is directly in (not the levels above them). */
  membershipNodeIds: string[];
  sportId?: string;
  /** The address the register holds for the person (private, else public contact). */
  email?: string;
  /** What a merge may choose between (lib/merge-people.ts): each is the record's own value, or missing. */
  merge: { birth?: string; email?: string; strava?: string; portrait?: { id: string; src: string } };
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

type BulkKind = "delete" | "add" | "remove";

export function PeopleTable({
  rows,
  groups,
  initialView,
  canDelete = false,
  canMerge = false,
  manageGroups = [],
}: {
  rows: PersonRowView[];
  groups: { id: string; label: string }[];
  initialView: View;
  /** Club administrators may erase people. */
  canDelete?: boolean;
  /** Club administrators may merge duplicates. */
  canMerge?: boolean;
  /** The groups the user may add people to or take them out of. */
  manageGroups?: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<BulkKind | null>(null);
  const [bulkGroup, setBulkGroup] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{ kind: BulkKind; done: number; skipped: { name: string; reason: string }[] } | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  // The people being merged, fixed when the dialog opens: the list changes under it once the merge is done.
  const [mergeList, setMergeList] = useState<PersonRowView[]>([]);
  const allBox = useRef<HTMLInputElement>(null);
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
        (!q || r.name.toLocaleLowerCase("nb").includes(q) || (r.email ?? "").toLocaleLowerCase("nb").includes(q) || r.memberships.some((m) => m.node.toLocaleLowerCase("nb").includes(q))),
    );
  }, [rows, query, view, group]);

  // Only people who are on screen count as chosen: changing the filter or the search never leaves anyone chosen out of sight.
  const chosen = useMemo(() => filtered.filter((r) => picked.has(r.id)), [filtered, picked]);
  const allChosen = filtered.length > 0 && chosen.length === filtered.length;
  useEffect(() => {
    if (allBox.current) allBox.current.indeterminate = chosen.length > 0 && !allChosen;
  }, [chosen.length, allChosen]);
  const toggleRow = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (!n.delete(id)) n.add(id);
      return n;
    });
  const toggleAll = () => setPicked(allChosen ? new Set() : new Set(filtered.map((r) => r.id)));
  // Groups to take people out of: the ones the user runs where someone chosen is a member.
  const removable = manageGroups.filter((g) => chosen.some((r) => r.membershipNodeIds.includes(g.id)));

  const openBulk = (kind: BulkKind) => {
    setBulk(kind);
    setBulkGroup("");
    setConfirmText("");
    setBulkError(null);
    setBulkResult(null);
  };
  const closeBulk = () => {
    const finished = bulkResult !== null;
    setBulk(null);
    if (finished) setPicked(new Set());
  };
  const runBulk = () =>
    start(async () => {
      if (!bulk) return;
      setBulkError(null);
      const ids = chosen.map((r) => r.id);
      const res: BulkResult = bulk === "delete" ? await erasePeopleAction(ids, confirmText) : bulk === "add" ? await addPeopleToGroupAction(ids, bulkGroup) : await removePeopleFromGroupAction(ids, bulkGroup);
      if (!res.ok) return setBulkError(res.error);
      setBulkResult({ kind: bulk, done: res.done, skipped: res.skipped });
      announceChange();
      router.refresh();
    });
  const noun = (n: number) => `${n} ${n === 1 ? "person" : "personer"}`;

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
        <div role="group" aria-label="Visning" className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
          {VIEWS.map((v) => {
            const count = rows.filter(v.test).length;
            return (
              <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)} className={cn(chipClass(view === v.id), "justify-between sm:justify-start")}>
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
              Søk etter person, e-post eller gruppe
            </label>
            <input
              id="people-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søk etter navn, e-post eller gruppe"
              className="h-10 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-base placeholder:text-ink-3 hover:border-ink-3 focus:border-focus focus:ring-[3px] focus:ring-focus/20 focus:outline-none sm:text-sm"
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
        <div className="flex items-center border-b border-line bg-sunken/50">
          <label className="flex w-11 shrink-0 cursor-pointer items-center justify-center self-stretch pl-1 sm:w-12">
            <input ref={allBox} type="checkbox" checked={allChosen} onChange={toggleAll} disabled={filtered.length === 0} aria-label={`Velg alle ${filtered.length} i listen`} className="size-4 accent-[var(--action)]" />
          </label>
          <span className="py-2.5 t-meta text-ink-3 lg:hidden">{chosen.length > 0 ? `${chosen.length} valgt` : "Velg alle"}</span>
        <div
          aria-hidden
          className="hidden flex-1 grid-cols-[minmax(0,1.8fr)_minmax(0,1.5fr)_minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_7.5rem_1rem] gap-4 border-b border-line bg-sunken/50 py-2.5 pr-5 t-meta text-ink-3 lg:grid"
        >
          <span>Person</span>
          <span>Gruppe og rolle</span>
          <span>E-post</span>
          <span>Konto</span>
          <span>Offentlig synlig i</span>
          <span>Personvern</span>
          <span />
        </div>
        </div>
        {filtered.length === 0 ? (
          <p className="px-5 py-8 t-small text-ink-2">Ingen personer passer med filteret.</p>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((r) => (
              <li key={r.id} className={cn("flex items-stretch transition-colors", picked.has(r.id) && "bg-club-tint/60")}>
                <label className="flex w-11 shrink-0 cursor-pointer items-center justify-center pl-1 sm:w-12">
                  <input type="checkbox" checked={picked.has(r.id)} onChange={() => toggleRow(r.id)} aria-label={`Velg ${r.name}`} className="size-4 accent-[var(--action)]" />
                </label>
                <Link
                  href={`/admin/personer/${r.id}`}
                  className="group min-w-0 flex-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-sunken/50 sm:px-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.5fr)_minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1.3fr)_7.5rem_1rem]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={r.name} size={32} tone={r.status === "anonymised" ? "muted" : "neutral"} photo={r.photo} />
                    <span className="min-w-0">
                      <span className="block truncate t-label font-semibold">{r.name}</span>
                      <span className="block truncate t-small text-ink-3 lg:hidden">
                        {r.memberships.map((m) => `${m.role}, ${m.node}`).join(" · ")}
                      </span>
                      {r.email && <span className="block truncate t-small text-ink-3 lg:hidden">{r.email}</span>}
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
                  <span className="hidden truncate t-small lg:block">{r.email ? <span className="text-ink-2">{r.email}</span> : <span className="text-ink-3">Mangler</span>}</span>
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

      {/* The bulk actions: stand at the foot of the screen while anyone is chosen. */}
      {chosen.length > 0 && (
        <div role="region" aria-label="Valgte personer" className="sticky bottom-20 z-30 mt-4 lg:bottom-4">
          <div className="flex flex-col gap-3 rounded-lg bg-ink p-3 text-ink-inverse shadow-lg sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="t-small font-medium">
              {noun(chosen.length)} valgt
              {!allChosen && (
                <button type="button" onClick={toggleAll} className="ml-3 font-normal underline underline-offset-2">
                  Velg alle {filtered.length}
                </button>
              )}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {manageGroups.length > 0 && (
                <Button variant="inverse" size="sm" onClick={() => openBulk("add")}>
                  <UserPlus aria-hidden />
                  Legg til i gruppe
                </Button>
              )}
              {removable.length > 0 && (
                <Button variant="inverse" size="sm" onClick={() => openBulk("remove")}>
                  <UserMinus aria-hidden />
                  Ta ut av gruppe
                </Button>
              )}
              {canMerge && chosen.length > 1 && (
                <Button variant="inverse" size="sm" onClick={() => {
                    setMergeList(chosen);
                    setMergeOpen(true);
                  }}>
                  <Merge aria-hidden />
                  Slå sammen
                </Button>
              )}
              {canDelete && (
                <Button variant="danger" size="sm" onClick={() => openBulk("delete")}>
                  <Trash2 aria-hidden />
                  Slett
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setPicked(new Set())} className="text-ink-inverse hover:bg-white/10 hover:text-ink-inverse">
                <X aria-hidden />
                Fjern markering
              </Button>
            </div>
          </div>
        </div>
      )}

      <MergeDialog
        open={mergeOpen}
        onClose={() => {
          setMergeOpen(false);
        }}
        people={mergeList}
        onMerged={() => {
          setPicked(new Set());
          router.refresh();
        }}
      />

      <Dialog
        open={bulk !== null}
        onClose={closeBulk}
        tone={bulk === "delete" && !bulkResult ? "danger" : "default"}
        title={bulkResult ? "Ferdig" : bulk === "delete" ? `Slett ${noun(chosen.length)} for godt` : bulk === "add" ? `Legg ${noun(chosen.length)} til i en gruppe` : `Ta ${noun(chosen.length)} ut av en gruppe`}
        description={bulkResult ? undefined : bulk === "delete" ? "Navnene anonymiseres i alt som er publisert, og personene fjernes fra registeret. Dette kan ikke angres." : bulk === "add" ? "De legges til som utøvere. De som allerede er med i gruppa, og anonymiserte, hoppes over." : "De tas ut av gruppa med alle roller de har der. De blir værende i registeret."}
        footer={
          bulkResult ? (
            <Button onClick={closeBulk}>Lukk</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closeBulk} disabled={pending}>
                Avbryt
              </Button>
              <Button
                variant={bulk === "delete" ? "danger" : "primary"}
                onClick={runBulk}
                disabled={pending || chosen.length === 0 || (bulk === "delete" ? confirmText.trim().toLocaleLowerCase("nb") !== `slett ${chosen.length}` : !bulkGroup)}
              >
                {pending ? "Jobber …" : bulk === "delete" ? `Slett ${noun(chosen.length)}` : bulk === "add" ? `Legg til ${noun(chosen.length)}` : `Ta ut ${noun(chosen.length)}`}
              </Button>
            </>
          )
        }
      >
        {bulkResult ? (
          <div className="grid gap-3 t-small">
            <p className="text-ink">
              <>{bulkResult.kind === "delete" ? "Slettet" : bulkResult.kind === "add" ? "Lagt til:" : "Tatt ut:"} {noun(bulkResult.done)}.</>
            </p>
            {bulkResult.skipped.length > 0 && (
              <div>
                <p className="font-medium text-ink">{bulkResult.skipped.length === 1 ? "1 ble hoppet over:" : `${bulkResult.skipped.length} ble hoppet over:`}</p>
                <ul className="mt-1 max-h-48 list-disc overflow-auto pl-5 text-ink-2">
                  {bulkResult.skipped.map((x) => (
                    <li key={x.name}>
                      {x.name}: {x.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            <div>
              <p className="t-small font-medium text-ink">{noun(chosen.length)}:</p>
              <p className="mt-1 t-small text-ink-2">
                {chosen.slice(0, 8).map((r) => r.name).join(", ")}
                {chosen.length > 8 && ` og ${chosen.length - 8} til`}
              </p>
            </div>
            {bulk === "delete" ? (
              <div className="grid gap-1.5">
                <label htmlFor="bulk-confirm" className="t-small font-medium text-ink">
                  Skriv <span className="font-mono">slett {chosen.length}</span> for å bekrefte
                </label>
                <Input id="bulk-confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} data-autofocus />
                <p className="t-small text-ink-3">Personer som har tilgang til administrasjonen, slettes ikke. Fjern tilgangen deres først.</p>
              </div>
            ) : (
              <div className="grid gap-1.5">
                <label htmlFor="bulk-group" className="t-small font-medium text-ink">
                  Gruppe
                </label>
                <Select id="bulk-group" value={bulkGroup} onChange={(e) => setBulkGroup(e.target.value)}>
                  <option value="">Velg gruppe</option>
                  {(bulk === "add" ? manageGroups : removable).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {bulkError && (
              <p role="alert" className="t-small text-danger">
                {bulkError}
              </p>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
