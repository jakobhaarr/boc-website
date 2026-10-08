"use client";

import { ScanFace } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { editPhotoDetails, replacePhotoWithCovered } from "@/app/actions";
import { CensorEditor } from "@/components/admin/censor-editor";
import { censorDataUrl, type CensorRegion } from "@/components/admin/censor-image";
import { PeopleTagger, type TaggablePerson } from "@/components/admin/people-tagger";
import { PhotoCheckActions } from "@/components/admin/photo-check-actions";
import { PhotographerPicker } from "@/components/admin/photographer-picker";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { parseChoice, type PhotographerOption } from "@/lib/photo-meta";

/**
 * One picture in the privacy check: change who took it, tag people, say which of them are covered up, cover someone up by hand
 * (a box over the whole person, done on this device and uploaded in place of the old picture, whose file is deleted), hide it
 * or delete it. Saving checks the rules: nobody anonymised can be tagged, and someone who may not be shown must be covered.
 */
export function PhotoDetailEditor({
  photoId,
  src,
  alt,
  options,
  people,
  photographerKey,
  tagged,
  noPeople,
  covered,
  clubName,
  hidden,
  back,
}: {
  photoId: string;
  src: string;
  alt: string;
  options: PhotographerOption[];
  people: TaggablePerson[];
  photographerKey: string;
  tagged: string[];
  noPeople: boolean;
  covered: string[];
  clubName: string;
  hidden: boolean;
  back: string;
}) {
  const router = useRouter();
  const [photographer, setPhotographer] = useState(photographerKey);
  const [ids, setIds] = useState(tagged);
  const [none, setNone] = useState(noPeople);
  const [cover, setCover] = useState(covered);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "Ukjent person";
  const done = (text: string) => {
    setMessage({ ok: true, text });
    announceChange();
    router.refresh();
  };

  const save = () =>
    start(async () => {
      setMessage(null);
      const res = await editPhotoDetails(photoId, { photographer: parseChoice(photographer), tagged: ids, noPeople: none, covered: cover.filter((c) => ids.includes(c)) });
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      done("Lagret.");
    });

  const coverByHand = (regions: CensorRegion[]) => {
    setDrawing(false);
    if (regions.length === 0) return;
    start(async () => {
      setMessage(null);
      try {
        const url = await censorDataUrl(src, regions);
        const blob = await (await fetch(url)).blob();
        const img = await createImageBitmap(blob);
        const form = new FormData();
        form.set("photoId", photoId);
        form.set("file", new File([blob], "sladdet.jpg", { type: "image/jpeg" }));
        form.set("width", String(img.width));
        form.set("height", String(img.height));
        form.set("consent", "true");
        form.set("regions", String(regions.length));
        const res = await replacePhotoWithCovered(form);
        if (!res.ok) return setMessage({ ok: false, text: res.error });
        done(`${regions.length === 1 ? "1 boks" : `${regions.length} bokser`} lagt over. Det gamle bildet er slettet. Huk av under hvem som nå er sladdet, og lagre.`);
      } catch {
        setMessage({ ok: false, text: "Kunne ikke sladde bildet. Prøv igjen." });
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start">
      <div className="grid gap-4">
        {/* A plain img: the source may be a data address. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="block max-h-[70dvh] w-full rounded-lg object-contain ring-1 ring-line" />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" disabled={pending} onClick={() => setDrawing(true)}>
            <ScanFace aria-hidden />
            Sladd personer for hånd
          </Button>
          <PhotoCheckActions photoId={photoId} hidden={hidden} afterDelete={back} />
        </div>
        <p className="t-small text-ink-3">Sladding legges rett på bildet og kan ikke fjernes etterpå. Det gamle bildet slettes.</p>
      </div>

      <div className="grid gap-6 rounded-lg border border-line bg-surface p-4 sm:p-5">
        <PhotographerPicker id={`pd-${photoId}-photographer`} options={options} value={photographer} onChange={setPhotographer} clubName={clubName} />
        <PeopleTagger
          idPrefix={`pd-${photoId}-tag`}
          people={people}
          tagged={ids}
          noPeople={none}
          onChange={(next, noOne) => {
            setIds(next);
            setNone(noOne);
            setCover((c) => c.filter((id) => next.includes(id)));
          }}
        />
        {ids.length > 0 && (
          <fieldset className="grid gap-2">
            <legend className="mb-1 t-label text-ink">Hvem er sladdet i bildet?</legend>
            {ids.map((id) => (
              <Checkbox key={id} checked={cover.includes(id)} onChange={(e) => setCover(e.target.checked ? [...cover, id] : cover.filter((c) => c !== id))} label={nameOf(id)} />
            ))}
            <p className="t-small text-ink-3">Den som mangler samtykke, er anonymisert eller ikke skal publiseres, må være sladdet i selve bildet.</p>
          </fieldset>
        )}
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "t-small text-success" : "t-small text-danger"}>
            {message.text}
          </p>
        )}
        <Button disabled={pending || !parseChoice(photographer)} onClick={save}>
          {pending ? "Lagrer …" : "Lagre"}
        </Button>
      </div>

      <CensorEditor key={String(drawing)} open={drawing} onClose={() => setDrawing(false)} src={src} regions={[]} onSave={coverByHand} />
    </div>
  );
}
