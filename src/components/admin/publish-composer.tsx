"use client";

import { Check, ChevronDown, ImagePlus, Link2, Lock, Plus, Search, ShieldCheck, ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { publishPost, type PublishResult } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button, buttonClass } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import type { PublishMode } from "@/lib/permissions";
import type { PrivacyStatus } from "@/lib/types";

export interface ComposerTarget {
  id: string;
  name: string;
  trail: string;
  kicker: string;
  depth: number;
  mode: PublishMode;
  rollup: string[];
  approvers: string[];
}

export interface ComposerPerson {
  id: string;
  name: string;
  firstName: string;
  role: string;
  nodeIds: string[];
  status: PrivacyStatus;
  consent: "granted" | "declined" | "unknown";
  athlete: boolean;
}

interface DraftPhoto {
  key: string;
  src: string;
  width: number;
  height: number;
}

const DRAFT_KEY = "klubbnettside:utkast";

/** Demo photos, for trying the flow on a computer without club photos at hand. */
const SAMPLE_PHOTOS: Omit<DraftPhoto, "key">[] = [
  { src: "https://images.unsplash.com/photo-1526838890080-053700ebe3d2", width: 3186, height: 2741 },
  { src: "https://images.unsplash.com/photo-1569242185997-c9899faae8ce", width: 6000, height: 4000 },
];

const uid = () => Math.random().toString(36).slice(2, 10);
const thumb = (src: string, w = 360) => (src.startsWith("data:") ? src : `${src}?w=${w}&q=70&auto=format`);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Phone photos are resized before upload — the same thing production would do. */
async function downscale(file: File): Promise<DraftPhoto> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return { key: uid(), src: canvas.toDataURL("image/jpeg", 0.82), width, height };
}

function namesIn(text: string, people: ComposerPerson[]) {
  return people.filter((p) =>
    new RegExp(`(?<![\\p{L}])(${escapeRe(p.name)}|${escapeRe(p.firstName)})(?![\\p{L}])`, "u").test(text),
  );
}

