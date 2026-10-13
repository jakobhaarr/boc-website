"use client";

import { ArrowUpRight, Plus, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addRoutePhoto, removeRoute, removeRoutePhoto, saveRoute, setRouteMainPhoto } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { PhotoField } from "@/components/admin/photo-field";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Status } from "@/components/ui/primitives";
import type { PhotographerOption } from "@/lib/photo-meta";
import { MAX_STOPS, STOP_KINDS } from "@/lib/route-edit";
import type { RouteStop } from "@/lib/types";

interface RouteRow {
  id: string;
  nodeId: string;
  branch: string;
  name: string;
  stravaUrl: string;
  distanceKm: number;
  elevationM: number;
  mallorca: boolean;
  description: string;
  photos: { id: string; src: string; alt: string }[];
  stops: RouteStop[];
}

interface Branch {
  id: string;
  name: string;
}

/** What the form holds: the numbers as the text typed, so «12,5» and an empty field are both kept as they are until saved. */
interface Draft {
  nodeId: string;
  name: string;
  stravaUrl: string;
  distanceKm: string;
  elevationM: string;
  mallorca: boolean;
  description: string;
  stops: { kind: RouteStop["kind"]; name: string; where: string }[];
}

const blank = (branch: string): Draft => ({ nodeId: branch, name: "", stravaUrl: "", distanceKm: "", elevationM: "", mallorca: false, description: "", stops: [] });
const draftOf = (r: RouteRow): Draft => ({
  nodeId: r.nodeId,
  name: r.name,
  stravaUrl: r.stravaUrl,
  distanceKm: String(r.distanceKm).replace(".", ","),
  elevationM: String(r.elevationM),
  mallorca: r.mallorca,
  description: r.description,
  // Coordinates are shown as «lat, lon» and an address as it was typed, so it can be edited in the same field.
  stops: r.stops.map((s) => ({ kind: s.kind, name: s.name, where: s.address ?? `${s.lat}, ${s.lon}` })),
});
const number = (text: string) => Number(text.trim().replace(/\s/g, "").replace(",", "."));

