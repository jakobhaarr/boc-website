"use client";

import { TriangleAlert } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";

/**
 * The foot of an editor, for what cannot be taken back lightly. Deleting is
 * never one tap: the first button only opens the explanation, which says what
 * goes with it and whether it can be undone, and for the permanent ones asks
 * for the name to be typed. A reason it cannot be done is shown instead of
 * the button.
 */
export function DangerZone({
  title,
  action,
  what,
  undo,
  blocked,
  confirmName,
  onDelete,
  className,
}: {
  title: string;
  /** The label on the destructive button, e.g. «Slett innlegget». */
  action: string;
  /** What happens, as a short list. */
  what: ReactNode;
  /** Whether it can be undone, in a sentence. */
  undo: string;
  /** Why it cannot be done now. Shown in place of the button. */
  blocked?: string[];
  /** Ask for this name to be typed before it is deleted (permanent deletions). */
  confirmName?: string;
  onDelete: (typed: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ready = !confirmName || typed.trim().toLocaleLowerCase("nb") === confirmName.toLocaleLowerCase("nb");

  const run = () =>
    start(async () => {
      setError(null);
      const res = await onDelete(typed);
      if (!res.ok) setError(res.error);
    });

  return (
    <section aria-label={title} className={cn("rounded-lg border border-danger/30 bg-danger-surface/40 p-4 sm:p-5", className)}>
      <h2 className="flex items-center gap-2 t-label font-semibold text-danger">
        <TriangleAlert aria-hidden className="size-4" />
        {title}
      </h2>
      {blocked?.length ? (
        <ul className="mt-2 grid gap-1.5 t-small text-ink-2">
          {blocked.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : !open ? (
        <div className="mt-2 grid gap-3">
          <p className="t-small text-ink-2">{undo}</p>
          <Button variant="danger" onClick={() => setOpen(true)} className="justify-self-start">
            {action}
          </Button>
        </div>
      ) : (
        <div className="mt-2 grid gap-4">
          <div className="t-small text-ink-2">{what}</div>
          <p className="t-small font-medium text-ink">{undo}</p>
          {confirmName && (
            <Field label={`Skriv «${confirmName}» for å bekrefte`} htmlFor="slett-bekreft" error={error ?? undefined}>
              <Input id="slett-bekreft" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
            </Field>
          )}
          {!confirmName && error && (
            <p role="alert" className="t-small text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={run} disabled={!ready || pending}>
              {pending ? "Sletter …" : action}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Avbryt
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
