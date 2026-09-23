"use client";

import { ArrowUpRight, ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { createNode } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button, buttonClass } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { NodeKind } from "@/lib/types";

export interface StructureNode {
  id: string;
  parentId: string | null;
  name: string;
  kind: NodeKind;
  levelLabel: string;
  ageLabel?: string;
  href: string;
  groups: number;
  athletes: number;
  staff: number;
  weekly: number;
  upcoming: number;
  stories: number;
  rollup: string[];
  access: { name: string; role: string; from: string; inherited: boolean; needsApproval: boolean }[];
  contacts: { name: string; title: string }[];
  canManage: boolean;
  path: string;
}

const LEVELS: { kind: NodeKind; label: string; optional: boolean }[] = [
  { kind: "club", label: "Klubb", optional: false },
  { kind: "sport", label: "Idrett", optional: false },
  { kind: "discipline", label: "Gren / avdeling", optional: true },
  { kind: "ageGroup", label: "Aldersgruppe", optional: true },
  { kind: "team", label: "Lag / gruppe", optional: true },
];
const ORDER: NodeKind[] = ["club", "sport", "discipline", "ageGroup", "team"];

/**
 * The organisation as side-by-side sport lanes rather than a folder tree.
 * Selecting a node explains what that position in the hierarchy means:
 * where its content appears, who can work on it, and what hangs below.
 */
