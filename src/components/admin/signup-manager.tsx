"use client";

import { Archive, ArchiveRestore, ArrowUpRight, Info, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteSignup, saveSignup, setSignupArchived } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export interface SignupRowView {
  id: string;
  title: string;
  summary: string;
  kind: "form" | "banner";
  href: string;
  linkLabel: string;
  opensOn: string;
  closesOn: string;
  capacity: string;
  onFront: boolean;
  nodeIds: string[];
  archived: boolean;
  /** «Åpen», «Stengt», «Åpner senere» or «Arkivert». */
  stateLabel: string;
  stateTone: "success" | "neutral" | "warning";
  /** «Forsiden» and the groups' names, for the cards. */
  placeLabels: string[];
  responses: number;
  /** «12 av 30» for a form with a capacity, else «12». */
  responsesLabel: string;
}

export interface PlacementGroup {
  id: string;
  label: string;
}

type Draft = Pick<SignupRowView, "title" | "summary" | "kind" | "href" | "linkLabel" | "opensOn" | "closesOn" | "capacity" | "onFront" | "nodeIds">;

const blank = (): Draft => ({ title: "", summary: "", kind: "form", href: "", linkLabel: "", opensOn: "", closesOn: "", capacity: "", onFront: true, nodeIds: [] });

/**
 * Påmeldinger: make, change, archive and delete the club's sign-ups. A sign-up is a form on the site or only a banner that sends
 * on to Spond (or another page), and is placed on the front page, on chosen groups' pages, or both. An archived sign-up is kept with
 * its answers but shrinks to one pale line. See lib/signups.ts.
 */
