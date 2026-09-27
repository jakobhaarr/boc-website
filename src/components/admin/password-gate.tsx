"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { unlockAdmin } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

/** The shared admin password (lib/admin-auth.ts), asked for before the demo sign-in. */
export function PasswordGate({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await unlockAdmin(password);
          if (!res.ok) return setError(true);
          router.push(next);
          router.refresh();
        });
      }}
    >
      <div>
        <h2 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.02em]">Logg inn</h2>
        <p className="mt-2 t-small text-ink-2">Administrasjonen er foreløpig beskyttet med et felles passord.</p>
      </div>
      <Field label="Passord" htmlFor="admin-passord" error={error ? "Feil passord." : undefined}>
        <Input
          id="admin-passord"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          className="h-12"
        />
      </Field>
      <Button type="submit" size="lg" block disabled={!password || pending}>
        Logg inn
      </Button>
    </form>
  );
}
