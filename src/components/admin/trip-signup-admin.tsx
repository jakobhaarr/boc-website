"use client";

import { Bike, BedDouble, BedSingle, Download, Mail, Phone, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteTripSignup, importTripSignups, importTripSignupsFromSheet } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { formatDayMonth, formatDayMonthShort } from "@/lib/dates";
import { BIKE_LABEL, ROOM_LABEL, roomsOf, TRIP } from "@/lib/trip-signup";
import type { TripSignupView } from "@/lib/trip-sheet";

export type SignupRow = TripSignupView;

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** «6. nov. kl. 01:27» from «2026-11-06T01:27». */
const when = (at: string) => `${formatDayMonthShort(at.slice(0, 10)).replace(/^(\d+) /, "$1. ")}. kl. ${at.slice(11, 16)}`;
const initials = (name: string) => {
  const p = name.trim().split(/\s+/);
  return `${p[0]?.[0] ?? ""}${p.length > 1 ? p[p.length - 1][0] : ""}`.toUpperCase();
};

/** A bar split into parts, each with its share of the whole. */
function Split({ parts, label }: { parts: { n: number; className: string; label: string }[]; label: string }) {
  const total = parts.reduce((a, p) => a + p.n, 0) || 1;
  return (
    <div>
      <div role="img" aria-label={label} className="flex h-2.5 overflow-hidden rounded-full bg-sunken">
        {parts.map((p) => (
          <span key={p.label} className={p.className} style={{ width: `${(p.n / total) * 100}%` }} />
        ))}
      </div>
      <p className="mt-1.5 flex flex-wrap gap-x-4 t-small text-ink-2">
        {parts.map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2 rounded-full", p.className)} />
            <span className="tnum font-medium text-ink">{p.n}</span> {p.label}
          </span>
        ))}
      </p>
    </div>
  );
}

