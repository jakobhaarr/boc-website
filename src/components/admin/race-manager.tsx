"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { chooseRacePhoto, removeRace, removeRacePhoto, saveRace, setRacePhoto } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { PhotoField } from "@/components/admin/photo-field";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { Status } from "@/components/ui/primitives";
import { formatSpan } from "@/lib/club-year";
import type { PhotographerOption } from "@/lib/photo-meta";

interface RaceRow {
  id: string;
  nodeId: string;
  branch: string;
  name: string;
  date: string;
  endDate: string;
  place: string;
  format: string;
  organiser: string;
  url: string;
  ownEvent: boolean;
  groupIds: string[];
  /** The ride has a page of its own: it can be edited here, but not removed. */
  ownPage: boolean;
  /** The ride's picture on /sykkelritt, if it has one. */
  photo?: { src: string; alt: string };
}

interface Branch {
  id: string;
  name: string;
  groups: { id: string; name: string }[];
}

type Draft = Omit<RaceRow, "id" | "branch" | "ownPage" | "photo">;

const blank = (branch: string): Draft => ({ nodeId: branch, name: "", date: "", endDate: "", place: "", format: "", organiser: "", url: "", ownEvent: false, groupIds: [] });

/** The rides in the club's calendar: change one, remove one, add one. See /admin/sykkelritt. */
export function RaceManager({
  races,
  branches,
  photographers,
  clubName,
  members,
}: {
  races: RaceRow[];
  branches: Branch[];
  photographers: PhotographerOption[];
  clubName: string;
  members: { id: string; name: string; consent: "granted" | "declined" | "unknown" }[];
}) {
  const router = useRouter();
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
      const res = await saveRace({ id, ...draft });
      if (!res.ok) return setError(res.error);
      after();
      done();
    });
  const remove = (id: string) =>
    start(async () => {
      setError(null);
      const res = await removeRace(id);
      setConfirmRemove(null);
      if (!res.ok) return setError(res.error);
      done();
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <Panel id="rittene" title={`${races.length} ${races.length === 1 ? "ritt" : "ritt"}`}>
        {races.length === 0 ? (
          <p className="p-5 t-small text-ink-2">Ingen ritt ennå. Legg inn det første til høyre.</p>
        ) : (
          <ul className="divide-y divide-line">
            {races.map((r) => (
              <li key={r.id} className="px-4 py-4 sm:px-5">
                {editing === r.id ? (
                  <RaceForm
                    initial={r}
                    raceId={r.id}
                    photo={r.photo}
                    photographers={photographers}
                    clubName={clubName}
                    members={members}
                    branches={branches}
                    pending={pending}
                    error={error}
                    submitLabel="Lagre"
                    onSubmit={(draft) => save(r.id, draft, () => setEditing(null))}
                    onCancel={() => {
                      setEditing(null);
                      setError(null);
                    }}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[16px] font-semibold tracking-[-0.01em] text-ink">
                        {r.name}
                        {r.ownEvent && <Status tone="success">Klubbens eget</Status>}
                        {r.ownPage && <Status tone="neutral">Egen side</Status>}
                      </p>
                      <p className="t-small text-ink-2">
                        {formatSpan(r.date, r.endDate || undefined)} {r.date.slice(0, 4)} · {r.branch}
                      </p>
                      <p className="t-small text-ink-3">{[r.place, r.format, r.organiser].filter(Boolean).join(" · ")}</p>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover">
                          Arrangørens side
                          <ArrowUpRight aria-hidden className="size-3.5" />
                        </a>
                      )}
                    </div>
                    {confirmRemove === r.id ? (
                      <div className="grid shrink-0 justify-items-end gap-1.5 text-right t-small">
                        <p className="max-w-[13rem] text-ink-2">Fjerne rittet? Det kan ikke angres.</p>
                        <div className="flex gap-1">
                          <Button size="sm" variant="danger" disabled={pending} onClick={() => remove(r.id)}>
                            Fjern
                          </Button>
                          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmRemove(null)}>
                            Behold
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setEditing(r.id)}>
                          Rediger
                        </Button>
                        {!r.ownPage && (
                          <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmRemove(r.id)}>
                            Fjern
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {error && editing === null && (
          <p role="alert" className="border-t border-line px-5 py-3 t-small text-danger">
            {error}
          </p>
        )}
      </Panel>

      <Panel id="nytt-ritt" title="Nytt ritt">
        <div className="p-4 sm:p-5">
          <RaceForm
            key={races.length}
            initial={blank(branches[0]?.id ?? "")}
            branches={branches}
            pending={pending}
            error={editing === null ? error : null}
            submitLabel="Legg til ritt"
            icon
            onSubmit={(draft) => save(undefined, draft, () => undefined)}
          />
        </div>
      </Panel>
    </div>
  );
}

function RaceForm({
  initial,
  raceId,
  photo,
  photographers,
  clubName,
  members,
  branches,
  pending,
  error,
  submitLabel,
  icon,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  /** Set when an existing ride is edited: its picture can then be changed too. */
  raceId?: string;
  photo?: { src: string; alt: string };
  photographers?: PhotographerOption[];
  clubName?: string;
  members?: { id: string; name: string; consent: "granted" | "declined" | "unknown" }[];
  branches: Branch[];
  pending: boolean;
  error: string | null;
  submitLabel: string;
  icon?: boolean;
  onSubmit: (draft: Draft) => void;
  onCancel?: () => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((x) => ({ ...x, [key]: value }));
  const uid = `ritt-${initial.name || "ny"}`;
  const groups = branches.find((b) => b.id === d.nodeId)?.groups ?? [];

  return (
    <div className="grid gap-4">
      <Field label="Navn" htmlFor={`${uid}-navn`}>
        <Input id={`${uid}-navn`} value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
      </Field>
      <Field label="Gren" htmlFor={`${uid}-gren`}>
        <Select id={`${uid}-gren`} value={d.nodeId} onChange={(e) => setD((x) => ({ ...x, nodeId: e.target.value, groupIds: [] }))}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dato" htmlFor={`${uid}-dato`} hint="Arrangørens dato, så langt den er kunngjort.">
          <Input id={`${uid}-dato`} type="date" value={d.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Siste dag" htmlFor={`${uid}-slutt`} optional hint="For ritt over flere dager.">
          <Input id={`${uid}-slutt`} type="date" value={d.endDate} min={d.date || undefined} onChange={(e) => set("endDate", e.target.value)} />
        </Field>
      </div>
      <Field label="Sted" htmlFor={`${uid}-sted`} hint="Start eller løype, for eksempel «Rena – Lillehammer».">
        <Input id={`${uid}-sted`} value={d.place} onChange={(e) => set("place", e.target.value)} maxLength={120} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Arrangør" htmlFor={`${uid}-arr`} optional>
          <Input id={`${uid}-arr`} value={d.organiser} onChange={(e) => set("organiser", e.target.value)} maxLength={80} />
        </Field>
        <Field label="Format" htmlFor={`${uid}-format`} optional hint="For eksempel «Temporitt».">
          <Input id={`${uid}-format`} value={d.format} onChange={(e) => set("format", e.target.value)} maxLength={40} />
        </Field>
      </div>
      <Field label="Arrangørens side" htmlFor={`${uid}-url`} optional hint="Dato, pris og påmelding står hos arrangøren. Begynner med https://.">
        <Input id={`${uid}-url`} type="url" inputMode="url" value={d.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
      </Field>
      <Checkbox checked={d.ownEvent} onChange={(e) => set("ownEvent", e.target.checked)} label="Klubben arrangerer rittet selv" />
      {groups.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="mb-1 t-label text-ink">Gruppene som trener mot rittet</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {groups.map((g) => (
              <Checkbox
                key={g.id}
                checked={d.groupIds.includes(g.id)}
                onChange={(e) => set("groupIds", e.target.checked ? [...d.groupIds, g.id] : d.groupIds.filter((id) => id !== g.id))}
                label={g.name}
              />
            ))}
          </div>
          <p className="t-small text-ink-3">Rittet kommer da i terminlisten til gruppene.</p>
        </fieldset>
      )}
      {raceId ? (
        <PhotoField
          label="Bilde"
          current={photo}
          photographers={photographers ?? []}
          clubName={clubName ?? ""}
          people={(members ?? []).map((m) => ({ ...m, status: "visible" as const }))}
          showsPeople
          onUpload={(f) => {
            f.set("raceId", raceId);
            return setRacePhoto(f);
          }}
          onRemove={() => removeRacePhoto(raceId)}
          onChoose={(photoId) => chooseRacePhoto(raceId, photoId)}
        />
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong px-4 py-3 t-small text-ink-3">Du legger inn bildet etter at rittet er lagret.</p>
      )}
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => onSubmit(d)}>
          {icon && <Plus aria-hidden />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={onCancel}>
            Avbryt
          </Button>
        )}
      </div>
    </div>
  );
}
