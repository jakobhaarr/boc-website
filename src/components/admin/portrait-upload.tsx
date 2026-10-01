"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { removePortrait, setBirthDate, setPortrait } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { prepareImage } from "@/components/admin/prepare-image";
import { Avatar } from "@/components/ui/primitives";

/**
 * The person's profile in admin: the portrait (upload, replace, remove; the
 * site shows it only with photo consent) and an optional date of birth,
 * which gives quotes an exact age.
 */
export function PortraitUpload({
  personId,
  name,
  photo,
  consent,
  birthDate,
  birthYear,
}: {
  personId: string;
  name: string;
  photo?: { src: string; focal?: { x: number; y: number } };
  consent: "granted" | "declined" | "unknown";
  birthDate?: string;
  birthYear?: number;
}) {
  const [date, setDate] = useState(birthDate ?? "");
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const done = () => {
    announceChange();
    router.refresh();
  };

  const upload = (file: File) =>
    start(async () => {
      setError(null);
      try {
        const { blob, width, height } = await prepareImage(file, 800);
        const form = new FormData();
        form.set("personId", personId);
        form.set("file", new File([blob], "portrett.jpg", { type: "image/jpeg" }));
        form.set("width", String(width));
        form.set("height", String(height));
        const res = await setPortrait(form);
        if (!res.ok) return setError(res.error);
        done();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kunne ikke laste opp bildet.");
      }
    });

  const saveDate = (value: string | null) =>
    start(async () => {
      setError(null);
      const res = await setBirthDate(personId, value);
      if (!res.ok) return setError(res.error);
      if (value === null) setDate("");
      done();
    });

  const remove = () =>
    start(async () => {
      const res = await removePortrait(personId);
      if (!res.ok) return setError(res.error);
      done();
    });

  return (
    <section aria-labelledby="portrett" className="rounded-lg border border-line bg-surface">
      <h2 id="portrett" className="border-b border-line px-4 py-3 t-label font-semibold sm:px-5">
        Profil
      </h2>
      <div className="grid gap-4 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-4">
          <Avatar name={name} size={64} photo={photo} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => input.current?.click()}>
              {photo ? "Bytt bilde" : "Last opp bilde"}
            </Button>
            {photo && (
              <Button size="sm" variant="ghost" disabled={pending} onClick={remove}>
                Fjern
              </Button>
            )}
          </div>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Velg bilde"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) upload(file);
            }}
          />
        </div>
        <p className="t-small text-ink-3">
          {consent === "granted"
            ? "Vises på nettsiden, siden personen har samtykket til bilder."
            : "Vises bare her i administrasjonen til personen har samtykket til bilder."}
        </p>
        <div className="grid gap-2 border-t border-line pt-4">
          <Field
            label="Fødselsdato"
            htmlFor={`fodt-${personId}`}
            optional
            hint={birthDate ? "Gir eksakt alder på sitater." : birthYear ? `Bare fødselsåret ${birthYear} er registrert.` : "Brukes til alder på sitater."}
          >
            <Input id={`fodt-${personId}`} type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={pending || !date || date === birthDate} onClick={() => saveDate(date)}>
              Lagre dato
            </Button>
            {birthDate && (
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => saveDate(null)}>
                Fjern dato
              </Button>
            )}
          </div>
        </div>
        {pending && <p className="t-small text-ink-3">Lagrer …</p>}
        {error && (
          <p role="alert" className="t-small text-danger">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
