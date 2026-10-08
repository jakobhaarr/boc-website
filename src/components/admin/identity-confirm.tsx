"use client";

import { BadgeCheck, Search, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { clearContactIdentity, confirmContactIdentity } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { IDENTITY_KIND_LABEL } from "@/lib/privacy-contact";

export type DirectoryItem = {
  kind: "person" | "external" | "user";
  id: string;
  name: string;
  /** What helps an administrator tell two people with the same name apart: groups, year of birth, role. */
  detail: string;
  /** Addresses the club holds for them, to compare with the sender's. */
  emails: string[];
};

const key = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zæøå ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * «Bekreft identitet» on a message from the privacy form: after checking who is writing, the administrator ties the
 * message to a person in the register, an external (a photographer) or a user (a guardian). Those whose address is the
 * sender's, or whose name is, come first; a search finds the rest. When it is done the access report is a click away.
 */
export function IdentityConfirm({
  contactId,
  fromName,
  fromEmail,
  directory,
  confirmed,
}: {
  contactId: string;
  fromName: string;
  fromEmail: string;
  directory: DirectoryItem[];
  confirmed?: { label: string; name: string; reportHref?: string };
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const matches = useMemo(() => {
    const mail = fromEmail.trim().toLowerCase();
    const who = key(fromName);
    const q = key(query);
    const scored = directory
      .map((d) => {
        const email = !!mail && d.emails.some((e) => e.toLowerCase() === mail);
        const name = key(d.name) === who;
        const part = !!q && (key(d.name).includes(q) || key(d.detail).includes(q));
        return { d, email, name, score: (email ? 4 : 0) + (name ? 2 : 0) + (part ? 1 : 0) };
      })
      .filter((x) => (q ? x.score > 0 && (x.d && (key(x.d.name).includes(q) || key(x.d.detail).includes(q) || x.email)) : x.score > 0));
    return scored.sort((a, b) => b.score - a.score || a.d.name.localeCompare(b.d.name, "nb")).slice(0, 8);
  }, [directory, fromEmail, fromName, query]);

  const run = (action: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) =>
    start(async () => {
      setError(null);
      const res = await action();
      if (!res.ok) return setError(res.error);
      after?.();
      router.refresh();
    });

  if (confirmed && !open) {
    return (
      <div className="mt-2 grid gap-1.5">
        <p className="flex items-start gap-1.5 t-small text-ink">
          <BadgeCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
          <span>
            <span className="font-medium">Identitet bekreftet:</span> {confirmed.name} <span className="text-ink-3">({confirmed.label})</span>
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {confirmed.reportHref && (
            <Link href={confirmed.reportHref} className="inline-flex items-center gap-1.5 t-small font-medium text-club hover:text-club-hover">
              Innsynsrapport
            </Link>
          )}
          <button type="button" disabled={pending} onClick={() => run(() => clearContactIdentity(contactId))} className="t-small text-ink-3 underline underline-offset-2 hover:text-ink">
            Fjern bekreftelsen
          </button>
        </div>
        {error && <p className="t-small text-danger">{error}</p>}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mt-2">
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <UserCheck aria-hidden className="size-4" />
          Bekreft identitet
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 grid max-w-[30rem] gap-3 rounded-lg border border-line bg-sunken p-3">
      <p className="t-small text-ink-2">
        Sjekk at det er riktig person som skriver, og velg hvem det er i registeret. Treff på e-postadressen eller navnet står først.
      </p>
      <label className="relative block">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
        <span className="sr-only">Søk etter person, ekstern eller bruker</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søk på navn eller gruppe"
          className="h-10 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-base focus:border-focus focus:ring-[3px] focus:ring-focus/20 focus:outline-none sm:text-sm"
        />
      </label>
      {matches.length === 0 ? (
        <p className="t-small text-ink-3">{query ? "Ingen treff." : "Ingen treff på navn eller e-post ennå. Søk etter personen."}</p>
      ) : (
        <ul className="grid gap-1.5">
          {matches.map(({ d, email, name }) => (
            <li key={`${d.kind}-${d.id}`} className="flex items-center justify-between gap-3 rounded-md bg-surface px-3 py-2 ring-1 ring-line">
              <span className="min-w-0">
                <span className="block truncate t-small font-medium text-ink">{d.name}</span>
                <span className="block truncate t-meta text-ink-3">
                  {IDENTITY_KIND_LABEL[d.kind]}
                  {d.detail ? ` · ${d.detail}` : ""}
                </span>
                {(email || name) && (
                  <span className={cn("mt-0.5 inline-block rounded-[3px] px-1.5 py-0.5 t-meta", email ? "bg-success-surface text-success" : "bg-warning-surface text-warning")}>
                    {email ? "E-posten stemmer" : "Navnet stemmer"}
                  </span>
                )}
              </span>
              <Button size="sm" disabled={pending} onClick={() => run(() => confirmContactIdentity(contactId, d.kind, d.id), () => setOpen(false))}>
                Bekreft
              </Button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="t-small text-danger">{error}</p>}
      <div>
        <button type="button" onClick={() => setOpen(false)} className="t-small text-ink-3 underline underline-offset-2 hover:text-ink">
          Avbryt
        </button>
      </div>
    </div>
  );
}
