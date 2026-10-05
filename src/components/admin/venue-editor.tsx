"use client";

import { useId, useState, useTransition } from "react";
import { deleteVenue, removeVenuePhoto, saveVenue, setVenuePhoto } from "@/app/actions";
import { DangerZone } from "@/components/admin/danger-zone";
import { PhotoField } from "@/components/admin/photo-field";
import type { PhotographerOption } from "@/lib/photo-meta";
import { SaveBar } from "@/components/admin/save-bar";
import { announceChange } from "@/components/public/live-refresh";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PREPOSITIONS, type VenueEdit } from "@/lib/venue-edit";

type VenueForm = VenueEdit;

const EMPTY: VenueForm = { name: "", area: "", surface: "", address: "", mapQuery: "", preposition: "på", note: "" };

/**
 * A venue on a phone: what it is called and where, how a sentence reaches it,
 * a photo, and deleting it. A new venue is saved first and gets its photo on
 * the next screen, since the photo belongs to a venue that exists.
 */
export function VenueEditor({
  venue,
  photo,
  photographers,
  clubName,
  usage,
}: {
  venue?: (VenueForm & { id: string }) | undefined;
  photo?: { src: string; alt: string };
  photographers: PhotographerOption[];
  clubName: string;
  usage?: { groups: string[]; series: number; activities: number };
}) {
  const initial: VenueForm = venue ? { name: venue.name, area: venue.area, surface: venue.surface, address: venue.address, mapQuery: venue.mapQuery, preposition: venue.preposition, note: venue.note } : EMPTY;
  const [form, setForm] = useState<VenueForm>(initial);
  const [saved, setSaved] = useState<VenueForm>(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const ids = { name: useId(), area: useId(), surface: useId(), address: useId(), map: useId(), prep: useId(), note: useId() };
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof VenueForm>(key: K, value: VenueForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = () =>
    start(async () => {
      setError(null);
      setDone(null);
      const res = await saveVenue(venue?.id ?? null, form);
      if (!res.ok) return setError(res.error);
      announceChange();
      if (!venue) {
        // A new venue continues on its own page, where the photo can be added.
        window.location.href = `/admin/arenaer/${res.id}`;
        return;
      }
      setSaved(form);
      setDone("Lagret. Endringen er synlig på nettsiden nå.");
    });

  const blocked = usage && (usage.groups.length || usage.series || usage.activities)
    ? [`Arenaen er i bruk${usage.groups.length ? ` av ${usage.groups.slice(0, 4).join(", ")}${usage.groups.length > 4 ? " og flere" : ""}` : ""}${usage.series ? `, og ${usage.series} faste treninger` : ""}. Fjern den fra gruppene og treningene først, så kan den slettes.`]
    : undefined;

  return (
    <div>
      <div className="grid max-w-[44rem] gap-5 pb-6">
        <Field label="Navn" htmlFor={ids.name}>
          <Input id={ids.name} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Sted" htmlFor={ids.area} hint="For eksempel «Bekkestua».">
            <Input id={ids.area} value={form.area} onChange={(e) => set("area", e.target.value)} />
          </Field>
          <Field label="Type" htmlFor={ids.surface} optional hint="For eksempel «Oppmøtested» eller «BMX-bane».">
            <Input id={ids.surface} value={form.surface} onChange={(e) => set("surface", e.target.value)} />
          </Field>
        </div>
        <Field label="Adresse" htmlFor={ids.address} optional>
          <Input id={ids.address} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="Kartsøk" htmlFor={ids.map} hint="Det kartlenken «Veibeskrivelse» søker etter, for eksempel «Bekkestua torg, Bærum».">
          <Input id={ids.map} value={form.mapQuery} onChange={(e) => set("mapQuery", e.target.value)} />
        </Field>
        <Field label="Slik skrives det i setninger" htmlFor={ids.prep}>
          <Select id={ids.prep} value={form.preposition} onChange={(e) => set("preposition", e.target.value as VenueForm["preposition"])}>
            {PREPOSITIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Merknad" htmlFor={ids.note} optional hint="Vises under arenaen, for eksempel hvor man parkerer eller hva som gjelder.">
          <Textarea id={ids.note} rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} />
        </Field>

        {venue ? (
          <PhotoField
            label="Bilde"
            current={photo}
            photographers={photographers}
            clubName={clubName}
            onUpload={(f) => {
              f.set("venueId", venue.id);
              return setVenuePhoto(f);
            }}
            onRemove={() => removeVenuePhoto(venue.id)}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-line-strong px-4 py-3 t-small text-ink-3">Du legger inn bildet etter at arenaen er lagret.</p>
        )}

        {venue && (
          <DangerZone
            className="mt-4"
            title="Slett arenaen"
            action="Slett arenaen"
            blocked={blocked}
            undo="Dette kan ikke angres. Bildet som er lastet opp for arenaen slettes også."
            what={<p>Arenaen fjernes fra nettsiden. Ingen grupper eller treninger bruker den.</p>}
            onDelete={async () => {
              const res = await deleteVenue(venue.id);
              if (res.ok) {
                announceChange();
                window.location.href = "/admin/arenaer";
              }
              return res;
            }}
          />
        )}
      </div>

      <SaveBar dirty={dirty} pending={pending} error={error} done={done} onSave={save} onDiscard={() => setForm(saved)} label={venue ? "Lagre og publiser" : "Legg til arenaen"} />
    </div>
  );
}
