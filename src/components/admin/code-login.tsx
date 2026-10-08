"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { demoLogin, sendLoginCode, verifyLoginCode } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { isDemoEmail } from "@/lib/demo-accounts";

/** The address that last signed in on this device, so the next visit starts with it filled in. */
const LAST_EMAIL = "klubb-last-login-email";

/** Endings offered under the field while an address is being typed, since a web page cannot add them to the phone's keyboard. */
const DOMAINS = ["gmail.com", "hotmail.com"];

/**
 * Sign-in with an e-mailed six-digit code, the only way in. The code field is
 * marked as a one-time code, so Safari on an iPhone offers the code from the
 * latest mail above the keyboard (Apple Mail), and it signs in by itself at the
 * sixth digit. The address is filled in from the invitation link, or else from
 * the last address that signed in on this device; the field is a username field,
 * so a browser can also offer a saved one.
 */
export function CodeLogin({ next, codeAvailable, initialEmail = "", demo = false }: { next: string; codeAvailable: boolean; initialEmail?: string; /** The board demo's sign-in is on (lib/demo-login.ts): the two demo addresses ask for a password instead of sending a code. */ demo?: boolean }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  const [keyboard, setKeyboard] = useState(false);
  const router = useRouter();

  // On a phone the keyboard covers the lower half. While a field has focus the page gets room below the form, and once the
  // keyboard is up the page is scrolled so the field sits in the upper part of what is left, with the button under it in view.
  const room = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      setKeyboard(true);
      window.setTimeout(() => {
        const visible = window.visualViewport?.height ?? window.innerHeight;
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, top - visible * 0.3), behavior: "smooth" });
      }, 400);
    },
    onBlur: () => setKeyboard(false),
  };
  // «ola» offers @gmail.com and @hotmail.com; «ola@g» only the one that starts that way. Nothing once the address is complete.
  const [local, ...rest] = email.trim().split("@");
  const typed = rest.join("@").toLowerCase();
  const suggestions = local && rest.length <= 1 ? DOMAINS.filter((d) => d.startsWith(typed) && d !== typed) : [];
  const spacer = <div aria-hidden className={keyboard ? "h-[85dvh] lg:hidden" : "h-0"} />;

  // Storage may be unavailable (private window): then the field simply starts empty.
  useEffect(() => {
    if (initialEmail) return;
    try {
      const last = window.localStorage.getItem(LAST_EMAIL);
      if (last) setEmail((current) => current || last);
    } catch {}
  }, [initialEmail]);

  if (!codeAvailable && !demo) {
    return (
      <div>
        <h2 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.02em]">Innlogging er ikke klar</h2>
        <p className="mt-2 t-small text-ink-2">Innlogging med e-postkode er ikke satt opp på denne siden. Gi beskjed til klubbadministrator.</p>
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

  const withPassword = demo && isDemoEmail(email);
  const submitPassword = () =>
    start(async () => {
      setError(undefined);
      const res = await demoLogin(email, password);
      if (!res.ok) return setError(res.error);
      router.push(next);
      router.refresh();
    });

  const submitCode = (value: string) =>
    start(async () => {
      setError(undefined);
      const res = await verifyLoginCode(email, value);
      if (!res.ok) return setError(res.error);
      try {
        window.localStorage.setItem(LAST_EMAIL, email.trim().toLowerCase());
      } catch {}
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
              {...room}
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
        {spacer}
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
          if (withPassword) return submitPassword();
          if (email.includes("@")) requestCode();
        }}
      >
        <Field label="E-postadresse" htmlFor="login-email">
          <Input id="login-email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus {...room} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="navn@eksempel.no" className="h-12" />
        </Field>
        {withPassword && (
          <Field label="Passord" htmlFor="login-password" error={error}>
            <Input id="login-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(undefined); }} className="h-12" />
          </Field>
        )}
        {suggestions.length > 0 && !withPassword && (
          <div className="-mt-2 flex flex-wrap gap-2" aria-label="Forslag til e-postadresse">
            {suggestions.map((d) => (
              <button
                key={d}
                type="button"
                // The press must not take focus from the field, or the keyboard would close.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setEmail(`${local}@${d}`)}
                className="inline-flex h-9 items-center rounded-md border border-line-strong bg-surface px-3 t-small text-ink transition-colors hover:border-ink-3"
              >
                @{d}
              </button>
            ))}
          </div>
        )}
        <Button type="submit" size="lg" block disabled={!email.includes("@") || pending || (withPassword && !password)}>
          {withPassword ? (pending ? "Logger inn …" : "Logg inn") : pending ? "Sender …" : "Send kode"}
        </Button>
      </form>
      {spacer}
    </div>
  );
}
