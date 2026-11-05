"use client";

import { Download, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteTripSignup, importTripSignups, importTripSignupsFromSheet } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Status } from "@/components/ui/primitives";
import { formatDayMonth } from "@/lib/dates";
import { BIKE_LABEL, ROOM_LABEL } from "@/lib/trip-signup";
import type { TripSignupView } from "@/lib/trip-sheet";

export type SignupRow = TripSignupView;

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** The sign-ups with contact details, a download for the hotel list, paste-in of the club's sheet, and removal. */
export function TripSignupAdmin({ rows, rooms, sheet }: { rows: SignupRow[]; rooms: number; sheet: { read: boolean; write: boolean } }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [text, setText] = useState("");
  const [report, setReport] = useState<string>();
  const [link, setLink] = useState("");
  const singles = rows.filter((r) => r.room === "single").length;
  const doubles = rows.length - singles;
  const rent = rows.filter((r) => r.bike === "rent").length;

  const download = () => {
    const head = ["Navn", "Ankomst", "Retur", "Telefon", "E-post", "Rom", "Bor sammen med", "Sykkel", "Nærmeste pårørende", "Telefon pårørende", "Merknad"];
    const lines = [head, ...rows.map((r) => [r.name, r.arrival, r.departure, r.phone, r.email, ROOM_LABEL[r.room], r.shareWith ?? "", BIKE_LABEL[r.bike], r.nextOfKinName, r.nextOfKinPhone, r.note ?? ""])];
    const csv = "﻿" + lines.map((l) => l.map(csvCell).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "mallorca-pamelding.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const runImport = (fromLink = false) =>
    start(async () => {
      setError(undefined);
      setReport(undefined);
      const res = fromLink ? await importTripSignupsFromSheet(link) : await importTripSignups(text);
      if (!res.ok) return setError(res.error);
      setReport(`${res.added} lagt til${res.duplicates ? `, ${res.duplicates} fantes fra før` : ""}${res.skipped ? `, ${res.skipped} rader uten navn hoppet over` : ""}${res.datesGuessed ? `. ${res.datesGuessed} datoer kunne ikke leses og har fått turdatoene, sjekk dem` : ""}.`);
      if (fromLink) setLink("");
      else setText("");
      announceChange();
    });

  const remove = (r: SignupRow) =>
    start(async () => {
      setError(undefined);
      const res = await deleteTripSignup(r.id);
      if (!res.ok) return setError(res.error);
      announceChange();
    });

  return (
    <div className="grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 t-small text-ink-2">
        <span>
          <span className="t-h4 tnum text-ink">{rows.length}</span> påmeldt
        </span>
        <span>{doubles} i dobbeltrom</span>
        <span>{singles} i enkeltrom</span>
        <span>{rent} leier sykkel</span>
        <span className="text-ink-3">{rooms} rom i avtalen</span>
      </div>
      <p className="t-small text-ink-3">
        {sheet.read
          ? `Listen leses fra regnearket (hvert minutt). ${sheet.write ? "Nye påmeldinger skrives til regnearket." : "Nye påmeldinger skrives ikke til regnearket ennå, fordi skriveoppsettet mangler."} Rader som står i regnearket endres eller fjernes der.`
          : "Regnearket er ikke koblet til ennå. Listen er den som ligger på nettsiden."}
      </p>
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      <Panel title="Påmeldte" action={<Button size="sm" variant="secondary" onClick={download} disabled={!rows.length}><Download aria-hidden />Last ned CSV</Button>}>
        {rows.length === 0 ? (
          <p className="px-4 py-6 t-small text-ink-3 sm:px-5">Ingen er påmeldt ennå.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="grid gap-2 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="t-label font-semibold">{r.name}</p>
                    {(r.inSheet || r.imported) && <Status tone="neutral">I regnearket</Status>}
                    {!r.listed && <Status tone="warning">Navnet er skjult i listen</Status>}
                  </div>
                  <p className="mt-0.5 t-small text-ink-2">
                    {formatDayMonth(r.arrival)} til {formatDayMonth(r.departure)} · {ROOM_LABEL[r.room]}
                    {r.shareWith ? `, med ${r.shareWith}` : ""} · {BIKE_LABEL[r.bike]}
                  </p>
                  <p className="mt-0.5 break-all t-small text-ink-3">
                    {[r.phone, r.email].filter(Boolean).join(" · ") || "Mangler kontaktinfo"}
                  </p>
                  <p className="mt-0.5 t-small text-ink-3">Pårørende: {[r.nextOfKinName, r.nextOfKinPhone].filter(Boolean).join(", ") || "mangler"}</p>
                  {r.note && <p className="mt-1 t-small text-ink-2">{r.note}</p>}
                </div>
                {r.inSheet ? (
                  <p className="t-small text-ink-3 md:max-w-40">Rediger eller fjern i regnearket</p>
                ) : (
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => confirm(`Fjerne ${r.name}?`) && remove(r)} className="max-sm:w-full">
                    <Trash2 aria-hidden />
                    Fjern
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Legg inn fra regnearket">
        <div className="grid gap-3 p-4 sm:p-5">
          <p className="t-small text-ink-2">
            Marker radene i regnearket «Mallorca 2027», kopier og lim inn her. Kolonnene leses i denne rekkefølgen: WhatsApp, Navn, Ankomst, Retur, Tlf, Mail, Enkeltrom/dobbeltrom, Bor sammen med, Leie/egen sykkel, Nærmeste pårørende, Kontakttelefon. Overskriftsraden kan være med. Det du limer inn legges ikke i prosjektet, bare i påmeldingslisten. Navnene vises i den åpne deltakerlisten.
          </p>
          <Field label="Lenke til regnearket" htmlFor="ts-link" hint="Regnearket må være delt med alle som har lenken.">
            <Input id="ts-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" />
          </Field>
          <div>
            <Button onClick={() => runImport(true)} disabled={pending || !link.trim()} className="max-sm:w-full">
              {pending ? "Henter …" : "Hent fra regnearket"}
            </Button>
          </div>
          <p className="t-small text-ink-3">Eller lim inn radene selv:</p>
          <Field label="Rader fra regnearket" htmlFor="ts-import">
            <Textarea id="ts-import" rows={6} value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-[13px]" />
          </Field>
          {report && (
            <p role="status" className="t-small text-ink">
              {report}
            </p>
          )}
          <div>
            <Button onClick={() => runImport()} disabled={pending || !text.trim()} className="max-sm:w-full">
              {pending ? "Legger inn …" : "Legg inn"}
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
