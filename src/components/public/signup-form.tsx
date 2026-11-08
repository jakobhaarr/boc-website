"use client";

import { useState, useTransition } from "react";
import { submitSignupResponse } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

/** The form on /pamelding/[id]. The hidden field is for programs: a person never sees or fills it in. */
export function SignupForm({ signupId, title }: { signupId: string; title: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [v, setV] = useState({ name: "", email: "", phone: "", note: "", website: "" });
  const set = (key: keyof typeof v, value: string) => setV((x) => ({ ...x, [key]: value }));

  if (done) {
    return (
      <div role="status" className="rounded-lg bg-club-tint p-5">
        <p className="t-h3">Takk, du er påmeldt.</p>
        <p className="mt-2 t-body text-ink-2">Vi har registrert påmeldingen din til «{title}».</p>
      </div>
    );
  }
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await submitSignupResponse(signupId, v);
          if (!res.ok) return setError(res.error);
          setDone(true);
        });
      }}
    >
      <Field label="Fornavn og etternavn" htmlFor="su-navn">
        <Input id="su-navn" autoComplete="name" value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={100} required />
      </Field>
      <Field label="E-post" htmlFor="su-epost">
        <Input id="su-epost" type="email" autoComplete="email" inputMode="email" value={v.email} onChange={(e) => set("email", e.target.value)} maxLength={200} required />
      </Field>
      <Field label="Telefon" htmlFor="su-tlf" optional>
        <Input id="su-tlf" type="tel" autoComplete="tel" inputMode="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} maxLength={30} />
      </Field>
      <Field label="Noe vi bør vite" htmlFor="su-merknad" optional>
        <Textarea id="su-merknad" rows={3} value={v.note} onChange={(e) => set("note", e.target.value)} maxLength={1000} />
      </Field>
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Ikke fyll ut dette feltet
          <input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set("website", e.target.value)} />
        </label>
      </div>
      <p className="t-small text-ink-3">Opplysningene brukes bare til denne påmeldingen, og ses av dem i klubben som styrer den. Les mer under Personvern.</p>
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="max-sm:w-full sm:justify-self-start">
        {pending ? "Sender …" : "Meld meg på"}
      </Button>
    </form>
  );
}
