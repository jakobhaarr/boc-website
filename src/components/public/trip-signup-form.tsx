"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { submitTripSignup } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { earliest, latest, TRIP } from "@/lib/trip-signup";

/**
 * The sign-up form for the club trip (lib/trip-signup.ts, `submitTripSignup`). Open to anyone, with two confirmations: that they
 * know they must be a member before the trip, and that the sign-up is binding once the invoice is paid. The hidden «website» field is for programs.
 */
export function TripSignupForm() {
  const [room, setRoom] = useState<"single" | "double">("double");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done)
    return (
      <div role="status" className="rounded-lg bg-surface p-6 shadow-card ring-1 ring-line">
        <span className="flex size-10 items-center justify-center rounded-full bg-success-surface text-success">
          <Check aria-hidden className="size-5" strokeWidth={2.5} />
        </span>
        <h3 className="mt-4 t-h3">Takk, du er påmeldt.</h3>
        <p className="mt-2 t-body text-ink-2">Du får en bekreftelse på e-post. Fakturaen sendes i desember, og påmeldingen er bindende når den er betalt.</p>
      </div>
    );

  return (
    <form
      className="relative grid gap-5 rounded-lg bg-surface p-5 shadow-card ring-1 ring-line sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const v = (k: string) => String(f.get(k) ?? "");
        setError(null);
        start(async () => {
          const res = await submitTripSignup({
            name: v("name"),
            email: v("email"),
            phone: v("phone"),
            arrival: v("arrival"),
            departure: v("departure"),
            room,
            shareWith: v("shareWith"),
            bike: v("bike"),
            nextOfKinName: v("kinName"),
            nextOfKinPhone: v("kinPhone"),
            note: v("note"),
            confirmMember: f.get("confirmMember") === "on",
            confirmBinding: f.get("confirmBinding") === "on",
            listed: f.get("listed") === "on",
            website: v("website"),
          });
          if (!res.ok) return setError(res.error);
          setDone(true);
        });
      }}
    >
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Ikke fyll ut
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field label="Navn" htmlFor="ts-name" hint="Fornavn og etternavn.">
          <Input id="ts-name" name="name" autoComplete="name" required maxLength={100} />
        </Field>
        <Field label="E-post" htmlFor="ts-email" hint="Bekreftelsen og fakturaen sendes hit.">
          <Input id="ts-email" name="email" type="email" autoComplete="email" required maxLength={200} />
        </Field>
        <Field label="Telefon" htmlFor="ts-phone">
          <Input id="ts-phone" name="phone" type="tel" autoComplete="tel" required maxLength={30} />
        </Field>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field label="Ankomst" htmlFor="ts-arrival">
          <Input id="ts-arrival" name="arrival" type="date" required defaultValue={TRIP.from} min={earliest()} max={latest()} />
        </Field>
        <Field label="Retur" htmlFor="ts-departure">
          <Input id="ts-departure" name="departure" type="date" required defaultValue={TRIP.to} min={earliest()} max={latest()} />
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="t-label text-ink">Rom</legend>
          <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
            {([
              ["double", "Dobbeltrom", TRIP.priceDouble],
              ["single", "Enkeltrom", TRIP.priceSingle],
            ] as const).map(([value, label, price]) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 rounded-md border bg-surface px-4 py-3.5 transition-colors duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-focus/30",
                  room === value ? "border-[var(--club-link)] bg-club-tint ring-1 ring-[var(--club-link)]" : "border-line-strong hover:border-ink-3",
                )}
              >
                <input type="radio" name="room" value={value} checked={room === value} onChange={() => setRoom(value)} className="sr-only" />
                <span className="t-label font-semibold text-ink">{label}</span>
                <span className="t-small tnum text-ink-2">{price} euro per person</span>
              </label>
            ))}
          </div>
          <p className="mt-1.5 t-small text-ink-3">Halvpensjon er inkludert i begge.</p>
        </fieldset>
        {room === "double" && (
          <Field label="Bor sammen med" htmlFor="ts-share" optional hint="Navnet på den du deler rom med.">
            <Input id="ts-share" name="shareWith" maxLength={100} />
          </Field>
        )}
        <Field label="Sykkel" htmlFor="ts-bike">
          <Select id="ts-bike" name="bike" defaultValue="own">
            <option value="own">Egen sykkel</option>
            <option value="rent">Leier sykkel</option>
          </Select>
        </Field>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field label="Nærmeste pårørende" htmlFor="ts-kin" hint="Brukes bare hvis noe skjer under turen.">
          <Input id="ts-kin" name="kinName" required maxLength={100} />
        </Field>
        <Field label="Telefon til pårørende" htmlFor="ts-kinphone">
          <Input id="ts-kinphone" name="kinPhone" type="tel" required maxLength={30} />
        </Field>
      </div>

      <Field label="Noe vi bør vite" htmlFor="ts-note" optional>
        <Textarea id="ts-note" name="note" rows={3} maxLength={500} />
      </Field>

      <div className="grid gap-3 border-t border-line pt-5">
        <Checkbox name="confirmMember" label="Jeg vet at jeg må være medlem av BOC før turen" description="Turen er for medlemmer. Har du ikke fornyet eller meldt deg inn ennå, gjør du det før du drar." />
        <Checkbox name="confirmBinding" label="Jeg forstår at påmeldingen er bindende når fakturaen er betalt" description="Fakturaen sendes i desember." />
        <Checkbox name="listed" defaultChecked label="Vis navnet mitt i deltakerlisten" description="Listen er åpen og viser navn, rom, romkamerat og sykkel. Telefon, e-post og pårørende vises aldri." />
      </div>

      <p className="t-small text-ink-3">Opplysningene brukes bare til å arrangere turen, og bare de som styrer påmeldingen ser dem. Du kan be om å få dem slettet.</p>

      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" size="lg" disabled={pending} className="max-sm:w-full">
          {pending ? "Sender …" : "Meld meg på"}
        </Button>
      </div>
    </form>
  );
}
