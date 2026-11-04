"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { claimGroup, verifyLoginCode } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import type { ClaimableGroup } from "@/lib/leader-signup";

/**
 * TEMPORARY (lib/leader-signup.ts): name, e-mail, group and the meeting code, then the six-digit code that is e-mailed,
 * and the leader is in admin as responsible for the group.
 */
export function LeaderSignup({ groups, codeAvailable, needsCode }: { groups: ClaimableGroup[]; codeAvailable: boolean; needsCode: boolean }) {
  const [step, setStep] = useState<"form" | "code">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [meetingCode, setMeetingCode] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = () =>
    start(async () => {
      setError(undefined);
      const res = await claimGroup({ name, email, nodeId, code: meetingCode });
      if (!res.ok) return setError(res.error);
      if (!res.codeSent) return router.push(`/logg-inn?epost=${encodeURIComponent(email.trim())}`);
      setStep("code");
    });

  const verify = (value: string) =>
    start(async () => {
      setError(undefined);
      const res = await verifyLoginCode(email, value);
      if (!res.ok) return setError(res.error);
      router.push("/admin");
      router.refresh();
    });

  if (step === "code") {
    return (
      <div className="anim-rise">
        <h2 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.02em]">Skriv inn koden</h2>
        <p className="mt-2 t-small text-ink-2">
          Du er nå ansvarlig for {groups.find((g) => g.id === nodeId)?.name}. Vi har sendt en kode med seks siffer til <span className="font-medium text-ink">{email.trim()}</span>. Den gjelder i ti minutter.
        </p>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6) verify(code);
          }}
        >
          <Field label="Kode" htmlFor="leader-code" error={error}>
            <Input
              id="leader-code"
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
                if (digits.length === 6 && !pending) verify(digits);
              }}
              className="h-12 text-center text-xl tracking-[0.4em] tnum"
              placeholder="••••••"
            />
          </Field>
          <Button type="submit" size="lg" block disabled={code.length < 6 || pending}>
            {pending ? "Logger inn …" : "Logg inn"}
          </Button>
        </form>
        <p className="mt-4 t-small text-ink-3">
          Kom det ingen kode? Gå til <a href={`/logg-inn?epost=${encodeURIComponent(email.trim())}`} className="underline underline-offset-2">innloggingssiden</a> og be om en ny.
        </p>
      </div>
    );
  }

  const ready = name.trim() && email.includes("@") && nodeId && (!needsCode || meetingCode.trim());
  return (
    <div>
      <h2 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.02em]">Bli ansvarlig for gruppa di</h2>
      <p className="mt-2 t-small text-ink-2">Lag brukeren din og velg gruppa du skal holde oppdatert. Du får en kode på e-post hver gang du logger inn, så du trenger ikke passord.</p>
      {!codeAvailable && <p className="mt-3 t-small text-ink-3">Innlogging med e-postkode er ikke satt opp her. Brukeren blir laget, men du må logge inn på en annen måte.</p>}
      <form
        className="mt-6 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) submit();
        }}
      >
        <Field label="Navn" htmlFor="leader-name">
          <Input id="leader-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
        </Field>
        <Field label="E-postadresse" htmlFor="leader-email">
          <Input id="leader-email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="navn@eksempel.no" className="h-12" />
        </Field>
        <Field label="Gruppa du er ansvarlig for" htmlFor="leader-group">
          <Select id="leader-group" value={nodeId} onChange={(e) => setNodeId(e.target.value)} className="h-12">
            <option value="">Velg gruppe</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id} disabled={g.taken}>
                {g.trail ? `${g.trail} · ` : ""}
                {g.name}
                {g.taken ? " (har allerede en ansvarlig)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        {needsCode && (
          <Field label="Møtekode" htmlFor="leader-meeting" hint="Du får den på møtet." error={error}>
          <Input id="leader-meeting" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={meetingCode} onChange={(e) => { setMeetingCode(e.target.value); setError(undefined); }} className="h-12" />
        </Field>
        )}
        {!needsCode && error && <p role="alert" className="t-small text-danger">{error}</p>}
        <Button type="submit" size="lg" block disabled={!ready || pending}>
          {pending ? "Lager bruker …" : "Bli ansvarlig"}
        </Button>
      </form>
    </div>
  );
}