export function StructureExplorer({
  nodes,
  rootId,
  initialId,
  roles,
}: {
  nodes: StructureNode[];
  rootId: string;
  initialId: string;
  roles: { role: string; explainer: string; examples: string[] }[];
}) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const children = (id: string) => nodes.filter((n) => n.parentId === id);
  const [selectedId, setSelectedId] = useState(byId.has(initialId) ? initialId : rootId);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", kind: "team" as NodeKind, ageLabel: "" });
  const [createError, setCreateError] = useState("");
  const [created, setCreated] = useState<{ name: string; href: string } | null>(null);
  const [pending, start] = useTransition();
  const detailRef = useRef<HTMLElement>(null);
  const router = useRouter();

  const root = byId.get(rootId)!;
  const selected = byId.get(selectedId) ?? root;
  const sports = children(rootId);

  const select = (id: string) => {
    setSelectedId(id);
    setCreated(null);
    if (window.matchMedia("(max-width: 1279px)").matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const allowedKinds = ORDER.slice(ORDER.indexOf(selected.kind) + 1);

  const openCreate = () => {
    setDraft({ name: "", kind: allowedKinds[allowedKinds.length - 1] ?? "team", ageLabel: "" });
    setCreateError("");
    setCreateOpen(true);
  };

  const submitCreate = () =>
    start(async () => {
      const res = await createNode({ parentId: selected.id, name: draft.name, kind: draft.kind, ageLabel: draft.ageLabel });
      if (!res.ok) return setCreateError(res.error);
      announceChange();
      setCreateOpen(false);
      setCreated({ name: draft.name.trim(), href: res.href });
      router.refresh();
      setSelectedId(res.id);
    });

  const Row = ({ node, depth }: { node: StructureNode; depth: number }) => {
    const kids = children(node.id);
    const active = node.id === selected.id;
    return (
      <li>
        <button
          type="button"
          aria-pressed={active}
          onClick={() => select(node.id)}
          style={{ paddingLeft: `${14 + depth * 18}px` }}
          className={cn(
            "relative flex w-full items-center gap-2.5 py-2 pr-3 text-left transition-colors duration-150",
            active ? "bg-sunken" : "hover:bg-sunken/50",
          )}
        >
          {active && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-ink" />}
          <span
            aria-hidden
            className={cn("size-1.5 shrink-0 rounded-full", kids.length ? "bg-ink-3" : "bg-line-strong")}
          />
          <span className={cn("min-w-0 flex-1 truncate t-small", kids.length ? "font-medium text-ink" : "text-ink")}>{node.name}</span>
          <span className="shrink-0 t-meta text-ink-3">{node.levelLabel}</span>
        </button>
        {kids.length > 0 && (
          <ul className="relative before:absolute before:top-0 before:bottom-3 before:left-[var(--guide)] before:w-px before:bg-line" style={{ "--guide": `${16.5 + depth * 18}px` } as React.CSSProperties}>
            {kids.map((k) => (
              <Row key={k.id} node={k} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div>
      {/* Level legend */}
      <ol aria-label="Nivåer" className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {LEVELS.map((l, i) => (
          <li key={l.kind} className="flex items-center gap-1.5">
            <span
              className={cn(
                "rounded-sm border px-2 py-1 t-meta",
                l.optional ? "border-dashed border-line-strong text-ink-2" : "border-ink-3 bg-surface text-ink",
              )}
            >
              {l.label}
            </span>
            {i < LEVELS.length - 1 && <ChevronRight aria-hidden className="size-3.5 text-ink-3" />}
          </li>
        ))}
        <li className="ml-2 t-small text-ink-3">Stiplede nivåer kan hoppes over. Langrenn har for eksempel ingen grener.</li>
      </ol>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div>
          <button
            type="button"
            onClick={() => select(rootId)}
            aria-pressed={selected.id === rootId}
            className={cn(
              "flex w-full items-center justify-between gap-4 rounded-lg border bg-surface px-4 py-3 text-left transition-colors",
              selected.id === rootId ? "border-ink" : "border-line hover:border-line-strong",
            )}
          >
            <span>
              <span className="block t-label font-semibold">{root.name}</span>
              <span className="block t-small text-ink-3">
                {sports.length} idretter · {root.groups} grupper · {root.athletes} utøvere · {root.staff} trenere og ledere
              </span>
            </span>
            <span className="t-meta text-ink-3">Klubb</span>
          </button>

          <div className="mt-3 grid items-start gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {sports.map((s) => (
              <section key={s.id} aria-label={s.name} className="overflow-hidden rounded-lg border border-line bg-surface">
                <button
                  type="button"
                  onClick={() => select(s.id)}
                  aria-pressed={selected.id === s.id}
                  className={cn("flex w-full items-baseline justify-between gap-3 border-b border-line px-4 py-3 text-left transition-colors", selected.id === s.id ? "bg-sunken" : "hover:bg-sunken/50")}
                >
                  <span className="t-label font-semibold">{s.name}</span>
                  <span className="t-meta text-ink-3 tnum">
                    {s.groups} grupper · {s.athletes + s.staff} personer
                  </span>
                </button>
                <ul className="py-1.5">
                  {children(s.id).map((c) => (
                    <Row key={c.id} node={c} depth={0} />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section aria-labelledby="roller" className="mt-10">
            <h2 id="roller" className="t-label font-semibold">
              Roller
            </h2>
            <p className="mt-0.5 t-small text-ink-3">En rolle gis på ett nivå og gjelder alt under. Mange kan bidra uten å få tilgang til hele nettsiden.</p>
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface">
              {roles.map((r) => (
                <li key={r.role} className="grid gap-1 px-4 py-3 md:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-4">
                  <span className="t-label font-semibold">{r.role}</span>
                  <span className="t-small text-ink-2">{r.explainer}</span>
                  <span className="t-small text-ink-3">{r.examples.join(", ")}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Detail */}
        <aside ref={detailRef} aria-label={`Detaljer for ${selected.name}`} className="scroll-mt-20 xl:sticky xl:top-20 xl:self-start">
          <div key={selected.id} className="overflow-hidden rounded-lg border border-line bg-surface anim-fade">
            <div className="border-b border-line p-5">
              {selected.path && <p className="truncate t-small text-ink-3">{selected.path.split(" › ").slice(0, -1).join(" › ") || selected.levelLabel}</p>}
              <h2 className="mt-0.5 text-xl leading-tight font-semibold tracking-[-0.015em]">{selected.name}</h2>
              <p className="mt-0.5 t-small text-ink-2">
                {selected.levelLabel}
                {selected.ageLabel ? ` · ${selected.ageLabel}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={selected.href} target="_blank" rel="noreferrer" className={buttonClass({ variant: "secondary", size: "sm" })}>
                  Offentlig side <ArrowUpRight aria-hidden />
                </a>
                {selected.canManage && allowedKinds.length > 0 && (
                  <Button variant="secondary" size="sm" onClick={openCreate}>
                    <Plus aria-hidden /> Legg til under
                  </Button>
                )}
              </div>
              {created && (
                <p className="mt-4 rounded-md bg-success-surface px-3 py-2.5 t-small">
                  {created.name} er opprettet og har fått sin egen side.{" "}
                  <a href={created.href} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                    Åpne siden
                  </a>
                </p>
              )}
            </div>

            <dl className="grid grid-cols-3 divide-x divide-line border-b border-line text-center">
              {(
                [
                  [selected.groups, selected.groups === 1 ? "gruppe" : "grupper"],
                  [selected.athletes, "utøvere"],
                  [selected.weekly, "faste økter"],
                ] as const
              ).map(([n, label]) => (
                <div key={label} className="px-2 py-3">
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-lg leading-none font-semibold tnum">{n}</dd>
                  <dd className="mt-1 t-meta text-ink-3">{label}</dd>
                </div>
              ))}
            </dl>

            {selected.id !== rootId && (
              <section className="border-b border-line p-5">
                <h3 className="t-meta text-ink-3">Innhold herfra vises også på</h3>
                <ul className="mt-2 flex flex-wrap items-center gap-1.5 t-small">
                  <li className="rounded-sm bg-inverse px-2 py-0.5 text-ink-inverse">{selected.name}</li>
                  {selected.rollup.map((r) => (
                    <li key={r} className="flex items-center gap-1.5">
                      <ChevronRight aria-hidden className="size-3 text-ink-3" />
                      <span className="rounded-sm border border-line px-2 py-0.5">{r}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-1.5">
                    <ChevronRight aria-hidden className="size-3 text-ink-3" />
                    <span className="rounded-sm border border-dashed border-line-strong px-2 py-0.5 text-ink-3">Forsiden, ved godkjenning</span>
                  </li>
                </ul>
                <p className="mt-3 t-small text-ink-3">
                  {selected.upcoming} aktiviteter de neste to ukene · {selected.stories} publiserte innlegg
                </p>
              </section>
            )}

            <section className="border-b border-line p-5">
              <h3 className="t-meta text-ink-3">Hvem har tilgang</h3>
              <ul className="mt-2 space-y-2.5">
                {selected.access.map((a) => (
                  <li key={a.name} className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block t-label">{a.name}</span>
                      <span className="block t-small text-ink-3">
                        {a.role}
                        {a.inherited ? ` · arvet fra ${a.from}` : " · gitt her"}
                      </span>
                    </span>
                    {a.needsApproval ? <Status tone="warning">Godkjenning</Status> : !a.inherited ? <Status tone="neutral">Direkte</Status> : null}
                  </li>
                ))}
              </ul>
            </section>

            <section className="p-5">
              <h3 className="t-meta text-ink-3">Kontaktpersoner på nettsiden</h3>
              {selected.contacts.length ? (
                <ul className="mt-2 space-y-1.5">
                  {selected.contacts.map((c) => (
                    <li key={c.name} className="flex justify-between gap-3 t-small">
                      <span className="text-ink">{c.name}</span>
                      <span className="text-ink-3">{c.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 t-small text-warning">Ingen kontaktperson. Siden viser kontakt fra nivået over.</p>
              )}
            </section>
          </div>
        </aside>
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={`Legg til under ${selected.name}`}
        description="Den nye gruppen får en offentlig side med én gang, og vises i kalenderfiltre og menyer."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={submitCreate} disabled={pending || !draft.name.trim()}>
              {pending ? "Oppretter …" : "Opprett"}
            </Button>
          </>
        }
      >
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitCreate();
          }}
        >
          <Field label="Navn" htmlFor="node-name" hint={selected.kind === "ageGroup" ? `For eksempel ${selected.name}-3` : undefined} error={createError || undefined}>
            <Input id="node-name" data-autofocus value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </Field>
          <Field label="Nivå" htmlFor="node-kind" hint="Nivåer kan hoppes over — et lag kan ligge rett under en idrett.">
            <Select id="node-kind" value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as NodeKind }))}>
              {allowedKinds.map((k) => (
                <option key={k} value={k}>
                  {LEVELS.find((l) => l.kind === k)?.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Alder" htmlFor="node-age" optional>
            <Input id="node-age" placeholder={selected.ageLabel ?? "For eksempel 13–14 år"} value={draft.ageLabel} onChange={(e) => setDraft((d) => ({ ...d, ageLabel: e.target.value }))} />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
