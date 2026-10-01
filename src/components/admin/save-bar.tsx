"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The bar an editor saves from. On a phone it sits above the tab bar, on
 * desktop at the foot of the page. Saving publishes at once, so it says so;
 * after a save it confirms and links to the public page.
 */
export function SaveBar({
  dirty,
  pending,
  error,
  done,
  onSave,
  onDiscard,
  href,
  label = "Lagre og publiser",
}: {
  dirty: boolean;
  pending: boolean;
  error: string | null;
  done: string | null;
  onSave: () => void;
  onDiscard: () => void;
  href?: string;
  label?: string;
}) {
  return (
    <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 border-t border-line bg-surface px-4 py-3 sm:mx-0 sm:rounded-lg sm:border md:bottom-4">
      {error && (
        <p role="alert" className="mb-2 t-small text-danger">
          {error}
        </p>
      )}
      {done && !dirty && (
        <p role="status" className="mb-2 inline-flex items-center gap-1.5 t-small text-success">
          <Check aria-hidden className="size-4" />
          {done}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onSave} disabled={!dirty || pending} className="min-w-40 max-sm:flex-1">
          {pending ? "Lagrer …" : label}
        </Button>
        {dirty && (
          <Button variant="ghost" onClick={onDiscard} disabled={pending}>
            Forkast
          </Button>
        )}
        {href && (
          <a href={href} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink">
            Se siden
            <ArrowUpRight aria-hidden className="size-3.5" />
          </a>
        )}
      </div>
      {dirty && <p className="mt-2 t-meta text-ink-3">Du har endringer som ikke er lagret. Lagrer du, er de synlige på nettsiden med en gang.</p>}
    </div>
  );
}
