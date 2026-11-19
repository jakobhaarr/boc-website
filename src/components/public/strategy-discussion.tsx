"use client";

import { Check, Link2, MessageSquare, MessageSquarePlus } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { loadStrategyComments, postStrategyComment } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import type { StrategyComment } from "@/lib/strategy-comments";

/**
 * The comment threads on /strategi/2027-2030. The document itself is rendered on the server; this provider holds the
 * comments, the chosen name and which threads are open, and each <Thread> sits right under the point it discusses.
 *
 * The name is a signature picked from five (kept in this browser's localStorage under NAME_KEY), asked for the first time
 * someone starts to write. Drafts live in each composer's own state, so changing the name never loses them.
 */

const NAME_KEY = "boc-strategi-navn";
const BODY_MAX = 4000;
const REFRESH_MS = 60_000;

interface Ctx {
  comments: StrategyComment[];
  names: readonly string[];
  name: string | null;
  setName: (name: string) => void;
  open: Set<string>;
  toggle: (id: string, value?: boolean) => void;
  publish: (input: { id: string; pointId: string; parentId?: string; body: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const StrategyCtx = createContext<Ctx | null>(null);
const useStrategy = () => {
  const ctx = useContext(StrategyCtx);
  if (!ctx) throw new Error("Thread must be inside StrategyDiscussion");
  return ctx;
};

/** A v4 UUID, also where crypto.randomUUID is missing (a phone opening the dev server over plain http). */
function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const MONTHS = ["jan.", "feb.", "mars", "april", "mai", "juni", "juli", "aug.", "sep.", "okt.", "nov.", "des."];
/** «19. nov. 2026 kl. 14.32» in Norwegian time, built from numbers only so the server and the browser write the same. */
function formatWhen(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${Number(parts.day)}. ${MONTHS[Number(parts.month) - 1]} ${parts.year} kl. ${parts.hour}.${parts.minute}`;
}

export const countLabel = (n: number) => (n === 1 ? "1 kommentar" : `${n} kommentarer`);

export function StrategyDiscussion({
  initial,
  names,
  pointIds,
  formerIds,
  loadFailed,
  children,
}: {
  initial: StrategyComment[];
  names: readonly string[];
  pointIds: string[];
  /** Old id → current id, so a link shared before an id changed still opens the right point. */
  formerIds: Record<string, string>;
  loadFailed: boolean;
  children: ReactNode;
}) {
  const [comments, setComments] = useState(initial);
  const [name, setNameState] = useState<string | null>(null);
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  // The name chosen earlier in this browser (after mount: the server cannot know it).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      // Read after mount on purpose: the server has no localStorage, so the first render must be the same as the server's.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved && names.includes(saved)) setNameState(saved);
    } catch {}
  }, [names]);

  const setName = useCallback((n: string) => {
    setNameState(n);
    try {
      localStorage.setItem(NAME_KEY, n);
    } catch {}
  }, []);

  const toggle = useCallback((id: string, value?: boolean) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (value ?? !next.has(id)) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // A direct link (#kommunikasjon-sesonginformasjon) opens that point's thread.
  useEffect(() => {
    const go = () => {
      const raw = decodeURIComponent(location.hash.slice(1));
      const id = formerIds[raw] ?? raw;
      if (!pointIds.includes(id)) return;
      if (id !== raw) history.replaceState(null, "", `#${id}`);
      toggle(id, true);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [formerIds, pointIds, toggle]);

  // What others wrote while the page was open: when the page comes back into view, and every minute while it is shown.
  useEffect(() => {
    let busy = false;
    const refresh = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const latest = await loadStrategyComments();
        if (latest) setComments(latest);
      } catch {
        // Offline for a moment: keep what is shown.
      } finally {
        busy = false;
      }
    };
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, []);

  const publish = useCallback<Ctx["publish"]>(
    async ({ id, pointId, parentId, body }) => {
      if (!name) return { ok: false, error: "Velg hvem du kommenterer som." };
      try {
        const res = await postStrategyComment({ id, pointId, parentId: parentId ?? null, author: name, body });
        if (!res.ok) return res;
        setComments(res.comments.some((c) => c.id === res.comment.id) ? res.comments : [...res.comments, res.comment]);
        return { ok: true };
      } catch {
        return { ok: false, error: "Fikk ikke kontakt med nettsiden. Teksten din er tatt vare på, prøv igjen." };
      }
    },
    [name],
  );

  const value = useMemo(() => ({ comments, names, name, setName, open, toggle, publish }), [comments, names, name, setName, open, toggle, publish]);

  return (
    <StrategyCtx.Provider value={value}>
      {loadFailed && (
        <p role="alert" className="page mt-4 rounded-md bg-warning-surface px-4 py-3 t-small text-warning">
          Kommentarene kunne ikke hentes akkurat nå. Last inn siden på nytt om litt.
        </p>
      )}
      {children}
    </StrategyCtx.Provider>
  );
}

/** The number of posts (comments and replies) on a point, for the contents list. */
export function ThreadCount({ pointId, ids }: { pointId?: string; ids?: string[] }) {
  const { comments } = useStrategy();
  const n = comments.filter((c) => (ids ? ids.includes(c.pointId) : c.pointId === pointId)).length;
  if (!n) return null;
  return (
    <span className="ml-auto shrink-0 pl-2 t-meta text-ink-3 tnum" aria-label={countLabel(n)}>
      {n}
    </span>
  );
}

/**
 * The thread under one point. Closed it is one discreet button («Kommenter», or «2 kommentarer»); open it shows the posts,
 * replies under the comment they answer, a link to this point and a box to write in.
 */
export function Thread({ pointId, label, className }: { pointId: string; label: string; className?: string }) {
  const { comments, open, toggle } = useStrategy();
  const isOpen = open.has(pointId);
  const panelId = useId();
  const posts = comments.filter((c) => c.pointId === pointId);
  const top = posts.filter((c) => !c.parentId).sort(byTime);
  const repliesTo = (id: string) => posts.filter((c) => c.parentId === id).sort(byTime);
  const [writing, setWriting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const onToggle = () => {
    if (!isOpen && top.length === 0) setWriting(true);
    toggle(pointId);
  };

  return (
    <div className={cn("mt-2", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`${posts.length ? countLabel(posts.length) : "Kommenter"}: ${label}`}
        className={cn(
          "-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 t-small font-medium transition-colors",
          posts.length ? "text-club hover:text-club-hover" : "text-ink-3 hover:text-ink",
          isOpen && "text-ink",
        )}
      >
        {posts.length ? <MessageSquare aria-hidden className="size-4" /> : <MessageSquarePlus aria-hidden className="size-4" />}
        {posts.length ? countLabel(posts.length) : "Kommenter"}
        {isOpen && <span className="sr-only"> (åpen)</span>}
      </button>

      <div id={panelId} hidden={!isOpen}>
        {isOpen && (
          <div className="mt-2 rounded-lg bg-sunken p-4 ring-1 ring-line sm:p-5">
            {top.length > 0 && (
              <ol className="grid gap-5" aria-label={`Kommentarer: ${label}`}>
                {top.map((c) => (
                  <li key={c.id}>
                    <Post comment={c} />
                    {(repliesTo(c.id).length > 0 || replyTo === c.id) && (
                      <ol className="mt-3 grid gap-4 border-l-2 border-line-strong pl-4" aria-label={`Svar til ${c.author}`}>
                        {repliesTo(c.id).map((r) => (
                          <li key={r.id}>
                            <Post comment={r} />
                          </li>
                        ))}
                        {replyTo === c.id && (
                          <li>
                            <Composer
                              pointId={pointId}
                              parentId={c.id}
                              label={`Svar til ${c.author}`}
                              submitLabel="Publiser svar"
                              onCancel={() => setReplyTo(null)}
                              onDone={() => {
                                setReplyTo(null);
                                setAnnounce("Svaret er publisert.");
                              }}
                            />
                          </li>
                        )}
                      </ol>
                    )}
                    {replyTo !== c.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(c.id);
                          setWriting(false);
                        }}
                        className="mt-1 -ml-2 inline-flex min-h-11 items-center rounded-md px-2 t-small font-medium text-club hover:text-club-hover"
                        aria-label={`Svar ${c.author}`}
                      >
                        Svar
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            )}

            <div className={cn(top.length > 0 && "mt-5 border-t border-line pt-5")}>
              {writing ? (
                <Composer
                  pointId={pointId}
                  label={top.length ? "Ny kommentar" : "Skriv en kommentar"}
                  submitLabel="Publiser kommentar"
                  onCancel={() => {
                    setWriting(false);
                    if (!top.length) toggle(pointId, false);
                  }}
                  onDone={() => {
                    setWriting(false);
                    setAnnounce("Kommentaren er publisert.");
                  }}
                />
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setWriting(true);
                    setReplyTo(null);
                  }}
                >
                  <MessageSquarePlus aria-hidden />
                  Skriv en kommentar
                </Button>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-1 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
              <CopyLink pointId={pointId} />
              <button
                type="button"
                onClick={() => {
                  toggle(pointId, false);
                  setWriting(false);
                  setReplyTo(null);
                }}
                className="-ml-2 inline-flex min-h-11 items-center rounded-md px-2 t-small font-medium text-ink-3 hover:text-ink sm:ml-0"
              >
                Lukk tråden
              </button>
            </div>
            <p aria-live="polite" className="sr-only">
              {announce}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const byTime = (a: StrategyComment, b: StrategyComment) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

function Post({ comment }: { comment: StrategyComment }) {
  return (
    <article>
      <p className="flex flex-wrap items-baseline gap-x-2 t-small">
        <span className="font-semibold text-ink">{comment.author}</span>
        <time dateTime={comment.createdAt} className="t-meta text-ink-3">
          {formatWhen(comment.createdAt)}
        </time>
      </p>
      {/* Plain text: React escapes it, and line breaks are kept. */}
      <p className="mt-1 t-body break-words whitespace-pre-line text-ink">{comment.body}</p>
    </article>
  );
}

function CopyLink({ pointId }: { pointId: string }) {
  const [state, setState] = useState<"idle" | "copied" | "manual">("idle");
  const [link, setLink] = useState("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    const href = `${location.origin}${location.pathname}#${pointId}`;
    setLink(href);
    let ok = false;
    try {
      await navigator.clipboard.writeText(href);
      ok = true;
    } catch {
      // Older browsers and plain http: the hidden-textarea way.
      const ta = document.createElement("textarea");
      ta.value = href;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {}
      ta.remove();
    }
    setState(ok ? "copied" : "manual");
    window.clearTimeout(timer.current);
    if (ok) timer.current = window.setTimeout(() => setState("idle"), 2500);
  };

  return (
    <div className="min-w-0">
      <button type="button" onClick={copy} className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 t-small font-medium text-ink-2 hover:text-ink">
        {state === "copied" ? <Check aria-hidden className="size-4 text-success" /> : <Link2 aria-hidden className="size-4" />}
        {state === "copied" ? "Lenke kopiert" : "Kopier lenke"}
      </button>
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? "Lenken til punktet er kopiert." : ""}
      </span>
      {state === "manual" && (
        <p className="mt-1 t-small text-ink-2">
          Kopier lenken selv: <span className="break-all text-ink select-all">{link}</span>
        </p>
      )}
    </div>
  );
}

/** «Hvem kommenterer du som?»: five big choices, one per row on a phone. */
function NamePicker({ onPick, current, onCancel }: { onPick: (name: string) => void; current: string | null; onCancel?: () => void }) {
  const { names } = useStrategy();
  const headingId = useId();
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  return (
    <fieldset aria-labelledby={headingId} className="grid gap-3">
      <legend id={headingId} className="t-h3 text-ink">
        Hvem kommenterer du som?
      </legend>
      <p className="-mt-1 t-small text-ink-2">Navnet vises ved innleggene dine og huskes i denne nettleseren.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {names.map((n, i) => (
          <button
            key={n}
            ref={i === 0 ? first : undefined}
            type="button"
            onClick={() => onPick(n)}
            aria-pressed={current === n}
            className={cn(
              "flex min-h-[3.25rem] items-center justify-between rounded-[var(--radius-button)] px-4 text-left text-[16px] font-medium transition-colors",
              current === n ? "bg-action text-on-action" : "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--border-strong)] hover:bg-sunken",
            )}
          >
            {n}
            {current === n && <Check aria-hidden className="size-4" />}
          </button>
        ))}
      </div>
      {onCancel && (
        <Button variant="ghost" onClick={onCancel} className="justify-self-start">
          Behold {current}
        </Button>
      )}
    </fieldset>
  );
}

function Composer({
  pointId,
  parentId,
  label,
  submitLabel,
  onCancel,
  onDone,
}: {
  pointId: string;
  parentId?: string;
  label: string;
  submitLabel: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const { name, setName, publish } = useStrategy();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [changing, setChanging] = useState(false);
  // One id per comment being written, kept until the server says it is saved: a double tap or a retry is the same post.
  const attempt = useRef<string | null>(null);
  const busy = useRef(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const errorId = useId();

  const focusField = () => requestAnimationFrame(() => field.current?.focus());
  useEffect(() => {
    if (name) focusField();
    // Only when the composer first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (busy.current) return;
    if (!text.trim()) {
      setError("Skriv noe før du publiserer.");
      field.current?.focus();
      return;
    }
    if (text.trim().length > BODY_MAX) {
      setError(`Innlegget er for langt. Største lengde er ${BODY_MAX} tegn.`);
      return;
    }
    busy.current = true;
    setPending(true);
    setError(null);
    attempt.current ??= uuid();
    const res = await publish({ id: attempt.current, pointId, parentId, body: text });
    busy.current = false;
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    attempt.current = null;
    setText("");
    onDone();
  };

  if (!name) {
    return (
      <div className="grid gap-3">
        <NamePicker
          current={null}
          onPick={(n) => {
            setName(n);
            focusField();
          }}
        />
        <Button variant="ghost" onClick={onCancel} className="justify-self-start">
          Avbryt
        </Button>
      </div>
    );
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {changing ? (
        <div className="rounded-lg bg-surface p-4 ring-1 ring-line">
          <NamePicker
            current={name}
            onPick={(n) => {
              setName(n);
              setChanging(false);
              focusField();
            }}
            onCancel={() => {
              setChanging(false);
              focusField();
            }}
          />
        </div>
      ) : (
        <p className="flex flex-col gap-1 t-small text-ink-2 sm:flex-row sm:items-center sm:gap-3">
          <span>
            Du kommenterer som <strong className="font-semibold text-ink">{name}</strong>
          </span>
          <button
            type="button"
            onClick={() => setChanging(true)}
            className="-ml-2 inline-flex min-h-11 items-center self-start rounded-md px-2 font-medium text-club hover:text-club-hover sm:ml-0"
          >
            Bytt navn
          </button>
        </p>
      )}

      <label htmlFor={fieldId} className="t-label text-ink">
        {label}
      </label>
      <Textarea
        id={fieldId}
        ref={field}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        rows={4}
        maxLength={BODY_MAX + 200}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="min-h-32 bg-surface"
      />
      {error && (
        <p id={errorId} role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={pending} aria-disabled={pending}>
          {pending ? "Publiserer …" : submitLabel}
        </Button>
        <Button variant="ghost" size="lg" onClick={onCancel} disabled={pending}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
