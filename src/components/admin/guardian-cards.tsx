"use client";

import { Check, Mail, Phone, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { recordPhotoConsent } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Avatar, Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export interface GuardianCard {
  id: string;
  name: string;
  email: string;
  phone?: string;
  providers: string[];
}

export interface GuardianshipData {
  /** Under 16 in the current season — then a guardian answers for the child. */
  minor: boolean;
  age?: number;
  personId: string;
  firstName: string;
  groupName?: string;
  consent: "granted" | "declined" | "unknown";
  consentBy?: string;
  consentAt?: string;
  canRecord: boolean;
  guardians: GuardianCard[];
}

const CONSENT: Record<GuardianshipData["consent"], { label: string; tone: "success" | "danger" | "warning" }> = {
  granted: { label: "Samtykke gitt", tone: "success" },
  declined: { label: "Samtykke ikke gitt", tone: "danger" },
  unknown: { label: "Samtykke mangler", tone: "warning" },
};

/**
 * Guardians of a member under 16, as contact cards: this is who the club
 * asks when consent is missing, and who the answer is registered on behalf
 * of. Registering consent is a write, so it goes through the server action
 * and is written to the audit log.
 */
export function GuardianCards({ data }: { data: GuardianshipData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const consent = CONSENT[data.consent];

  const record = (decision: "granted" | "declined", guardianName?: string) => {
    setBusy(decision);
    startTransition(async () => {
      const res = await recordPhotoConsent(data.personId, decision, guardianName);
      setBusy(null);
      if (res.ok) {
        announceChange();
        router.refresh();
      }
    });
  };

  const mailto = (g: GuardianCard) =>
    `mailto:${g.email}?subject=${encodeURIComponent(`Samtykke til bilder av ${data.firstName}`)}&body=${encodeURIComponent(
      `Hei ${g.name.split(" ")[0]},\n\nVi mangler registrert samtykke til at ${data.firstName} kan vises på bilder på klubbens nettsider${
        data.groupName ? ` (${data.groupName})` : ""
      }. Svar gjerne på denne e-posten, så registrerer vi svaret.\n\nDu kan når som helst trekke samtykket tilbake.\n`,
    )}`;

  return (
    <section aria-labelledby="foresatte" className="rounded-lg border border-line bg-surface">
      <h2 id="foresatte" className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <span className="t-label font-semibold">Foresatte</span>
        <Status tone={consent.tone}>{consent.label}</Status>
      </h2>

      <p className="px-4 pt-3.5 t-small text-ink-2 sm:px-5">
        {data.minor
          ? `${data.firstName} er ${data.age} år. Foresatte svarer på samtykke og er klubbens kontakt.`
          : `${data.firstName} er ${data.age ?? "over 16"} år og svarer selv, men foresatte står fortsatt registrert.`}
      </p>

      {data.guardians.length === 0 ? (
        <div className="m-4 flex gap-2.5 rounded-md bg-warning-surface px-3.5 py-3 t-small text-warning sm:mx-5">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>Ingen foresatt er registrert. Klubben har da ingen å spørre om samtykke.</span>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {data.guardians.map((g) => (
            <li key={g.id} className="px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <Avatar name={g.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="t-label">
                    {g.name} <span className="font-normal text-ink-3">· foresatt</span>
                  </p>
                  <div className="mt-1.5 flex flex-col gap-1 t-small">
                    <a href={`mailto:${g.email}`} className="inline-flex min-w-0 items-center gap-2 text-ink-2 transition-colors hover:text-club">
                      <Mail aria-hidden className="size-3.5 shrink-0 text-ink-3" />
                      <span className="truncate">{g.email}</span>
                    </a>
                    {g.phone && (
                      <a href={`tel:${g.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-ink-2 tnum transition-colors hover:text-club">
                        <Phone aria-hidden className="size-3.5 text-ink-3" />
                        {g.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {data.canRecord && (
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {data.consent !== "granted" && (
                    <Button size="sm" disabled={pending} onClick={() => record("granted", g.name)}>
                      {busy === "granted" && pending ? "Lagrer …" : "Registrer samtykke"}
                      <Check aria-hidden />
                    </Button>
                  )}
                  {data.consent !== "declined" && (
                    <Button size="sm" variant="secondary" disabled={pending} onClick={() => record("declined", g.name)}>
                      Registrer nei
                      <X aria-hidden />
                    </Button>
                  )}
                  {data.consent === "unknown" && (
                    <a href={mailto(g)} className="inline-flex h-8 items-center rounded-[var(--radius-button)] px-3 text-[13px] font-medium text-ink-2 hover:bg-sunken hover:text-ink">
                      Be om samtykke på e-post
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className={cn("flex gap-2.5 border-t border-line px-4 py-3 t-small text-ink-3 sm:px-5")}>
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>
          {data.consentBy ? `Sist registrert av ${data.consentBy}${data.consentAt ? ` · ${data.consentAt}` : ""}. ` : "Ingen registrering ennå. "}
          Samtykket kan trekkes tilbake når som helst.
        </span>
      </div>
    </section>
  );
}