export function SignupManager({ rows, groups, mallorca }: { rows: SignupRowView[]; groups: PlacementGroup[]; mallorca?: { stateLabel: string; summary: string } }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const done = () => {
    announceChange();
    router.refresh();
  };
  const save = (id: string | undefined, draft: Draft, after: () => void) =>
    start(async () => {
      setError(null);
      const res = await saveSignup({ id, ...draft });
      if (!res.ok) return setError(res.error);
      after();
      done();
    });
  const archive = (id: string, archived: boolean) =>
    start(async () => {
      setError(null);
      const res = await setSignupArchived(id, archived);
      if (!res.ok) return setError(res.error);
      done();
    });
  const remove = (id: string) =>
    start(async () => {
      setError(null);
      const res = await deleteSignup(id);
      setConfirmRemove(null);
      if (!res.ok) return setError(res.error);
      done();
    });

  const active = rows.filter((r) => !r.archived);
  const archived = rows.filter((r) => r.archived);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="t-small text-ink-2">Hver påmelding kan stå på forsiden, på bestemte grupper, eller begge steder.</p>
        {!creating && (
          <Button className="max-sm:w-full" onClick={() => { setCreating(true); setEditing(null); setError(null); }}>
            <Plus aria-hidden />
            Ny påmelding
          </Button>
        )}
      </div>

      {creating && (
        <Panel title="Ny påmelding">
          <div className="p-4 sm:p-5">
            <SignupForm initial={blank()} groups={groups} pending={pending} error={error} submitLabel="Opprett påmelding" onSubmit={(d) => save(undefined, d, () => setCreating(false))} onCancel={() => { setCreating(false); setError(null); }} />
          </div>
        </Panel>
      )}

      <Panel title={`Aktive påmeldinger`}>
        <ul className="divide-y divide-line">
          {mallorca && (
            <li className="px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[16px] font-semibold tracking-[-0.01em] text-ink">
                    Mallorca-turen
                    <Status tone="neutral">Innebygd</Status>
                    <Status tone="success">{mallorca.stateLabel}</Status>
                  </p>
                  <p className="mt-1 t-small text-ink-2">{mallorca.summary}</p>
                </div>
                <Link href="/admin/mallorca" className="inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover">
                  Åpne deltakerlisten
                  <ArrowUpRight aria-hidden className="size-3.5" />
                </Link>
              </div>
            </li>
          )}
          {active.length === 0 && !mallorca && <li className="p-5 t-small text-ink-2">Ingen påmeldinger ennå. Lag den første med «Ny påmelding».</li>}
          {active.map((r) => (
            <li key={r.id} className="px-4 py-4 sm:px-5">
              {editing === r.id ? (
                <SignupForm initial={r} groups={groups} pending={pending} error={error} submitLabel="Lagre" onSubmit={(d) => save(r.id, d, () => setEditing(null))} onCancel={() => { setEditing(null); setError(null); }} />
              ) : (
                <div className="grid gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[16px] font-semibold tracking-[-0.01em] text-ink">
                        {r.title}
                        <Status tone={r.stateTone}>{r.stateLabel}</Status>
                        <Status tone="neutral">{r.kind === "form" ? "Skjema" : "Banner"}</Status>
                      </p>
                      <p className="mt-1 max-w-[70ch] t-small text-ink-2">{r.summary}</p>
                      <p className="mt-1 t-small text-ink-3">
                        Vises på: {r.placeLabels.length ? r.placeLabels.join(", ") : "ingen steder"}
                        {(r.opensOn || r.closesOn) && ` · ${[r.opensOn && `fra ${r.opensOn}`, r.closesOn && `til ${r.closesOn}`].filter(Boolean).join(" ")}`}
                      </p>
                      {r.kind === "form" ? (
                        <Link href={`/admin/pameldinger/${r.id}`} className="mt-1 inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover">
                          {r.responsesLabel} {r.responses === 1 ? "svar" : "svar"}, se listen
                        </Link>
                      ) : (
                        <a href={r.href} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover">
                          Lenken banneret går til
                          <ArrowUpRight aria-hidden className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  {r.kind === "form" && (
                    <p className="flex items-start gap-2 rounded-md bg-warning-surface px-3 py-2 t-small text-ink">
                      <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
                      Vurder om denne påmeldingen heller bør ligge i Spond. Der får deltakerne påminnelser og svar, og klubben slipper å holde styr på personopplysninger her. Bruk et banner som lenker til Spond i stedet.
                    </p>
                  )}
                  {confirmRemove === r.id ? (
                    <div className="grid gap-2 rounded-md bg-danger-surface p-3 t-small">
                      <p className="text-ink">Slette påmeldingen{r.responses > 0 ? ` og de ${r.responses} svarene` : ""}? Det kan ikke angres. Arkivering beholder dem.</p>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button size="sm" variant="danger" disabled={pending} className="max-sm:w-full" onClick={() => remove(r.id)}>
                          Slett
                        </Button>
                        <Button size="sm" variant="secondary" disabled={pending} className="max-sm:w-full" onClick={() => setConfirmRemove(null)}>
                          Behold
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button size="sm" variant="secondary" className="max-sm:w-full" onClick={() => { setEditing(r.id); setCreating(false); setError(null); }}>
                        Rediger
                      </Button>
                      <Button size="sm" variant="secondary" disabled={pending} className="max-sm:w-full" onClick={() => archive(r.id, true)}>
                        <Archive aria-hidden />
                        Arkiver
                      </Button>
                      <Button size="sm" variant="ghost" className="max-sm:w-full" onClick={() => setConfirmRemove(r.id)}>
                        Slett
                      </Button>
                    </div>
                  )}
                  {error && editing !== r.id && (
                    <p role="alert" className="t-small text-danger">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      {archived.length > 0 && (
        <section aria-label="Arkiverte påmeldinger" className="grid gap-2">
          <h2 className="t-label font-semibold text-ink-3">Arkiverte påmeldinger</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-sunken/50">
            {archived.map((r) => (
              <li key={r.id} className={cn("flex flex-col gap-2 px-4 py-2.5 opacity-70 sm:flex-row sm:items-center sm:gap-3")}>
                <p className="min-w-0 flex-1 truncate t-small text-ink-2">
                  <span className="font-medium">{r.title}</span>
                  <span className="text-ink-3"> · {r.kind === "form" ? `${r.responses} svar` : "Banner"}</span>
                </p>
                {r.kind === "form" && (
                  <Link href={`/admin/pameldinger/${r.id}`} className="t-small text-club hover:text-club-hover">
                    Se svarene
                  </Link>
                )}
                <Button size="sm" variant="ghost" disabled={pending} className="max-sm:w-full" onClick={() => archive(r.id, false)}>
                  <ArchiveRestore aria-hidden />
                  Hent tilbake
                </Button>
                {confirmRemove === r.id ? (
                  <Button size="sm" variant="danger" disabled={pending} className="max-sm:w-full" onClick={() => remove(r.id)}>
                    Bekreft sletting
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="max-sm:w-full" onClick={() => setConfirmRemove(r.id)}>
                    Slett
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {error && (
            <p role="alert" className="t-small text-danger">
              {error}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function SignupForm({
  initial,
  groups,
  pending,
  error,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  groups: PlacementGroup[];
  pending: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (d: Draft) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Draft>({ title: initial.title, summary: initial.summary, kind: initial.kind, href: initial.href, linkLabel: initial.linkLabel, opensOn: initial.opensOn, closesOn: initial.closesOn, capacity: initial.capacity, onFront: initial.onFront, nodeIds: initial.nodeIds });
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((x) => ({ ...x, [key]: value }));
  const uid = `pam-${initial.title ? initial.title.length : "ny"}-${initial.kind}`;
  const [filter, setFilter] = useState("");
  const shown = groups.filter((g) => g.label.toLocaleLowerCase("nb").includes(filter.trim().toLocaleLowerCase("nb")));

  return (
    <div className="grid gap-4">
      <Field label="Hva slags påmelding?" htmlFor={`${uid}-type`}>
        <Select id={`${uid}-type`} value={d.kind} onChange={(e) => set("kind", e.target.value as Draft["kind"])}>
          <option value="form">Skjema på nettsiden</option>
          <option value="banner">Bare et banner som lenker til Spond (eller en annen side)</option>
        </Select>
      </Field>
      {d.kind === "form" && (
        <p className="flex items-start gap-2 rounded-md bg-warning-surface px-3 py-2 t-small text-ink">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
          Vurder om denne påmeldingen heller bør ligge i Spond. Der får deltakerne påminnelser og svar, og du slipper å ta vare på personopplysninger her. Velg da «Bare et banner» og lim inn lenken til Spond.
        </p>
      )}
      <Field label="Tittel" htmlFor={`${uid}-tittel`}>
        <Input id={`${uid}-tittel`} value={d.title} onChange={(e) => set("title", e.target.value)} maxLength={90} />
      </Field>
      <Field label="Tekst på banneret" htmlFor={`${uid}-tekst`} hint="Noen linjer: hva det er, når, og hvem det er for.">
        <Textarea id={`${uid}-tekst`} rows={3} value={d.summary} onChange={(e) => set("summary", e.target.value)} maxLength={400} />
      </Field>
      {d.kind === "banner" && (
        <Field label="Lenke" htmlFor={`${uid}-lenke`} hint="Begynner med https://, for eksempel lenken til gruppen eller arrangementet i Spond.">
          <Input id={`${uid}-lenke`} type="url" inputMode="url" value={d.href} onChange={(e) => set("href", e.target.value)} placeholder="https://" />
        </Field>
      )}
      <Field label="Tekst på knappen" htmlFor={`${uid}-knapp`} optional hint="«Meld deg på» hvis du lar den stå tom.">
        <Input id={`${uid}-knapp`} value={d.linkLabel} onChange={(e) => set("linkLabel", e.target.value)} maxLength={40} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Første dag" htmlFor={`${uid}-fra`} optional hint="Vises fra og med denne dagen.">
          <Input id={`${uid}-fra`} type="date" value={d.opensOn} onChange={(e) => set("opensOn", e.target.value)} />
        </Field>
        <Field label="Siste dag" htmlFor={`${uid}-til`} optional hint="Vises til og med denne dagen.">
          <Input id={`${uid}-til`} type="date" value={d.closesOn} min={d.opensOn || undefined} onChange={(e) => set("closesOn", e.target.value)} />
        </Field>
      </div>
      {d.kind === "form" && (
        <Field label="Antall plasser" htmlFor={`${uid}-plasser`} optional hint="Skjemaet stenger når så mange har meldt seg på.">
          <Input id={`${uid}-plasser`} type="number" inputMode="numeric" min={1} max={500} value={d.capacity} onChange={(e) => set("capacity", e.target.value)} />
        </Field>
      )}

      <fieldset className="grid gap-2">
        <legend className="mb-1 t-label text-ink">Hvor skal den stå?</legend>
        <Checkbox checked={d.onFront} onChange={(e) => set("onFront", e.target.checked)} label="Forsiden" />
        <p className="mt-1 t-small text-ink-3">Og på disse gruppene (velg så mange du vil):</p>
        <Input aria-label="Søk blant gruppene" placeholder="Søk blant gruppene" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <div className="grid max-h-64 gap-2 overflow-y-auto rounded-md border border-line p-3 sm:grid-cols-2">
          {shown.length === 0 && <p className="t-small text-ink-3">Ingen grupper passer.</p>}
          {shown.map((g) => (
            <Checkbox key={g.id} checked={d.nodeIds.includes(g.id)} onChange={(e) => set("nodeIds", e.target.checked ? [...d.nodeIds, g.id] : d.nodeIds.filter((id) => id !== g.id))} label={g.label} />
          ))}
        </div>
        <p className="t-small text-ink-3">{d.nodeIds.length === 0 ? "Ingen grupper valgt." : `${d.nodeIds.length} ${d.nodeIds.length === 1 ? "gruppe" : "grupper"} valgt.`}</p>
      </fieldset>

      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button disabled={pending} className="max-sm:w-full" onClick={() => onSubmit(d)}>
          {pending ? "Lagrer …" : submitLabel}
        </Button>
        <Button variant="secondary" disabled={pending} className="max-sm:w-full" onClick={onCancel}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}
