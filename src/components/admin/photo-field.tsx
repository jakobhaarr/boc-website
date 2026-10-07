"use client";

import { Images, ImagePlus, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { CensorEditor } from "@/components/admin/censor-editor";
import { censorDataUrl, type CensorRegion } from "@/components/admin/censor-image";
import { ConsentGate } from "@/components/admin/consent-gate";
import { PeopleTagger, type TaggablePerson } from "@/components/admin/people-tagger";
import { PhotoLibraryPicker } from "@/components/admin/photo-library-picker";
import { PhotographerPicker } from "@/components/admin/photographer-picker";
import { prepareImage } from "@/components/admin/prepare-image";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { parseChoice, type PhotographerOption } from "@/lib/photo-meta";

const MAX_SIDE = 1800;

/**
 * One photo that can be added, replaced and removed: a group's main photo or a
 * venue's. The file is scaled and stripped of metadata on the device first
 * (prepareImage); the uploader says who took it, and, for a picture of people,
 * who is in it (or that nobody who can be recognised is), so anonymising one of
 * them later hides the photo. The alt text is written by the system. Everything
 * goes live when «Bruk bildet» is pressed; a club administrator checks the
 * answers afterwards.
 */
export function PhotoField({
  label,
  current,
  photographers,
  clubName,
  people,
  showsPeople,
  onUpload,
  onRemove,
  onChoose,
}: {
  label: string;
  current?: { src: string; alt: string };
  /** Who may be named as photographer for this picture. */
  photographers: PhotographerOption[];
  clubName: string;
  /** Members who can be ticked as recognisable. Left out for places. */
  people?: TaggablePerson[];
  /** Whether the picture is expected to show people, so the consent text says so. */
  showsPeople?: boolean;
  onUpload: (form: FormData) => Promise<{ ok: true } | { ok: false; error: string }>;
  onRemove: () => Promise<{ ok: true } | { ok: false; error: string }>;
  /** Use a picture from the library (every picture in the project) instead of uploading one. */
  onChoose?: (photoId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [library, setLibrary] = useState(false);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);
  const [chosen, setChosen] = useState<{ file: File; preview: string } | null>(null);
  const [photographer, setPhotographer] = useState("");
  const [consent, setConsent] = useState(false);
  const [tagged, setTagged] = useState<string[]>([]);
  const [noPeople, setNoPeople] = useState(false);
  const [censored, setCensored] = useState<string[]>([]);
  const [regions, setRegions] = useState<CensorRegion[]>([]);
  const [covered, setCovered] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const altId = useId();

  useEffect(() => () => void (chosen && URL.revokeObjectURL(chosen.preview)), [chosen]);

  // What the picture will look like once the marked faces are covered, for the preview.
  useEffect(() => {
    if (!chosen || regions.length === 0) return setCovered(null);
    let live = true;
    censorDataUrl(chosen.preview, regions).then((src) => live && setCovered(src), () => live && setCovered(null));
    return () => {
      live = false;
    };
  }, [chosen, regions]);

  const named = people?.filter((p) => tagged.includes(p.id)) ?? [];
  // «Ikke publiser» counts as without consent: covered up or taken out.
  const missing = named.filter((p) => !censored.includes(p.id) && (p.status === "restricted" || (p.consent !== undefined && p.consent !== "granted")));
  const coveredNames = named.filter((p) => censored.includes(p.id));
  const consentOk = missing.length === 0 && coveredNames.length <= regions.length;

  const choose = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setChosen({ file, preview: URL.createObjectURL(file) });
  };
  const reset = () => {
    setChosen(null);
    setConsent(false);
    setTagged([]);
    setNoPeople(false);
    setCensored([]);
    setRegions([]);
    setPhotographer("");
    if (input.current) input.current.value = "";
  };

  const upload = () =>
    start(async () => {
      if (!chosen) return;
      setError(null);
      try {
        const { blob, width, height, ext } = await prepareImage(chosen.file, MAX_SIDE, regions);
        const form = new FormData();
        form.set("file", new File([blob], `bilde.${ext}`, { type: blob.type }));
        form.set("width", String(width));
        form.set("height", String(height));
        form.set("photographer", JSON.stringify(parseChoice(photographer)));
        form.set("consent", consent ? "true" : "false");
        form.set("tagged", JSON.stringify(tagged.filter((id) => !censored.includes(id))));
        form.set("censored", String(censored.length));
        form.set("noPeople", noPeople ? "true" : "false");
        const res = await onUpload(form);
        if (!res.ok) return setError(res.error);
        announceChange();
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kunne ikke laste opp bildet.");
      }
    });

  const remove = () =>
    start(async () => {
      setError(null);
      const res = await onRemove();
      if (!res.ok) return setError(res.error);
      announceChange();
      window.location.reload();
    });

  return (
    <div className="grid gap-3">
      <p className="t-label text-ink">{label}</p>
      <div className={cn("overflow-hidden rounded-lg border border-line bg-sunken", !(chosen?.preview ?? current?.src) && "grid aspect-[16/9] place-items-center")}>
        {chosen?.preview || current?.src ? (
          // A plain img: the preview is a local file, and the stored one may be a data address.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={covered ?? chosen?.preview ?? current!.src} alt={chosen ? "Forhåndsvisning" : current!.alt} className="aspect-[16/9] w-full object-cover" />
        ) : (
          <p className="t-small text-ink-3">Ingen bilde ennå</p>
        )}
      </div>

      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id={`${altId}-file`} onChange={(e) => choose(e.target.files?.[0])} />

      {!chosen ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled={pending} onClick={() => input.current?.click()}>
            <ImagePlus aria-hidden />
            {current ? "Bytt bilde" : "Last opp bilde"}
          </Button>
          {onChoose && (
            <Button variant="secondary" size="sm" disabled={pending} onClick={() => setLibrary(true)}>
              <Images aria-hidden />
              Fra bildebiblioteket
            </Button>
          )}
          {current &&
            (confirmRemove ? (
              <>
                <Button variant="danger" size="sm" disabled={pending} onClick={remove}>
                  Ja, fjern bildet
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
                  Avbryt
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmRemove(true)}>
                <Trash2 aria-hidden />
                Fjern bildet
              </Button>
            ))}
        </div>
      ) : (
        <div className="grid gap-4 rounded-lg border border-line p-4">
          <PhotographerPicker id={`${altId}-photographer`} options={photographers} value={photographer} onChange={setPhotographer} clubName={clubName} />
          {people && (
            <PeopleTagger
              idPrefix={`${altId}-tag`}
              people={people}
              tagged={tagged}
              noPeople={noPeople}
              onChange={(ids, none) => {
                setTagged(ids);
                setCensored((c) => c.filter((id) => ids.includes(id)));
                setNoPeople(none);
              }}
            />
          )}
          {people && (
            <ConsentGate
              missing={missing.map((p) => ({ id: p.id, name: p.name }))}
              covered={coveredNames.map((p) => ({ id: p.id, name: p.name }))}
              drawn={regions.length}
              canDraw
              onRemove={(id) => setTagged((t) => t.filter((x) => x !== id))}
              onCover={(id) => {
                setCensored((c) => [...c, id]);
                setEditing(true);
              }}
              onUncover={(id) => setCensored((c) => c.filter((x) => x !== id))}
              onDraw={() => setEditing(true)}
            />
          )}
          <Checkbox
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            label={showsPeople ? "Alle som kan kjennes igjen på bildet har sagt ja til at det brukes på nettsiden." : "Bildet viser ikke personer som kan kjennes igjen, eller de har sagt ja til at det brukes på nettsiden."}
          />
          {error && (
            <p role="alert" className="t-small text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!consent || pending || !consentOk || !parseChoice(photographer) || (!!people && tagged.length === 0 && !noPeople && censored.length === 0)} onClick={upload}>
              {pending ? "Laster opp …" : "Bruk bildet"}
            </Button>
            <Button variant="ghost" size="sm" disabled={pending} onClick={reset}>
              Avbryt
            </Button>
          </div>
        </div>
      )}
      {chosen && editing && <CensorEditor open onClose={() => setEditing(false)} src={chosen.preview} regions={regions} onSave={setRegions} />}
      {!chosen && error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      {onChoose && (
        <PhotoLibraryPicker
          open={library}
          onClose={() => setLibrary(false)}
          onPick={([photo]) =>
            start(async () => {
              setLibrary(false);
              setError(null);
              const res = await onChoose(photo.id);
              if (!res.ok) return setError(res.error);
              announceChange();
              window.location.reload();
            })
          }
        />
      )}
    </div>
  );
}