const nb = (n: number, digits = 0) => n.toLocaleString("nb-NO", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** The recommended tours: change one, remove one, add one, and add pictures to it. See /admin/turer. */
export function RouteManager({
  routes,
  branches,
  photographers,
  clubName,
  members,
}: {
  routes: RouteRow[];
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
  const save = (id: string | undefined, d: Draft, after: () => void) =>
    start(async () => {
      setError(null);
      const res = await saveRoute({ id, nodeId: d.nodeId, name: d.name, stravaUrl: d.stravaUrl, distanceKm: number(d.distanceKm), elevationM: number(d.elevationM), mallorca: d.mallorca, description: d.description, stops: d.stops });
      if (!res.ok) return setError(res.error);
      after();
      done();
    });
  const remove = (id: string) =>
    start(async () => {
      setError(null);
      const res = await removeRoute(id);
      setConfirmRemove(null);
      if (!res.ok) return setError(res.error);
      done();
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <Panel id="turene" title={`${routes.length} ${routes.length === 1 ? "tur" : "turer"}`}>
        {routes.length === 0 ? (
          <p className="p-5 t-small text-ink-2">Ingen turer ennå. Legg inn den første til høyre.</p>
        ) : (
          <ul className="divide-y divide-line">
            {routes.map((r) => (
              <li key={r.id} className="px-4 py-4 sm:px-5">
                {editing === r.id ? (
                  <RouteForm
                    initial={draftOf(r)}
                    route={r}
                    photographers={photographers}
                    clubName={clubName}
                    members={members}
                    branches={branches}
                    pending={pending}
                    error={error}
                    submitLabel="Lagre"
                    onSubmit={(d) => save(r.id, d, () => setEditing(null))}
                    onCancel={() => {
                      setEditing(null);
                      setError(null);
                    }}
                    onChanged={done}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-[16px] font-semibold tracking-[-0.01em] text-ink">
                        {r.name}
                        {r.mallorca && <Status tone="neutral">Mallorca</Status>}
                      </p>
                      <p className="t-small text-ink-2">
                        {nb(r.distanceKm, Number.isInteger(r.distanceKm) ? 0 : 1)} km · {nb(r.elevationM)} høydemeter · {r.branch} · {r.photos.length} {r.photos.length === 1 ? "bilde" : "bilder"}
                      </p>
                      <a href={r.stravaUrl} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover">
                        Turen på Strava
                        <ArrowUpRight aria-hidden className="size-3.5" />
                      </a>
                    </div>
                    {confirmRemove === r.id ? (
                      <div className="grid shrink-0 justify-items-end gap-1.5 text-right t-small">
                        <p className="max-w-[13rem] text-ink-2">Fjerne turen og bildene? Det kan ikke angres.</p>
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
                        <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmRemove(r.id)}>
                          Fjern
                        </Button>
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

      <Panel id="ny-tur" title="Ny tur">
        <div className="p-4 sm:p-5">
          <RouteForm
            key={routes.length}
            initial={blank(branches[0]?.id ?? "")}
            branches={branches}
            pending={pending}
            error={editing === null ? error : null}
            submitLabel="Legg til tur"
            icon
            onSubmit={(d) => save(undefined, d, () => undefined)}
          />
        </div>
      </Panel>
    </div>
  );
}

function RouteForm({
  initial,
  route,
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
  onChanged,
}: {
  initial: Draft;
  /** Set when an existing tour is edited: its pictures can then be changed too. */
  route?: RouteRow;
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
  onChanged?: () => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((x) => ({ ...x, [key]: value }));
  const uid = `tur-${route?.id ?? "ny"}`;
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [busy, startPhoto] = useTransition();

  const photoAction = (run: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    startPhoto(async () => {
      setPhotoError(null);
      const res = await run();
      if (!res.ok) return setPhotoError(res.error);
      onChanged?.();
    });

  return (
    <div className="grid gap-4">
      <Field label="Navn" htmlFor={`${uid}-navn`}>
        <Input id={`${uid}-navn`} value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={80} />
      </Field>
      <Field label="Lenke til turen på Strava" htmlFor={`${uid}-strava`} hint="Lim inn lenken til ruten. Den begynner med https:// og er fra strava.com eller en delt strava.app.link.">
        <Input id={`${uid}-strava`} type="url" inputMode="url" value={d.stravaUrl} onChange={(e) => set("stravaUrl", e.target.value)} placeholder="https://www.strava.com/routes/…" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lengde, km" htmlFor={`${uid}-km`} hint="For eksempel 87,5.">
          <Input id={`${uid}-km`} inputMode="decimal" value={d.distanceKm} onChange={(e) => set("distanceKm", e.target.value)} />
        </Field>
        <Field label="Høydemeter" htmlFor={`${uid}-hm`} hint="Samlet stigning, hele meter.">
          <Input id={`${uid}-hm`} inputMode="numeric" value={d.elevationM} onChange={(e) => set("elevationM", e.target.value)} />
        </Field>
      </div>
      <p className="-mt-2 t-small text-ink-3">Tallene skriver du inn selv fra Strava. Siden henter ingenting derfra.</p>
      <Checkbox checked={d.mallorca} onChange={(e) => set("mallorca", e.target.checked)} label="Turen går på Mallorca" />
      {branches.length > 1 && (
        <Field label="Gren" htmlFor={`${uid}-gren`}>
          <Select id={`${uid}-gren`} value={d.nodeId} onChange={(e) => set("nodeId", e.target.value)}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Beskrivelse" htmlFor={`${uid}-tekst`} optional hint="Noen linjer om hvordan turen er: underlag, trafikk, kaffestopp.">
        <Textarea id={`${uid}-tekst`} rows={3} value={d.description} onChange={(e) => set("description", e.target.value)} maxLength={500} />
      </Field>

      <fieldset className="grid gap-3">
        <legend className="t-label text-ink">Anbefalte stopp</legend>
        <p className="-mt-1 t-small text-ink-3">Bollestopp, kaffe eller toalett langs ruten. Skriv koordinater (for eksempel 59.9123, 10.5123) eller en adresse. Siden lager en lenke til kartet, og slår ikke opp noe selv.</p>
        {d.stops.map((s, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <Select aria-label={`Stopp ${i + 1}, type`} value={s.kind} onChange={(e) => set("stops", d.stops.map((x, j) => (j === i ? { ...x, kind: e.target.value as RouteStop["kind"] } : x)))}>
              {STOP_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </Select>
            <Input aria-label={`Stopp ${i + 1}, navn`} placeholder="Navn, for eksempel Kaffebrenneriet" value={s.name} maxLength={60} onChange={(e) => set("stops", d.stops.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <Input
              className="sm:col-span-2"
              aria-label={`Stopp ${i + 1}, koordinater eller adresse`}
              placeholder="Koordinater eller adresse"
              value={s.where}
              maxLength={120}
              onChange={(e) => set("stops", d.stops.map((x, j) => (j === i ? { ...x, where: e.target.value } : x)))}
            />
            <div className="sm:col-span-2">
              <Button size="sm" variant="ghost" onClick={() => set("stops", d.stops.filter((_, j) => j !== i))}>
                <Trash2 aria-hidden />
                Fjern stoppet
              </Button>
            </div>
          </div>
        ))}
        {d.stops.length < MAX_STOPS && (
          <div>
            <Button size="sm" variant="secondary" onClick={() => set("stops", [...d.stops, { kind: "kaffe", name: "", where: "" }])}>
              <Plus aria-hidden />
              Legg til stopp
            </Button>
          </div>
        )}
      </fieldset>

      {route ? (
        <div className="grid gap-3">
          <p className="t-label text-ink">Bilder fra turen</p>
          {route.photos.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {route.photos.map((p, i) => (
                <li key={p.id} className="grid gap-1.5">
                  <div className="overflow-hidden rounded-lg border border-line bg-sunken">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt={p.alt} className="aspect-[4/3] w-full object-cover" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {i === 0 ? (
                      <span className="inline-flex h-8 items-center gap-1 px-1 t-small font-medium text-ink-2">
                        <Star aria-hidden className="size-3.5" />
                        Hovedbilde
                      </span>
                    ) : (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => photoAction(() => setRouteMainPhoto(route.id, p.id))}>
                        Gjør til hovedbilde
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => photoAction(() => removeRoutePhoto(route.id, p.id))} aria-label={`Fjern bilde ${i + 1}`}>
                      <Trash2 aria-hidden />
                      Fjern
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {photoError && (
            <p role="alert" className="t-small text-danger">
              {photoError}
            </p>
          )}
          {route.photos.length < 12 ? (
            <PhotoField
              label="Legg til bilde"
              photographers={photographers ?? []}
              clubName={clubName ?? ""}
              people={(members ?? []).map((m) => ({ ...m, status: "visible" as const }))}
              showsPeople
              onUpload={(f) => {
                f.set("routeId", route.id);
                return addRoutePhoto(f);
              }}
              onRemove={async () => ({ ok: true as const })}
            />
          ) : (
            <p className="t-small text-ink-3">Turen har 12 bilder, som er mest mulig. Fjern et for å legge til et nytt.</p>
          )}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong px-4 py-3 t-small text-ink-3">Du legger inn bilder etter at turen er lagret.</p>
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
