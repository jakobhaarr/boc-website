"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { switchDemoUser } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Avatar } from "@/components/ui/primitives";

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden className="size-[18px]">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

/**
 * Mock of the future sign-in: Google, or passwordless e-mail with a one-time
 * code. No Apple. Nothing is sent; any code continues to the demo admin.
 */
export function LoginFlow({ demoUsers }: { demoUsers: { id: string; name: string; role: string; scope: string }[] }) {
  const [step, setStep] = useState<"start" | "code">("start");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const enter = (userId = "u-kari") =>
    start(async () => {
      await switchDemoUser(userId);
      router.push("/admin");
    });

  if (step === "code") {
    return (
      <div className="anim-rise">
        <button type="button" onClick={() => setStep("start")} className="inline-flex items-center gap-1.5 t-small text-ink-3 hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> Tilbake
        </button>
        <h2 className="mt-6 text-[1.625rem] leading-tight font-semibold tracking-[-0.02em]">Sjekk e-posten din</h2>
        <p className="mt-2 t-small text-ink-2">
          Vi har sendt en kode til <span className="font-medium text-ink">{email}</span>. Den gjelder i ti minutter.
        </p>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            enter();
          }}
        >
          <Field label="Engangskode" htmlFor="login-code" hint="Prototype: alle koder fungerer.">
            <Input
              id="login-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="h-12 text-center text-xl tracking-[0.4em] tnum"
              placeholder="••••••"
            />
          </Field>
          <Button type="submit" size="lg" block disabled={code.length < 6 || pending}>
            Logg inn
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.02em]">Logg inn</h2>
      <p className="mt-2 t-small text-ink-2">Ingen passord. Bruk Google, eller få en engangskode på e-post.</p>

      <Button variant="secondary" size="lg" block className="mt-6" disabled={pending} onClick={() => enter()}>
        <GoogleMark />
        Fortsett med Google
      </Button>

      <div className="my-6 flex items-center gap-3 t-small text-ink-3" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        eller
        <span className="h-px flex-1 bg-line" />
      </div>

      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.includes("@")) setStep("code");
        }}
      >
        <Field label="E-postadresse" htmlFor="login-email">
          <Input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="navn@eksempel.no" className="h-12" />
        </Field>
        <Button type="submit" size="lg" block disabled={!email.includes("@")}>
          Send engangskode
        </Button>
      </form>

      <div className="mt-10 border-t border-line pt-5">
        <p className="t-meta text-ink-3">Prototype: gå rett inn som</p>
        <ul className="mt-2 divide-y divide-line">
          {demoUsers.map((u) => (
            <li key={u.id}>
              <button type="button" disabled={pending} onClick={() => enter(u.id)} className="flex w-full items-center gap-3 py-2.5 text-left hover:text-club disabled:opacity-60">
                <Avatar name={u.name} size={32} />
                <span className="min-w-0">
                  <span className="block t-label">{u.name}</span>
                  <span className="block truncate t-small text-ink-3">
                    {u.role} · {u.scope}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