const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} og ${names.at(-1)}` : names[0] ?? "");

/**
 * Mobile-first composer. The whole job fits on one screen: where it goes,
 * a headline, a few sentences, photos, who is in them. No CMS vocabulary.
 */
export function PublishComposer({
  targets,
  people,
  initialTargetId,
  initialText,
  authorName,
}: {
  targets: ComposerTarget[];
  people: ComposerPerson[];
  initialTargetId: string;
  initialText?: string;
  authorName: string;
}) {
  const [targetId, setTargetId] = useState(initialTargetId);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(initialText ?? "");
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [caption, setCaption] = useState("");
  const [tagged, setTagged] = useState<Set<string>>(new Set());
  const [unlinked, setUnlinked] = useState<Set<string>>(new Set());
  const [requestHomepage, setRequestHomepage] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [targetQuery, setTargetQuery] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rosterQuery, setRosterQuery] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Extract<PublishResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();
  const restored = useRef(false);

  // Keep an unsent draft on this device.
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (initialText) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as { targetId?: string; title?: string; body?: string };
      if (d.title) setTitle(d.title);
      if (d.body) setBody(d.body);
      if (d.targetId && targets.some((t) => t.id === d.targetId)) setTargetId(d.targetId);
    } catch {
      /* storage unavailable */
    }
  }, [initialText, targets]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        if (title || body) localStorage.setItem(DRAFT_KEY, JSON.stringify({ targetId, title, body }));
      } catch {
        /* storage unavailable */
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [targetId, title, body]);

  const target = targets.find((t) => t.id === targetId) ?? targets[0];
  const roster = useMemo(() => people.filter((p) => p.nodeIds.includes(target.id)), [people, target.id]);
  const detected = useMemo(() => namesIn(`${title}\n${body}\n${caption}`, roster), [title, body, caption, roster]);
  const linked = detected.filter((p) => p.status === "visible" && !unlinked.has(p.id));
  const blockedNames = detected.filter((p) => p.status !== "visible");
  const taggedPeople = roster.filter((p) => tagged.has(p.id));
  const missingConsent = taggedPeople.filter((p) => p.consent !== "granted");
  const rosterVisible = roster.filter((p) => !rosterQuery || p.name.toLocaleLowerCase("nb").includes(rosterQuery.toLocaleLowerCase("nb")));

  const canSubmit = title.trim().length > 0 && (body.trim().length > 0 || photos.length > 0) && blockedNames.length === 0 && !photoBusy;
  const direct = target.mode === "direct";
  const actionLabel = direct ? "Publiser" : "Send til godkjenning";
  const modeHint = direct
    ? `Publiseres direkte på ${target.name}`
    : `${target.approvers[0] ?? "En administrator"} godkjenner før publisering`;

  const chooseTarget = (id: string) => {
    setTargetId(id);
    setTargetOpen(false);
    setTargetQuery("");
    const nextRoster = new Set(people.filter((p) => p.nodeIds.includes(id)).map((p) => p.id));
    setTagged((prev) => new Set([...prev].filter((pid) => nextRoster.has(pid))));
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setPhotoError("");
    setPhotoBusy(true);
    const added: DraftPhoto[] = [];
    for (const file of Array.from(files).slice(0, 12 - photos.length)) {
      try {
        added.push(await downscale(file));
      } catch {
        setPhotoError(`Kunne ikke lese ${file.name}. Prøv et JPG- eller PNG-bilde.`);
      }
    }
    setPhotos((p) => [...p, ...added]);
    setPhotoBusy(false);
  };

  const toggleTag = (id: string) =>
    setTagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () => {
    if (!canSubmit || pending) return;
    setError("");
    startTransition(async () => {
      const res = await publishPost({
        nodeId: target.id,
        title,
        body,
        photos: photos.map((p, i) => ({ src: p.src, width: p.width, height: p.height, caption: i === 0 ? caption : undefined })),
        taggedPersonIds: [...tagged],
        linkedPersonIds: linked.map((p) => p.id),
        requestHomepage,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* storage unavailable */
      }
      announceChange();
      setPreviewOpen(false);
      setResult(res);
    });
  };

  const startOver = () => {
    setResult(null);
    setTitle("");
    setBody("");
    setPhotos([]);
    setCaption("");
    setTagged(new Set());
    setUnlinked(new Set());
    setRequestHomepage(false);
  };

  /* ── Done ───────────────────────────────────────────────────────────── */
  if (result) {
    const published = result.status === "published";
    return (
      <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-surface text-success anim-pop">
          <Check aria-hidden className="size-7" strokeWidth={2.5} />
        </span>
        <h1 className="mt-5 text-[1.5rem] leading-tight font-semibold tracking-[-0.02em]">
          {published ? `Publisert på ${result.nodeName}` : "Sendt til godkjenning"}
        </h1>
        <p className="mt-2 t-small text-ink-2">
          {published
            ? `Innlegget vises nå på ${result.nodeName}${target.rollup.length ? `, og på sidene for ${list(target.rollup)}` : ""}.`
            : `${target.approvers[0] ?? "En administrator"} får beskjed og godkjenner innlegget før det blir synlig.`}
        </p>
        <div className="mt-8 grid w-full gap-2">
          {published && (
            <a href={result.href} target="_blank" rel="noreferrer" className={buttonClass({ size: "lg", block: true })}>
              Se innlegget
            </a>
          )}
          <Button variant="secondary" size="lg" block onClick={startOver}>
            Skriv et nytt innlegg
          </Button>
          <Link href="/admin" className={buttonClass({ variant: "ghost", block: true })}>
            Til oversikten
          </Link>
        </div>
      </div>
    );
  }

  const preview = <PostPreview title={title} body={body} photos={photos} caption={caption} kicker={target.kicker} authorName={authorName} />;

  return (
    <div className="min-h-dvh bg-surface md:min-h-0 md:bg-transparent">
      {/* Phone top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-1.5 md:hidden">
        <Link href="/admin" className="inline-flex h-10 items-center gap-1.5 rounded-md px-2.5 t-label text-ink-2">
          <X aria-hidden className="size-5" /> Avbryt
        </Link>
        <span className="t-label font-semibold">Nytt innlegg</span>
        <button type="button" onClick={() => setPreviewOpen(true)} className="h-10 rounded-md px-2.5 t-label text-ink">
          Forhåndsvis
        </button>
      </div>

      <div className="page md:pt-8 md:pb-16">
        <div className="mx-auto max-w-[1160px] gap-10 lg:grid lg:grid-cols-[minmax(0,620px)_minmax(0,1fr)]">
          <div className="-mx-[var(--page-gutter)] md:mx-0">
            <div className="hidden pb-5 md:block">
              <h1 className="text-[1.875rem] leading-tight font-semibold tracking-[-0.02em]">Nytt innlegg</h1>
              <p className="mt-1 t-small text-ink-2">Overskrift, noen setninger og gjerne et bilde. Resten ordner seg.</p>
            </div>

            <form
              id="composer"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="bg-surface pb-36 md:rounded-lg md:border md:border-line md:pb-0"
            >
              {/* Where */}
              <button
                type="button"
                onClick={() => setTargetOpen(true)}
                className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors hover:bg-sunken/50 sm:px-5"
              >
                <span className="w-7 t-small text-ink-3">Til</span>
                <span className="min-w-0 flex-1">
                  <span className="block t-label font-semibold text-ink">{target.name}</span>
                  <span className="block truncate t-small text-ink-3">{target.trail || "Vises på forsiden"}</span>
                </span>
                <span className="t-small text-ink-3">Endre</span>
                <ChevronDown aria-hidden className="size-4 text-ink-3" />
              </button>

              {/* Words */}
              <div className="px-4 pt-5 sm:px-5">
                <label htmlFor="c-title" className="sr-only">
                  Overskrift
                </label>
                <textarea
                  id="c-title"
                  rows={1}
                  value={title}
                  onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
                  placeholder="Overskrift"
                  className="block w-full resize-none bg-transparent font-display text-[1.625rem] leading-[1.15] font-semibold tracking-[-0.02em] [field-sizing:content] placeholder:text-ink-3/70 focus:outline-none"
                />
                <label htmlFor="c-body" className="sr-only">
                  Tekst
                </label>
                <textarea
                  id="c-body"
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Hva skjedde? Noen setninger holder."
                  className="mt-3 block min-h-32 w-full resize-none bg-transparent text-[17px] leading-relaxed [field-sizing:content] placeholder:text-ink-3 focus:outline-none"
                />
              </div>

              {detected.length > 0 && (
                <div className="px-4 pb-4 sm:px-5" aria-live="polite">
                  <p className="t-meta text-ink-3">Navn i teksten</p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {detected.map((p) => {
                      const blocked = p.status !== "visible";
                      const isLinked = !blocked && !unlinked.has(p.id);
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            disabled={blocked}
                            aria-pressed={isLinked}
                            onClick={() =>
                              setUnlinked((prev) => {
                                const next = new Set(prev);
                                if (next.has(p.id)) next.delete(p.id);
                                else next.add(p.id);
                                return next;
                              })
                            }
                            className={cn(
                              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 t-small transition-colors",
                              blocked && "border-danger/30 bg-danger-surface text-danger",
                              !blocked && isLinked && "border-line-strong bg-surface text-ink",
                              !blocked && !isLinked && "border-dashed border-line-strong text-ink-3",
                            )}
                          >
                            {blocked ? <Lock aria-hidden className="size-3.5" /> : <Link2 aria-hidden className="size-3.5" />}
                            {p.name}
                            <span className="text-ink-3">{blocked ? "· kan ikke nevnes" : isLinked ? "· koblet" : "· ikke koblet"}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Photos */}
              <div className="border-t border-line px-4 py-4 sm:px-5">
                {photos.length === 0 ? (
                  <>
                    <label className="flex cursor-pointer items-center gap-4 rounded-md bg-sunken px-4 py-4 transition-colors focus-within:ring-2 focus-within:ring-focus hover:bg-line/70">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink ring-1 ring-line">
                        <ImagePlus aria-hidden className="size-5" />
                      </span>
                      <span>
                        <span className="block t-label font-semibold">{photoBusy ? "Klargjør bilder …" : "Legg til bilder"}</span>
                        <span className="block t-small text-ink-3">Fra kamera eller bildebibliotek</span>
                      </span>
                      <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setPhotos(SAMPLE_PHOTOS.map((p) => ({ ...p, key: uid() })))}
                      className="mt-2.5 t-small text-ink-3 underline decoration-line-strong underline-offset-4 hover:text-ink"
                    >
                      Prøv med eksempelbilder
                    </button>
                  </>
                ) : (
                  <>
                    <ul className="grid grid-cols-3 gap-2">
                      {photos.map((p, i) => (
                        <li key={p.key} className="relative anim-fade">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={thumb(p.src)} alt={`Bilde ${i + 1}`} className="aspect-square w-full rounded-sm bg-sunken object-cover" />
                          {i === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 rounded-xs bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                              Hovedbilde
                            </span>
                          )}
                          <button
                            type="button"
                            aria-label={`Fjern bilde ${i + 1}`}
                            onClick={() => setPhotos((all) => all.filter((x) => x.key !== p.key))}
                            className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/65 text-white transition-colors hover:bg-black/80"
                          >
                            <X aria-hidden className="size-4" />
                          </button>
                        </li>
                      ))}
                      {photos.length < 12 && (
                        <li>
                          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-sm bg-sunken t-small text-ink-2 transition-colors focus-within:ring-2 focus-within:ring-focus hover:bg-line/70">
                            <Plus aria-hidden className="size-5" />
                            {photoBusy ? "Klargjør …" : "Flere"}
                            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
                          </label>
                        </li>
                      )}
                    </ul>
                    <label htmlFor="c-caption" className="sr-only">
                      Bildetekst til hovedbildet
                    </label>
                    <input
                      id="c-caption"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Bildetekst til hovedbildet (valgfritt)"
                      className="mt-3 w-full border-b border-line bg-transparent py-2 text-[15px] placeholder:text-ink-3 focus:border-ink focus:outline-none sm:text-sm"
                    />
                  </>
                )}
                {photoError && (
                  <p role="alert" className="mt-2 t-small text-danger">
                    {photoError}
                  </p>
                )}
              </div>

              {/* People in photos */}
              {photos.length > 0 && roster.length > 0 && (
                <fieldset className="border-t border-line px-4 py-4 sm:px-5">
                  <legend className="sr-only">Hvem er med på bildene?</legend>
                  <p aria-hidden className="t-label font-semibold">
                    Hvem er med på bildene?
                  </p>
                  <p className="t-small text-ink-3">Merking gjør at klubben kan fjerne en person fra bildene senere.</p>
                  {roster.length > 14 && (
                    <div className="relative mt-3">
                      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
                      <label htmlFor="c-roster" className="sr-only">
                        Søk etter person
                      </label>
                      <input
                        id="c-roster"
                        type="search"
                        value={rosterQuery}
                        onChange={(e) => setRosterQuery(e.target.value)}
                        placeholder={`Søk blant ${roster.length} personer`}
                        className="h-10 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[15px] focus:border-focus focus:ring-[3px] focus:ring-focus/20 focus:outline-none sm:text-sm"
                      />
                    </div>
                  )}
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {rosterVisible.slice(0, 40).map((p) => {
                      const blocked = p.status !== "visible";
                      const on = tagged.has(p.id);
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            aria-pressed={on}
                            disabled={blocked}
                            onClick={() => toggleTag(p.id)}
                            title={blocked ? (p.status === "anonymised" ? "Anonymisert" : "Skal ikke publiseres") : p.role}
                            className={cn(
                              "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 t-small transition-colors duration-150",
                              blocked && "cursor-not-allowed border-line text-ink-3",
                              !blocked && on && "border-inverse bg-inverse text-ink-inverse",
                              !blocked && !on && "border-line-strong bg-surface text-ink hover:border-ink-3",
                            )}
                          >
                            {blocked ? <Lock aria-hidden className="size-3.5" /> : on ? <Check aria-hidden className="size-3.5" /> : null}
                            {p.name}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {roster.some((p) => p.status !== "visible") && (
                    <p className="mt-2.5 flex gap-1.5 t-small text-ink-3">
                      <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                      Låste personer kan ikke merkes eller vises offentlig.
                    </p>
                  )}
                </fieldset>
              )}

              {/* Options */}
              <div className="border-t border-line px-4 py-4 sm:px-5">
                <Checkbox
                  label="Foreslå for klubbens forside"
                  description="En klubbadministrator bestemmer hva som vises på forsiden."
                  checked={requestHomepage}
                  onChange={(e) => setRequestHomepage(e.target.checked)}
                />
              </div>

              {/* Privacy check */}
              {(taggedPeople.length > 0 || linked.length > 0 || blockedNames.length > 0) && (
                <div
                  aria-live="polite"
                  className={cn(
                    "mx-4 mb-4 flex gap-2.5 rounded-md px-3.5 py-3 t-small sm:mx-5",
                    blockedNames.length ? "bg-danger-surface text-ink" : missingConsent.length ? "bg-warning-surface text-ink" : "bg-success-surface text-ink",
                  )}
                >
                  {blockedNames.length ? (
                    <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
                  ) : (
                    <ShieldCheck aria-hidden className={cn("mt-0.5 size-4 shrink-0", missingConsent.length ? "text-warning" : "text-success")} />
                  )}
                  <p>
                    <span className="font-semibold">Personvern: </span>
                    {blockedNames.length
                      ? `${list(blockedNames.map((p) => p.name))} kan ikke nevnes offentlig. Fjern navnet fra teksten før du publiserer.`
                      : missingConsent.length
                        ? `${list(missingConsent.map((p) => p.name))} mangler registrert fotosamtykke. Du kan publisere, men laglederen får en påminnelse.`
                        : [
                            taggedPeople.length ? `${taggedPeople.length === 1 ? "1 person" : `${taggedPeople.length} personer`} merket, alle med samtykke til bilder.` : "",
                            linked.length ? `${list(linked.map((p) => p.firstName))} er koblet til teksten og kan fjernes automatisk senere.` : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                  </p>
                </div>
              )}

              {error && (
                <p role="alert" className="mx-4 mb-4 rounded-md bg-danger-surface px-3.5 py-3 t-small text-danger sm:mx-5">
                  {error}
                </p>
              )}

              <div className="hidden items-center justify-between gap-4 border-t border-line px-5 py-4 md:flex">
                <p className="truncate t-small text-ink-3">{modeHint}</p>
                <div className="flex shrink-0 gap-2">
                  <Button variant="secondary" onClick={() => setPreviewOpen(true)} className="lg:hidden">
                    Forhåndsvis
                  </Button>
                  <Button type="submit" disabled={!canSubmit || pending}>
                    {pending ? "Publiserer …" : actionLabel}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Live preview (desktop) */}
          <aside aria-label="Forhåndsvisning" className="hidden lg:block">
            <div className="sticky top-[5.5rem] pt-[4.6rem]">
              <p className="t-meta text-ink-3">Slik ser det ut på nettsiden</p>
              <div className="mt-3 max-h-[calc(100dvh-10rem)] overflow-y-auto rounded-lg border border-line bg-bg p-6">{preview}</div>
              {target.rollup.length > 0 && <p className="mt-3 t-small text-ink-3">Vises på {target.name} og på sidene for {list(target.rollup)}.</p>}
            </div>
          </aside>
        </div>
      </div>

      {/* Phone action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <p className="mb-2 truncate text-center t-meta text-ink-3">{modeHint}</p>
        <Button form="composer" type="submit" size="lg" block disabled={!canSubmit || pending}>
          {pending ? "Publiserer …" : actionLabel}
        </Button>
      </div>

      <Dialog
        open={targetOpen}
        onClose={() => setTargetOpen(false)}
        title="Hvor skal innlegget vises?"
        description="Innlegget vises på siden du velger, og på sidene over i klubbens struktur."
      >
        {targets.length > 10 && (
          <div className="relative mb-3">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
            <label htmlFor="c-target-search" className="sr-only">
              Søk etter lag eller gruppe
            </label>
            <input
              id="c-target-search"
              type="search"
              data-autofocus
              value={targetQuery}
              onChange={(e) => setTargetQuery(e.target.value)}
              placeholder="Søk etter lag eller gruppe"
              className="h-10 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-[15px] focus:border-focus focus:ring-[3px] focus:ring-focus/20 focus:outline-none sm:text-sm"
            />
          </div>
        )}
        <ul className="-mx-2">
          {targets
            .filter((t) => !targetQuery || `${t.name} ${t.trail}`.toLocaleLowerCase("nb").includes(targetQuery.toLocaleLowerCase("nb")))
            .map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => chooseTarget(t.id)}
                  aria-current={t.id === target.id}
                  style={{ paddingLeft: `${0.5 + (targetQuery ? 0 : Math.max(0, t.depth - 1)) * 0.9}rem` }}
                  className={cn("flex w-full items-center gap-3 rounded-md py-2.5 pr-2 text-left transition-colors hover:bg-sunken", t.id === target.id && "bg-sunken")}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block t-label">{t.name}</span>
                    <span className="block truncate t-small text-ink-3">
                      {t.trail ? `${t.trail} · ` : ""}
                      {t.mode === "direct" ? "Publiseres direkte" : "Krever godkjenning"}
                    </span>
                  </span>
                  {t.id === target.id && <Check aria-hidden className="size-4" />}
                </button>
              </li>
            ))}
        </ul>
      </Dialog>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        size="lg"
        title="Forhåndsvisning"
        description={`Slik vises innlegget på ${target.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              Fortsett å skrive
            </Button>
            <Button onClick={submit} disabled={!canSubmit || pending}>
              {pending ? "Publiserer …" : actionLabel}
            </Button>
          </>
        }
      >
        <div className="rounded-md bg-bg p-4 sm:p-6">{preview}</div>
      </Dialog>
    </div>
  );
}

