"use client";

import { useState, useTransition } from "react";
import { answerConsent } from "@/app/actions";
import { Button } from "@/components/ui/button";

/** The two answers to a consent request, one press each. The answer cannot be changed afterwards on this page. */
export function ConsentAnswer({ token, firstName }: { token: string; firstName: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<"granted" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const answer = (a: "granted" | "declined") =>
    start(async () => {
      setError(null);
      const res = await answerConsent(token, a);
      if (!res.ok) return setError(res.error);
      setDone(res.status);
    });

  if (done) {
    return (
      <p role="status" className="rounded-md bg-sunken px-4 py-3 t-body text-ink">
        {done === "granted" ? "Takk. Du har sagt ja, og bildene legges ut." : `Takk. Du har sagt nei, og bildene av ${firstName} brukes ikke.`}
      </p>
    );
  }
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-3">
        <Button size="lg" disabled={pending} onClick={() => answer("granted")}>
          Ja, bildene kan brukes
        </Button>
        <Button size="lg" variant="secondary" disabled={pending} onClick={() => answer("declined")}>
          Nei, ikke bruk bildene
        </Button>
      </div>
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
