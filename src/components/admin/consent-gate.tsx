"use client";

import { EyeOff, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MissingConsent {
  id: string;
  name: string;
}

const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} og ${names.at(-1)}` : (names[0] ?? ""));

/**
 * Shown when someone ticked as recognisable has not given photo consent. They
 * must not appear on the site, so the post cannot be sent until each is dealt
 * with: taken out of the picture (unticked, they are then not in it), or
 * covered up (CensorEditor), after which they are no longer recognisable.
 * `drawn` is the number of boxes drawn so far; there must be one for every
 * person covered up, so «sladdet» cannot be claimed without actually doing it.
 */
export function ConsentGate({
  missing,
  covered,
  drawn,
  canDraw,
  asking = [],
  canAsk,
  onAsk,
  onUnask,
  onRemove,
  onCover,
  onUncover,
  onDraw,
}: {
  /** Ticked people without consent who are not covered up. */
  missing: MissingConsent[];
  /** People marked as covered up. */
  covered: MissingConsent[];
  drawn: number;
  /** There is a picture to draw on. */
  canDraw: boolean;
  /** People who will be asked by e-mail; the pictures wait for their answer. */
  asking?: MissingConsent[];
  /** Whether there is an address to ask on. Without onAsk, asking is not offered at all. */
  canAsk?: (id: string) => boolean;
  onAsk?: (id: string) => void;
  onUnask?: (id: string) => void;
  onRemove: (id: string) => void;
  onCover: (id: string) => void;
  onUncover: (id: string) => void;
  onDraw: () => void;
}) {
  if (missing.length === 0 && covered.length === 0 && asking.length === 0) return null;
  const nothingLeft = missing.length === 0;
  const short = covered.length - drawn;
  return (
    <div aria-live="polite" className={`grid gap-3 rounded-md px-3.5 py-3 t-small text-ink ${nothingLeft ? "bg-warning-surface" : "bg-danger-surface"}`}>
      <p className="flex gap-2.5">
        <ShieldAlert aria-hidden className={`mt-0.5 size-4 shrink-0 ${nothingLeft ? "text-warning" : "text-danger"}`} />
        <span>
          <span className="font-semibold">{nothingLeft ? "Samtykke: " : "Samtykke mangler: "}</span>
          {missing.length > 0
            ? `${list(missing.map((m) => m.name))} har ikke gitt samtykke til bilder og kan ikke vises på nettsiden. Ta personen ut av bildet, sladd ansiktet${onAsk ? ", eller be om samtykke på e-post" : ""}, før du publiserer.`
            : asking.length > 0
              ? `Innlegget publiseres, men bildene vises først når ${list(asking.map((m) => m.name))} har sagt ja.`
              : "Alle uten samtykke er sladdet. Sjekk at hvert ansikt er dekket."}
        </span>
      </p>
      <ul className="grid gap-2">
        {missing.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 flex-1 font-medium">{m.name}</span>
            <Button size="sm" variant="secondary" onClick={() => onRemove(m.id)}>
              Ikke med på bildet
            </Button>
            <Button size="sm" variant="secondary" disabled={!canDraw} onClick={() => onCover(m.id)}>
              <EyeOff aria-hidden />
              Sladd
            </Button>
            {onAsk && (
              <Button size="sm" variant="secondary" disabled={!canAsk?.(m.id)} title={canAsk?.(m.id) ? undefined : "Legg inn e-post for samtykke under Medlemmer først"} onClick={() => onAsk(m.id)}>
                <Mail aria-hidden />
                Be om samtykke
              </Button>
            )}
          </li>
        ))}
        {asking.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 flex-1 font-medium">{m.name}</span>
            <span className="inline-flex items-center gap-1 text-ink-2">
              <Mail aria-hidden className="size-3.5" />
              Spørres på e-post
            </span>
            <Button size="sm" variant="ghost" onClick={() => onUnask?.(m.id)}>
              Angre
            </Button>
          </li>
        ))}
        {covered.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 flex-1 font-medium">{m.name}</span>
            <span className="inline-flex items-center gap-1 text-ink-2">
              <EyeOff aria-hidden className="size-3.5" />
              Sladdes
            </span>
            <Button size="sm" variant="ghost" onClick={() => onUncover(m.id)}>
              Angre
            </Button>
          </li>
        ))}
      </ul>
      {covered.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={onDraw}>
            <EyeOff aria-hidden />
            Tegn sladding i bildet
          </Button>
          <span className={short > 0 ? "font-medium text-danger" : "text-ink-2"}>
            {short > 0 ? `Tegn en boks til for ${short === 1 ? "1 person" : `${short} personer`}.` : `${drawn} ${drawn === 1 ? "boks" : "bokser"} tegnet.`}
          </span>
        </div>
      )}
    </div>
  );
}
