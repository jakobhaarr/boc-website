"use client";

import { ArrowUpRight, Check, Info, Lock, MessageSquareQuote, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { anonymise, type AnonymiseResult } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Photo } from "@/components/public/photo";
import { Inlines } from "@/components/public/rich-text";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { expandRegion, type PublicUse, type TextLocation } from "@/lib/privacy";
import type { Inline, Photo as PhotoRecord, PrivacyStatus, Region } from "@/lib/types";
import { PrivacyStatusBadge } from "./bits";
import { GuardianCards, type GuardianshipData } from "./guardian-cards";

export interface PersonPrivacyData {
  person: {
    id: string;
    name: string;
    firstName: string;
    birthYear?: number;
    status: PrivacyStatus;
    consent: "granted" | "declined" | "unknown";
    consentBy?: string;
    consentAt?: string;
  };
  memberships: { role: string; path: string; href: string }[];
  account: {
    own?: { email: string; providers: string[] };
  };
  guardianship: GuardianshipData;
  request?: { from: string; relation: string; receivedAt: string; message: string };
  presence: {
    photos: { photo: PhotoRecord; region: Region | null; uses: PublicUse[] }[];
    text: (TextLocation & { whereLabel: string })[];
    activities: { id: string; title: string; when: string; role: string; label: string; before: string; after: string }[];
    articleCount: number;
    pageCount: number;
  };
  canAnonymise: boolean;
  actorRole: string;
  completed?: { at: string; by: string; summary: string; articles: { title: string; href: string }[] };
}

type Tab = "photos" | "text" | "activities";
type Phase = "closed" | "confirm" | "processing" | "done" | "error";

const withRedaction = (p: { photo: PhotoRecord; region: Region | null }): PhotoRecord =>
  p.region ? { ...p.photo, redactions: [...p.photo.redactions, expandRegion(p.region)] } : p.photo;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Renders text as it will read after anonymisation, with replacements marked. */
function AfterText({ content, personId }: { content: Inline[]; personId: string }) {
  return (
    <>
      {content.map((i, idx) =>
        i.type === "mention" && i.personId === personId ? (
          i.neutral ? (
            <mark key={idx} className="rounded-xs bg-success-surface px-0.5 text-success">
              {i.neutral}
            </mark>
          ) : null
        ) : (
          <span key={idx}>{i.text}</span>
        ),
      )}
    </>
  );
}