function Tile({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-line bg-surface p-4 sm:p-5", className)}>
      <p className="t-meta text-ink-3">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** The sign-ups with contact details, a download for the hotel list, paste-in of the club's sheet, and removal. */
export function TripSignupAdmin({
  rows,
  rooms,
  taken,
  weekAgo,
  sheet,
}: {
  rows: SignupRow[];
  rooms: number;
  /** Rooms taken, counted by `roomsTaken`. */ taken: number;
  /** A week ago, «ÅÅÅÅ-MM-DDTTT:MM». */ weekAgo: string;
  sheet: { read: boolean; write: boolean };
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [text, setText] = useState("");
  const [report, setReport] = useState<string>();
  const [link, setLink] = useState("");
  const singles = rows.filter((r) => r.room === "single").length;
  const doubles = rows.length - singles;
  const rent = rows.filter((r) => r.bike === "rent").length;
  const roomGroups = roomsOf(rows);
  // The dashboard: what is in, what is missing, and what came in lately (those before the site took sign-ups stand at TRIP.baselineAt).
  const left = Math.max(0, rooms - taken);
  const share = Math.min(100, Math.round((taken / rooms) * 100));
  const fresh = rows.filter((r) => r.createdAt > TRIP.baselineAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const lastWeek = fresh.filter((r) => r.createdAt >= weekAgo).length;
  const missing = [
    { label: "uten e-post", n: rows.filter((r) => !r.email).length },
    { label: "uten telefon", n: rows.filter((r) => !r.phone).length },
    { label: "uten pårørende", n: rows.filter((r) => !r.nextOfKinName || !r.nextOfKinPhone).length },
    { label: "dobbeltrom uten romkamerat", n: rows.filter((r) => r.room === "double" && !r.shareWith).length },
    { label: "navnet er skjult i listen", n: rows.filter((r) => !r.listed).length },
  ].filter((m) => m.n > 0);

  const download = () => {
    const head = ["Navn", "Ankomst", "Retur", "Telefon", "E-post", "Rom", "Bor sammen med", "Sykkel", "Nærmeste pårørende", "Telefon pårørende", "Merknad"];
    const lines = [
      head,
      ...rows.map((r) => [
        r.name,
        r.arrival,
        r.departure,
        r.phone,
        r.email,
        ROOM_LABEL[r.room],
        r.shareWith ?? "",
        BIKE_LABEL[r.bike],
        r.nextOfKinName,
        r.nextOfKinPhone,
        r.note ?? "",
      ]),
    ];
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
      setReport(
        `${res.added} lagt til${res.duplicates ? `, ${res.duplicates} fantes fra før` : ""}${res.skipped ? `, ${res.skipped} rader uten navn hoppet over` : ""}${res.datesGuessed ? `. ${res.datesGuessed} datoer kunne ikke leses og har fått turdatoene, sjekk dem` : ""}.`,
      );
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

  /** One person: avatar, labels, dates, contact, next of kin, what is missing and when they signed up. */
  const renderPerson = (r: SignupRow) => {
    const gaps = [!r.email && "e-post", !r.phone && "telefon", (!r.nextOfKinName || !r.nextOfKinPhone) && "pårørende"].filter(Boolean) as string[];
    return (
      <li key={r.id} className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start md:gap-4">
        <span aria-hidden className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-club-tint font-display text-[0.95rem] font-semibold text-club md:flex">
          {initials(r.name)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <p className="t-label font-semibold">{r.name}</p>
            <Status tone={r.room === "single" ? "ink" : "club"} icon={r.room === "single" ? <BedSingle aria-hidden /> : <BedDouble aria-hidden />}>
              {ROOM_LABEL[r.room]}
              {r.shareWith ? `, med ${r.shareWith}` : ""}
            </Status>
            <Status tone={r.bike === "rent" ? "warning" : "neutral"} icon={<Bike aria-hidden />}>
              {BIKE_LABEL[r.bike]}
            </Status>
            {!r.listed && <Status tone="neutral">Navnet er skjult</Status>}
          </div>
          <p className="mt-1.5 t-small text-ink-2 tnum">
            {formatDayMonth(r.arrival)} til {formatDayMonth(r.departure)}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 t-small text-ink-2">
            {r.phone && (
              <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                <Phone aria-hidden className="size-3.5 text-ink-3" />
                {r.phone}
              </a>
            )}
            {r.email && (
              <a href={`mailto:${r.email}`} className="inline-flex min-w-0 items-center gap-1.5 break-all hover:text-ink">
                <Mail aria-hidden className="size-3.5 shrink-0 text-ink-3" />
                {r.email}
              </a>
            )}
          </p>
          <p className="mt-1 t-small text-ink-3">Pårørende: {[r.nextOfKinName, r.nextOfKinPhone].filter(Boolean).join(", ") || "mangler"}</p>
          {gaps.length > 0 && (
            <p className="mt-1.5">
              <Status tone="warning">Mangler {gaps.join(", ")}</Status>
            </p>
          )}
          {r.note && <p className="mt-1.5 rounded-md bg-sunken px-3 py-2 t-small text-ink-2">{r.note}</p>}
        </div>
        <div className="flex flex-col gap-2 md:items-end md:text-right">
          <p className="t-small text-ink-3 tnum">Påmeldt {when(r.createdAt)}</p>
          {r.inSheet ? (
            <p className="t-small text-ink-3 md:max-w-40">I regnearket. Rediger eller fjern der.</p>
          ) : (
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => confirm(`Fjerne ${r.name}?`) && remove(r)} className="max-sm:w-full">
              <Trash2 aria-hidden />
              Fjern
            </Button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="grid max-w-5xl gap-6">
      <section aria-label="Oversikt" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile title="Rom tatt" className="sm:col-span-2">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-[2.75rem] leading-none font-semibold tnum">{taken}</span>
            <span className="t-body text-ink-3">av {rooms} rom</span>
            <span className="ml-auto t-small font-medium text-ink-2">{left} igjen</span>
          </p>
          <div
            role="progressbar"
            aria-valuenow={taken}
            aria-valuemin={0}
            aria-valuemax={rooms}
            aria-label={`${taken} av ${rooms} rom er tatt`}
            className="mt-4 h-3 overflow-hidden rounded-full bg-sunken"
          >
            {/* Spond's red (#f72b51, as on the Spond buttons), since the places are the ones in Spond's hotel booking sheet. */}
            <span className="block h-full rounded-full bg-[#f72b51] transition-[width] duration-500" style={{ width: `${share}%` }} />
          </div>
        </Tile>
        <Tile title="Påmeldte">
          <p className="font-display text-[2.75rem] leading-none font-semibold tnum">{rows.length}</p>
          <p className="mt-2 t-small text-ink-2">{fresh.length ? `${lastWeek} siste 7 dager` : "Ingen nye via siden ennå"}</p>
        </Tile>
        <Tile title="Siste påmeldinger">
          {fresh.length ? (
            <ul className="grid gap-1.5 t-small">
              {fresh.slice(0, 3).map((r) => (
                <li key={r.id} className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-medium text-ink">{r.name}</span>
                  <span className="shrink-0 text-ink-3 tnum">{when(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-small text-ink-3">Påmeldinger via siden vises her.</p>
          )}
        </Tile>
        <Tile title="Rom" className="sm:col-span-1">
          <Split
            label={`${singles} enkeltrom og ${doubles} i dobbeltrom`}
            parts={[
              { n: doubles, className: "bg-[var(--club-link)]", label: "i dobbeltrom" },
              { n: singles, className: "bg-[var(--club-primary)] ring-1 ring-inset ring-black/10", label: "enkeltrom" },
            ]}
          />
        </Tile>
        <Tile title="Sykkel">
          <Split
            label={`${rows.length - rent} egen sykkel og ${rent} leier`}
            parts={[
              { n: rows.length - rent, className: "bg-[var(--club-link)]", label: "egen" },
              { n: rent, className: "bg-[var(--club-primary)] ring-1 ring-inset ring-black/10", label: "leier" },
            ]}
          />
        </Tile>
        <Tile title="Mangler opplysninger" className="sm:col-span-2">
          {missing.length ? (
            <ul className="flex flex-wrap gap-2">
              {missing.map((m) => (
                <li key={m.label}>
                  <Status tone="warning">
                    <span className="tnum font-semibold">{m.n}</span> {m.label}
                  </Status>
                </li>
              ))}
            </ul>
          ) : (
            <Status tone="success">Alt er fylt ut</Status>
          )}
        </Tile>
      </section>
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
      <Panel
        title="Påmeldte"
        action={
          <Button size="sm" variant="secondary" onClick={download} disabled={!rows.length}>
            <Download aria-hidden />
            Last ned CSV
          </Button>
        }
      >
        {rows.length === 0 ? (
          <p className="px-4 py-6 t-small text-ink-3 sm:px-5">Ingen er påmeldt ennå.</p>
        ) : (
          <ul className="divide-y divide-line">
            {roomGroups.map((room) =>
              room.people.length > 1 ? (
                <li key={room.people.map((p) => p.id).join("+")} className="px-2 py-3 sm:px-3">
                  <div className="rounded-lg bg-club-tint/40 ring-1 ring-[var(--club-link)]/25">
                    <p className="flex items-center gap-2 px-4 pt-3 t-meta text-club sm:px-5">
                      <BedDouble aria-hidden className="size-4" />
                      Delt dobbeltrom, telles som ett rom
                    </p>
                    <ul className="divide-y divide-line/60">{room.people.map(renderPerson)}</ul>
                  </div>
                </li>
              ) : (
                renderPerson(room.people[0])
              ),
            )}
          </ul>
        )}
      </Panel>
      <Panel title="Legg inn fra regnearket">
        <div className="grid gap-3 p-4 sm:p-5">
          <p className="t-small text-ink-2">
            Marker radene i regnearket «Mallorca 2027», kopier og lim inn her. Kolonnene leses i denne rekkefølgen: WhatsApp, Navn, Ankomst, Retur, Tlf, Mail, Enkeltrom/dobbeltrom,
            Bor sammen med, Leie/egen sykkel, Nærmeste pårørende, Kontakttelefon. Overskriftsraden kan være med. Det du limer inn legges ikke i prosjektet, bare i påmeldingslisten.
            Navnene vises i den åpne deltakerlisten.
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
