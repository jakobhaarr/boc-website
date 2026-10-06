"use client";

import { useState, useTransition } from "react";
import { submitPrivacyContact } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { ON_BEHALF_OF, WANTS } from "@/lib/privacy-contact";
import type { PrivacyContact } from "@/lib/types";

/**
 * The privacy form: who the message is for, what is asked for, and how to
 * answer. It sends the message to the club's administrators (see
 * submitPrivacyContact), who check that it is the right person before they give
 * anything out or delete anything. The hidden «website» field is for programs.
 */
export function PrivacyContactForm() {
  const [onBehalfOf, setOnBehalfOf] = useState<PrivacyContact["onBehalfOf"]>("self");
  const [wants, setWants] = useState<PrivacyContact["wants"]>([]);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  if (reference) {
    return (
      <div role="status" className="rounded-lg bg-surface p-6 shadow-card ring-1 ring-line">
        <h3 className="t-h3">Takk, vi har mottatt henvendelsen.</h3>
        <p className="mt-2 t-body text-ink-2">
          Klubben svarer på e-post, og senest innen en måned. Vi sjekker først at det er deg, og spør om det vi trenger for å gjøre det.
          {reference !== "-" && (
            <>
              {" "}
              Referansen er <span className="font-semibold tnum text-ink">{reference}</span>.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <form
      className="relative grid gap-6 rounded-lg bg-surface p-5 shadow-card ring-1 ring-line sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await submitPrivacyContact({
            onBehalfOf,
            fromName: f.get("fromName"),
            fromEmail: f.get("fromEmail"),
            subjectName: f.get("subjectName"),
            where: f.get("where"),
            wants,
            message: f.get("message"),
            website: f.get("website"),
          });
          if (res.ok) setReference(res.reference);
          else setError(res.error);
        });
      }}
    >
      <fieldset className="grid gap-3">
        <legend className="t-label font-semibold">Hvem tar du kontakt på vegne av?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {ON_BEHALF_OF.map((o) => (
            <label
              key={o.id}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-md border p-3 transition-colors",
                onBehalfOf === o.id ? "border-inverse bg-sunken" : "border-line-strong hover:border-ink-3",
              )}
            >
              <span className="flex items-center gap-2 t-small font-semibold text-ink">
                <input type="radio" name="onBehalfOf" value={o.id} checked={onBehalfOf === o.id} onChange={() => setOnBehalfOf(o.id)} className="accent-[var(--action)]" />
                {o.label}
              </span>
              <span className="pl-6 t-meta text-ink-3">{o.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ditt navn" htmlFor="pc-name">
          <Input id="pc-name" name="fromName" autoComplete="name" required maxLength={80} />
        </Field>
        <Field label="Din e-postadresse" htmlFor="pc-email" hint="Her svarer klubben deg.">
          <Input id="pc-email" name="fromEmail" type="email" autoComplete="email" required maxLength={254} />
        </Field>
        {onBehalfOf !== "self" && (
          <Field label={onBehalfOf === "child" ? "Barnets navn" : "Personens navn"} htmlFor="pc-subject">
            <Input id="pc-subject" name="subjectName" required maxLength={80} />
          </Field>
        )}
        <Field label="Lag eller gruppe" htmlFor="pc-where" optional hint="Hjelper oss å finne riktig person.">
          <Input id="pc-where" name="where" maxLength={120} placeholder="For eksempel BOC 3" />
        </Field>
      </div>

      <fieldset className="grid gap-3">
        <legend className="t-label font-semibold">Hva ber du om?</legend>
        {WANTS.map((w) => (
          <Checkbox
            key={w.id}
            label={w.label}
            description={w.hint}
            checked={wants.includes(w.id)}
            onChange={(e) => setWants((all) => (e.target.checked ? [...all, w.id] : all.filter((x) => x !== w.id)))}
          />
        ))}
      </fieldset>

      <Field label="Noe vi bør vite?" htmlFor="pc-message" optional>
        <Textarea id="pc-message" name="message" rows={3} maxLength={2000} />
      </Field>

      {/* For programs: people never see it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Nettside
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-danger-surface px-3.5 py-3 t-small text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sender …" : "Send henvendelsen"}
        </Button>
        <p className="max-w-[44ch] t-meta text-ink-3">Opplysningene brukes bare til å svare deg. Vi sender ikke noe ut før vi har sjekket at det er riktig person.</p>
      </div>
    </form>
  );
}