export function PersonPrivacy({ data }: { data: PersonPrivacyData }) {
  const { person, presence } = data;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("photos");
  const [preview, setPreview] = useState(false);
  const [inspect, setInspect] = useState<PersonPrivacyData["presence"]["photos"][number] | null>(null);

  // Anonymisation flow. The dialog works from a snapshot so the page can
  // re-render with the rewritten data underneath it.
  const [phase, setPhase] = useState<Phase>("closed");
  const [typed, setTyped] = useState("");
  const [snapshot, setSnapshot] = useState<PersonPrivacyData["presence"] | null>(null);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState({ photos: 0, text: 0, activities: 0 });
  const [result, setResult] = useState<Extract<AnonymiseResult, { ok: true }> | null>(null);
  const [error, setError] = useState("");

  const total = presence.photos.length + presence.text.length + presence.activities.length;
  const anonymised = person.status === "anonymised";
  const confirmMatches = typed.trim().toLocaleLowerCase("nb") === person.name.toLocaleLowerCase("nb");

  const openConfirm = () => {
    setSnapshot(presence);
    setTyped("");
    setError("");
    setPhase("confirm");
  };

  const run = async () => {
    if (!snapshot) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 80) : ms));
    setPhase("processing");
    setStep(0);
    setProgress({ photos: 0, text: 0, activities: 0 });

    await wait(1100);
    setStep(1);
    for (let i = 1; i <= snapshot.photos.length; i++) {
      setProgress((p) => ({ ...p, photos: i }));
      await wait(120);
    }
    await wait(250);
    setStep(2);
    for (let i = 1; i <= snapshot.text.length; i++) {
      setProgress((p) => ({ ...p, text: i }));
      await wait(170);
    }
    await wait(150);
    setStep(3);
    for (let i = 1; i <= snapshot.activities.length; i++) {
      setProgress((p) => ({ ...p, activities: i }));
      await wait(220);
    }
    setStep(4);
    const [res] = await Promise.all([anonymise(person.id, typed), wait(1000)]);
    if (!res.ok) {
      setError(res.error);
      setPhase("error");
      return;
    }
    announceChange();
    setResult(res);
    setStep(5);
    await wait(600);
    setPhase("done");
  };

  const close = () => {
    setPhase("closed");
    router.refresh();
  };

  const snap = snapshot ?? presence;
  const steps = [
    {
      label: "Finner publisert innhold",
      detail:
        step > 0
          ? `${plural(snap.photos.length, "bilde", "bilder")}, ${plural(snap.text.length, "tekstlig omtale", "tekstlige omtaler")} og ${plural(snap.activities.length, "aktivitet", "aktiviteter")}`
          : "Går gjennom artikler, bilder, lagsider og aktiviteter",
    },
    { label: "Dekker til personen i bilder", detail: `${progress.photos} av ${snap.photos.length}` },
    { label: "Fjerner navn og identifiserende omtaler", detail: `${progress.text} av ${snap.text.length}` },
    { label: "Fjerner navn fra aktiviteter", detail: `${progress.activities} av ${snap.activities.length}` },
    { label: "Publiserer endrede sider", detail: "Artikler, lagsider, kalender og forside" },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 pt-5 pb-8 sm:flex-row sm:items-center">
        <Avatar name={person.name} size={64} tone={anonymised ? "muted" : "neutral"} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] md:text-[2rem]">{person.name}</h1>
            <PrivacyStatusBadge status={person.status} />
          </div>
          <p className="mt-1 t-small text-ink-2">
            {[person.birthYear ? `Født ${person.birthYear}` : null, data.memberships.map((m) => `${m.role} i ${m.path.split(" › ").at(-1)}`).join(", "), data.account.own ? "Har egen brukerkonto" : "Ingen egen brukerkonto"]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {data.request && !anonymised && (
            <section aria-labelledby="foresporsel" className="rounded-lg border border-danger/25 bg-danger-surface p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <MessageSquareQuote aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
                <div>
                  <h2 id="foresporsel" className="t-label font-semibold">
                    Forespørsel om anonymisering
                  </h2>
                  <p className="mt-1 t-small text-ink-2">
                    Fra {data.request.from} ({data.request.relation.toLowerCase()}), mottatt {data.request.receivedAt}
                  </p>
                  <blockquote className="mt-3 border-l-2 border-danger/40 pl-3 t-small text-ink">«{data.request.message}»</blockquote>
                </div>
              </div>
            </section>
          )}

          {data.completed && (
            <section aria-labelledby="fullfort" className="rounded-lg border border-line bg-surface p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-inverse text-ink-inverse">
                  <ShieldCheck aria-hidden className="size-4" />
                </span>
                <div className="min-w-0">
                  <h2 id="fullfort" className="t-label font-semibold">
                    Anonymisert {data.completed.at}
                  </h2>
                  <p className="mt-0.5 t-small text-ink-2">
                    Utført av {data.completed.by}. {data.completed.summary}
                  </p>
                  {data.completed.articles.length > 0 && (
                    <>
                      <p className="mt-4 t-meta text-ink-3">Endret innhold</p>
                      <ul className="mt-1.5 divide-y divide-line border-y border-line">
                        {data.completed.articles.map((a) => (
                          <li key={a.href}>
                            <a href={a.href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 py-2 t-small hover:text-club">
                              <span className="truncate">{a.title}</span>
                              <ArrowUpRight aria-hidden className="size-3.5 shrink-0 text-ink-3" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <p className="mt-4 flex gap-2 t-small text-ink-3">
                    <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                    Anonymiseringen er permanent. {person.firstName} kan ikke merkes i nye bilder eller kobles til nye innlegg.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Published presence */}
          <section aria-labelledby="tilstedevarelse" className="rounded-lg border border-line bg-surface">
            <div className="border-b border-line px-4 pt-4 sm:px-5">
              <h2 id="tilstedevarelse" className="t-label font-semibold">
                Offentlig synlig
              </h2>
              <p className="t-small text-ink-3">
                {total === 0
                  ? `${person.firstName} finnes ikke i noe publisert innhold.`
                  : `Alt publisert innhold som er koblet til ${person.firstName} — ${plural(presence.articleCount, "artikkel", "artikler")}${presence.pageCount ? ` og ${plural(presence.pageCount, "side", "sider")}` : ""}.`}
              </p>
              <div role="tablist" aria-label="Type innhold" className="mt-4 -mb-px grid grid-cols-3">
                {(
                  [
                    ["photos", presence.photos.length, "Bilder"],
                    ["text", presence.text.length, "Tekstlige omtaler"],
                    ["activities", presence.activities.length, "Aktiviteter"],
                  ] as const
                ).map(([id, count, label]) => (
                  <button
                    key={id}
                    role="tab"
                    type="button"
                    aria-selected={tab === id}
                    aria-controls={`panel-${id}`}
                    onClick={() => setTab(id)}
                    className={cn(
                      "border-b-2 pt-1 pb-3 text-left transition-colors",
                      tab === id ? "border-ink" : "border-transparent text-ink-3 hover:text-ink",
                    )}
                  >
                    <span className="block text-[1.75rem] leading-none font-semibold tracking-[-0.02em] tnum md:text-[2.25rem]">{count}</span>
                    <span className="mt-1.5 block t-small">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {tab === "photos" && (
                <div id="panel-photos" role="tabpanel">
                  {presence.photos.length === 0 ? (
                    <p className="t-small text-ink-2">Ingen publiserte bilder er koblet til {person.firstName}.</p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="t-small text-ink-3">{preview ? "Slik blir bildene seende ut." : `${person.firstName} er markert i hvert bilde.`}</p>
                        <label className="inline-flex cursor-pointer items-center gap-2.5 t-small font-medium select-none">
                          <span>Forhåndsvis anonymisering</span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={preview}
                            onClick={() => setPreview((v) => !v)}
                            className={cn("relative h-5 w-9 rounded-full transition-colors", preview ? "bg-ink" : "bg-line-strong")}
                          >
                            <span className={cn("absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200", preview && "translate-x-4")} />
                          </button>
                        </label>
                      </div>
                      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {presence.photos.map((p) => (
                          <li key={p.photo.id}>
                            <button type="button" onClick={() => setInspect(p)} className="group block w-full text-left">
                              <Photo photo={preview ? withRedaction(p) : p.photo} ratio={1} sizes="200px" className="rounded-sm">
                                {!preview && p.region && (
                                  <span
                                    aria-hidden
                                    className="absolute rounded-xs border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
                                    style={{ left: `${p.region.x}%`, top: `${p.region.y}%`, width: `${p.region.w}%`, height: `${p.region.h}%` }}
                                  />
                                )}
                              </Photo>
                              <span className="mt-1.5 block truncate t-meta text-ink-2 group-hover:text-ink">{p.uses[0]?.label}</span>
                              {p.uses.length > 1 && <span className="block t-meta text-ink-3">og {plural(p.uses.length - 1, "sted", "steder")} til</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {tab === "text" && (
                <div id="panel-text" role="tabpanel">
                  {presence.text.length === 0 ? (
                    <p className="t-small text-ink-2">Ingen publisert tekst nevner {person.firstName}.</p>
                  ) : (
                    <ul className="space-y-5">
                      {presence.text.map((t) => (
                        <li key={t.key}>
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <a href={t.context.href} target="_blank" rel="noreferrer" className="t-label font-semibold hover:underline">
                              {t.context.label}
                            </a>
                            <span className="t-meta text-ink-3">{t.whereLabel}</span>
                          </div>
                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            <div className="rounded-md bg-sunken px-3 py-2.5">
                              <p className="t-meta text-ink-3">Publisert nå</p>
                              <p className="mt-1 t-small text-ink">
                                <Inlines content={t.before} highlight={person.id} />
                              </p>
                            </div>
                            <div className="rounded-md border border-line px-3 py-2.5">
                              <p className="t-meta text-ink-3">Etter anonymisering</p>
                              {t.after ? (
                                <p className="mt-1 t-small text-ink">
                                  <AfterText content={t.before} personId={person.id} />
                                </p>
                              ) : (
                                <p className="mt-1 t-small text-ink-3">{t.where === "quote" ? "Sitatet fjernes." : "Avsnittet fjernes."}</p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {tab === "activities" && (
                <div id="panel-activities" role="tabpanel">
                  {presence.activities.length === 0 ? (
                    <p className="t-small text-ink-2">{person.firstName} er ikke nevnt i noen aktiviteter.</p>
                  ) : (
                    <ul className="divide-y divide-line border-y border-line">
                      {presence.activities.map((a) => (
                        <li key={a.id} className="grid gap-x-6 gap-y-1 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                          <div>
                            <p className="t-label font-semibold">{a.title}</p>
                            <p className="t-small text-ink-3">
                              {a.when} · {a.role}
                            </p>
                          </div>
                          <div className="t-small">
                            <p className="text-ink-3 line-through decoration-ink-3/50">
                              {a.label}: {a.before}
                            </p>
                            <p className="text-ink">
                              {a.label}: {a.after || "fjernes"}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Irreversible action */}
          {!anonymised && (
            <section aria-labelledby="anonymiser" className="rounded-lg border border-danger/30 bg-surface">
              <div className="p-4 sm:p-5">
                <h2 id="anonymiser" className="t-h3 text-danger">
                  Anonymiser permanent
                </h2>
                <p className="mt-1.5 max-w-[62ch] t-small text-ink-2">
                  {person.name} fjernes fra alt publisert innhold. Navn erstattes med nøytrale formuleringer, sitater og avsnitt om{" "}
                  {person.firstName} slettes, og hen dekkes helt til i alle bilder.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="t-meta text-ink-3">Dette skjer</p>
                    <ul className="mt-1.5 space-y-1 t-small text-ink">
                      <li>{plural(presence.photos.length, "bilde", "bilder")} får personen dekket til</li>
                      <li>{plural(presence.text.length, "tekstlig omtale", "tekstlige omtaler")} skrives om eller fjernes</li>
                      <li>{plural(presence.activities.length, "aktivitet", "aktiviteter")} mister navnet</li>
                      <li>{person.firstName} kan ikke merkes i nye innlegg</li>
                    </ul>
                  </div>
                  <div>
                    <p className="t-meta text-ink-3">Dette skjer ikke</p>
                    <ul className="mt-1.5 space-y-1 t-small text-ink-2">
                      <li>Medlemskapet i {data.memberships.map((m) => m.path.split(" › ").at(-1)).join(", ")} beholdes</li>
                      <li>Foresatte beholder brukerkontoen sin</li>
                      <li>Kontingent og laglister påvirkes ikke</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-danger/20 bg-danger-surface/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="flex items-center gap-2 t-small font-medium text-danger">
                  <TriangleAlert aria-hidden className="size-4 shrink-0" />
                  Kan ikke angres. Originalversjonene slettes.
                </p>
                {data.canAnonymise ? (
                  <Button variant="danger" onClick={openConfirm} disabled={total === 0 && !data.request}>
                    Anonymiser permanent
                  </Button>
                ) : (
                  <p className="flex items-center gap-2 t-small text-ink-2">
                    <Lock aria-hidden className="size-4" /> Krever klubbadministrator. Du er {data.actorRole.toLowerCase()}.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Profile */}
        <aside className="space-y-6 lg:col-span-4">
          <section aria-labelledby="medlemskap" className="rounded-lg border border-line bg-surface">
            <h2 id="medlemskap" className="border-b border-line px-4 py-3 t-label font-semibold sm:px-5">
              Medlemskap
            </h2>
            <ul className="divide-y divide-line">
              {data.memberships.map((m) => (
                <li key={m.path} className="px-4 py-3 sm:px-5">
                  <p className="t-label">{m.role}</p>
                  <a href={m.href} target="_blank" rel="noreferrer" className="t-small text-ink-2 hover:text-ink hover:underline">
                    {m.path}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="konto" className="rounded-lg border border-line bg-surface">
            <h2 id="konto" className="border-b border-line px-4 py-3 t-label font-semibold sm:px-5">
              Person og brukere
            </h2>
            <div className="space-y-3 px-4 py-4 t-small sm:px-5">
              <p className="flex gap-2 text-ink-2">
                <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3" />
                {data.account.own
                  ? `${person.firstName} er både person i klubben og bruker som kan logge inn.`
                  : `${person.firstName} er registrert som person i klubben, men har ikke egen brukerkonto.`}
              </p>
              {data.account.own && (
                <p>
                  <span className="text-ink">{data.account.own.email}</span>
                  <span className="text-ink-3"> · {data.account.own.providers.map((p) => (p === "google" ? "Google" : "E-post")).join(", ")}</span>
                </p>
              )}
              {data.guardianship.guardians.length > 0 && (
                <p className="border-t border-line pt-3 text-ink-3">
                  {data.guardianship.guardians.length === 1 ? "Én foresatt" : `${data.guardianship.guardians.length} foresatte`} har brukerkonto. Se kortene
                  under.
                </p>
              )}
            </div>
          </section>

          <GuardianCards data={data.guardianship} />

          <section aria-labelledby="samtykke" className="rounded-lg border border-line bg-surface">
            <h2 id="samtykke" className="border-b border-line px-4 py-3 t-label font-semibold sm:px-5">
              Samtykke
            </h2>
            <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-y-2 px-4 py-4 t-small sm:px-5">
              <dt className="text-ink-3">Bilder</dt>
              <dd className={cn(person.consent === "unknown" && "text-warning")}>
                {person.consent === "granted" ? "Gitt" : person.consent === "declined" ? "Ikke gitt" : "Ikke registrert"}
              </dd>
              {person.consentBy && (
                <>
                  <dt className="text-ink-3">Registrert av</dt>
                  <dd>{person.consentBy}</dd>
                </>
              )}
              {person.consentAt && (
                <>
                  <dt className="text-ink-3">Dato</dt>
                  <dd>{person.consentAt}</dd>
                </>
              )}
            </dl>
          </section>
        </aside>
      </div>

      {/* Inspect one photo */}
      <Dialog
        open={!!inspect}
        onClose={() => setInspect(null)}
        size="lg"
        title="Før og etter"
        description={inspect ? `Brukt ${inspect.uses.length === 1 ? "ett sted" : `${inspect.uses.length} steder`} på nettsiden` : undefined}
      >
        {inspect && (
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <figure>
                <Photo photo={inspect.photo} sizes="360px">
                  {inspect.region && (
                    <span
                      aria-hidden
                      className="absolute rounded-xs border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
                      style={{ left: `${inspect.region.x}%`, top: `${inspect.region.y}%`, width: `${inspect.region.w}%`, height: `${inspect.region.h}%` }}
                    />
                  )}
                </Photo>
                <figcaption className="mt-2 t-meta text-ink-3">Publisert nå</figcaption>
              </figure>
              <figure>
                <Photo photo={withRedaction(inspect)} sizes="360px" />
                <figcaption className="mt-2 t-meta text-ink-3">
                  {inspect.region ? "Etter anonymisering" : "Uten markert område trekkes bildet tilbake"}
                </figcaption>
              </figure>
            </div>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {inspect.uses.map((u) => (
                <li key={u.href + u.label}>
                  <a href={u.href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 py-2.5 t-small hover:text-club">
                    <span className="truncate">{u.label}</span>
                    <ArrowUpRight aria-hidden className="size-3.5 shrink-0 text-ink-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Dialog>

      {/* Confirm → process → done */}
      <Dialog
        open={phase !== "closed"}
        onClose={phase === "processing" ? () => {} : phase === "done" ? close : () => setPhase("closed")}
        dismissible={phase !== "processing"}
        tone={phase === "confirm" ? "danger" : "default"}
        size="md"
        title={
          phase === "confirm"
            ? `Anonymiser ${person.name} permanent?`
            : phase === "processing"
              ? `Anonymiserer ${person.name}`
              : phase === "done"
                ? `${person.name} er anonymisert`
                : "Noe gikk galt"
        }
        description={
          phase === "confirm"
            ? "Dette kan ikke angres. Originalversjonene av tekst og bilder slettes."
            : phase === "processing"
              ? "Ikke lukk vinduet."
              : undefined
        }
        footer={
          phase === "confirm" ? (
            <>
              <Button variant="secondary" onClick={() => setPhase("closed")}>
                Avbryt
              </Button>
              <Button variant="danger" disabled={!confirmMatches} onClick={run}>
                Anonymiser permanent
              </Button>
            </>
          ) : phase === "done" || phase === "error" ? (
            <Button onClick={close}>Lukk</Button>
          ) : undefined
        }
      >
        {phase === "confirm" && snapshot && (
          <div className="space-y-5">
            <dl className="grid grid-cols-3 divide-x divide-line rounded-md border border-line">
              {(
                [
                  [snapshot.photos.length, "bilder"],
                  [snapshot.text.length, "omtaler"],
                  [snapshot.activities.length, "aktiviteter"],
                ] as const
              ).map(([n, label]) => (
                <div key={label} className="px-3 py-3 text-center">
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-2xl leading-none font-semibold tnum">{n}</dd>
                  <dd className="mt-1 t-meta text-ink-3">{label}</dd>
                </div>
              ))}
            </dl>
            <p className="t-small text-ink-2">
              Nettsiden oppdateres med én gang. {person.firstName} vil ikke lenger kunne kjennes igjen i tekst eller bilder, og kan ikke merkes i nye innlegg.
            </p>
            <Field label={`Skriv «${person.name}» for å bekrefte`} htmlFor="confirm-name">
              <Input id="confirm-name" autoComplete="off" data-autofocus value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={person.name} />
            </Field>
          </div>
        )}

        {phase === "processing" && (
          <ol className="space-y-5" aria-live="polite">
            {steps.map((s, i) => {
              const state = i < step ? "done" : i === step ? "active" : "todo";
              return (
                <li key={s.label} className="flex gap-3.5">
                  <span
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                      state === "done" && "bg-success text-white",
                      state === "active" && "border-2 border-ink/15 border-t-ink anim-spin",
                      state === "todo" && "border border-line-strong",
                    )}
                  >
                    {state === "done" && <Check aria-hidden className="size-3" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("t-label", state === "todo" ? "text-ink-3" : "text-ink")}>{s.label}</p>
                    {state !== "todo" && <p className="t-small text-ink-3 tnum">{s.detail}</p>}
                    {i === 1 && state !== "todo" && snap.photos.length > 0 && (
                      <ul className="mt-2.5 grid grid-cols-6 gap-1.5 sm:grid-cols-9">
                        {snap.photos.map((p, idx) => (
                          <li key={p.photo.id}>
                            <Photo photo={idx < progress.photos ? withRedaction(p) : p.photo} ratio={1} sizes="48px" className="rounded-xs" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {phase === "done" && result && (
          <div>
            <div className="flex items-start gap-3 rounded-md bg-success-surface px-4 py-3">
              <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
              <p className="t-small text-ink">
                {plural(result.photos, "bilde", "bilder")}, {plural(result.text, "tekstlig omtale", "tekstlige omtaler")} og{" "}
                {plural(result.activities, "aktivitet", "aktiviteter")} er endret og publisert. Ingen sider viser lenger navn eller bilder der{" "}
                {person.firstName} kan kjennes igjen.
              </p>
            </div>
            {result.articles.length > 0 && (
              <>
                <p className="mt-5 t-meta text-ink-3">Se endret innhold på nettsiden</p>
                <ul className="mt-1.5 divide-y divide-line border-y border-line">
                  {result.articles.map((a) => (
                    <li key={a.href}>
                      <a href={a.href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 py-2.5 t-small hover:text-club">
                        <span className="truncate">{a.title}</span>
                        <ArrowUpRight aria-hidden className="size-3.5 shrink-0 text-ink-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-4 t-small text-ink-3">Handlingen er logget uten navn.</p>
          </div>
        )}

        {phase === "error" && (
          <p className="flex items-start gap-2 t-small text-danger">
            <X aria-hidden className="mt-0.5 size-4" />
            {error}
          </p>
        )}
      </Dialog>
    </>
  );
}
