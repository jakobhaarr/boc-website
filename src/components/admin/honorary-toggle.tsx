"use client";

import { useState, useTransition } from "react";
import { setHonoraryMember } from "@/app/actions";
import { Button } from "@/components/ui/button";

/** Makes the person an honorary member, or takes it back. The list on /aeresmedlemmer shows them only while their privacy status is «visible». */
export function HonoraryToggle({ personId, honorary, year, visible }: { personId: string; honorary: boolean; year?: number; visible: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="mt-6 rounded-lg border border-line p-5">
      <h2 className="t-h3">Æresmedlem</h2>
      <p className="mt-2 max-w-[60ch] t-small text-ink-2">
        {honorary ? `Æresmedlem siden ${year}. ` : "Æresmedlemskap er klubbens høyeste utmerkelse, gitt av årsmøtet. "}
        Navnet vises på siden Æresmedlemmer.
        {!visible && " Personen har «Ikke publiser», så navnet vises ikke før det er endret."}
      </p>
      <div className="mt-4">
        <Button
          size="sm"
          variant={honorary ? "secondary" : "primary"}
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await setHonoraryMember(personId, !honorary);
              if (!res.ok) setError(res.error);
            })
          }
        >
          {pending ? "Lagrer …" : honorary ? "Fjern æresmedlemskap" : "Gjør til æresmedlem"}
        </Button>
        {error && (
          <p role="alert" className="mt-2 t-small text-danger">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