function PostPreview({
  title,
  body,
  photos,
  caption,
  kicker,
  authorName,
}: {
  title: string;
  body: string;
  photos: DraftPhoto[];
  caption: string;
  kicker: string;
  authorName: string;
}) {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <article>
      <p className="t-meta font-semibold text-club">{kicker}</p>
      <h2 className="mt-1.5 font-display text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.02em] text-balance break-words">
        {title || <span className="text-ink-3">Overskrift</span>}
      </h2>
      <p className="mt-2 t-meta text-ink-3">{authorName} · akkurat nå</p>
      {photos[0] && (
        <figure className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb(photos[0].src, 900)} alt="" className="aspect-[3/2] w-full bg-sunken object-cover" />
          {caption && <figcaption className="mt-2 t-small text-ink-3">{caption}</figcaption>}
        </figure>
      )}
      <div className="mt-4 space-y-3">
        {paragraphs.length ? (
          paragraphs.map((p, i) => (
            <p key={i} className="text-[16px] leading-relaxed break-words">
              {p}
            </p>
          ))
        ) : (
          <p className="text-[16px] text-ink-3">Teksten vises her.</p>
        )}
      </div>
      {photos.length > 1 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {photos.slice(1).map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p.key} src={thumb(p.src, 500)} alt="" className="aspect-[4/3] w-full bg-sunken object-cover" />
          ))}
        </div>
      )}
    </article>
  );
}
