"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendLoginCode, verifyLoginCode } from "@/app/actions";
import { PasswordGate } from "@/components/admin/password-gate";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

/**
 * Sign-in with an e-mailed six-digit code. The code field is marked as a
 * one-time code, so Safari on an iPhone offers the code from the latest mail
 * above the keyboard (Apple Mail), and it signs in by itself at the sixth
 * digit. The shared password stays as a way in until the codes are in use.
 */
export function CodeLogin({ next, codeAvailable, initialEmail = "" }: { next: string; codeAvailable: boolean; initialEmail?: string }) {
  const [mode, setMode] = useState<"code" | "password">(codeAvailable ? "code" : "password");
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (mode === "password") {
    return (
      <div className="grid gap-6">
        <PasswordGate next={next} />
        {codeAvailable && (
          <button type="button" onClick={() => setMode("code")} className="justify-self-start t-small text-ink-3 underline underline-offset-2 hover:text-ink">
            Logg inn med e-postkode i stedet
          </button>
        )}
      </div>
    );
  }

  const requestCode = () =>
    start(async () => {
      setError(undefined);
      await sendLoginCode(email);
      setStep("code");
      setCode("");
      setSent(true);
    });

  const submitCode = (value: string) =>
    start(async () => {
      setError(undefined);
      const res = await verifyLoginCode(email, value);
      if (!res.ok) return setError(res.error);
      router.push(next);
      router.refresh();
    });

  if (step === "code") {
    return (
      <div className="anim-rise">
        <button type="button" onClick={() => setStep("email")} className="inline-flex items-center gap-1.5 t-small text-ink-3 hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> Tilbake
        </button>
        <h2 className="mt-6 text-[1.625rem] leading-tight font-semibold tracking-[-0.02em]">Skriv inn koden</h2>
        <p className="mt-2 t-small text-ink-2" aria-live="polite">
          Hvis <span className="font-medium text-ink">{email}</span> er registrert, har vi sendt en kode med seks siffer. Den gjelder i ti minutter.
        </p>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6) submitCode(code);
          }}
        >
          <Field label="Kode" htmlFor="login-code" error={error}>
            <Input
              id="login-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              value={code}
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(digits);
                setError(undefined);
                if (digits.length === 6 && !pending) submitCode(digits);
              }}
              className="h-12 text-center text-xl tracking-[0.4em] tnum"
              placeholder="••••••"
            />
          </Field>
          <Button type="submit" size="lg" block disabled={code.length < 6 || pending}>
            {pending ? "Logger inn …" : "Logg inn"}
          </Button>
        </form>
        <button type="button" disabled={pending} onClick={requestCode} className="mt-4 t-small text-ink-3 underline underline-offset-2 hover:text-ink disabled:opacity-60">
          {sent ? "Send en ny kode" : "Send kode"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.02em]">Logg inn</h2>
      <p className="mt-2 t-small text-ink-2">Skriv inn e-postadressen din, så sender vi en kode. Du trenger ikke passord.</p>
      <form
        className="mt-6 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.includes("@")) requestCode();
        }}
      >
        <Field label="E-postadresse" htmlFor="login-email">
          <Input id="login-email" type="email" autoComplete="email" inputMode="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="navn@eksempel.no" className="h-12" />
        </Field>
        <Button type="submit" size="lg" block disabled={!email.includes("@") || pending}>
          {pending ? "Sender …" : "Send kode"}
        </Button>
      </form>
      <button type="button" onClick={() => setMode("password")} className="mt-8 t-small text-ink-3 underline underline-offset-2 hover:text-ink">
        Bruk felles passord
      </button>
    </div>
  );
}
