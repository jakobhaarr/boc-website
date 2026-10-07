"use client";

import { ArrowUpRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import appStoreBadge from "@/components/assets/app-store-badge.png";
import googlePlayBadge from "@/components/assets/google-play-badge.png";
import { SpondNote } from "@/components/public/schedule-explorer";
import { Button, buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ExternalLink, ParticipationStep } from "@/lib/types";

/** Store badges for a step that asks someone to install an app (ParticipationStep.appLink). */
function AppLink({ appLink }: { appLink: NonNullable<ParticipationStep["appLink"]> }) {
  return (
    <div className="mt-5 flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={appLink.icon.src} width={appLink.icon.width} height={appLink.icon.height} alt="" className="size-[3.75rem] shrink-0 rounded-lg ring-1 ring-line" />
      <div className="flex flex-col gap-1.5">
        <span className="t-small font-medium text-ink">{appLink.name}</span>
        <div className="flex items-center gap-2">
          <a href={appLink.iosUrl} target="_blank" rel="noreferrer noopener" aria-label={`Last ned ${appLink.name} i App Store`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={appStoreBadge.src} alt="" className="h-9 w-auto" />
          </a>
          <a href={appLink.androidUrl} target="_blank" rel="noreferrer noopener" aria-label={`Last ned ${appLink.name} på Google Play`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={googlePlayBadge.src} alt="" className="h-9 w-auto" />
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * The join steps one at a time, with the screenshots a rider needs to find
 * the right button (OrgNode.participation.wizard). Taking part in Zwift means
 * setting up an app and following the organiser, and a list of six steps
 * with every screenshot at once is a wall; one step with its picture is a
 * thing you can do, then press «Neste». There is no separate «you're done»
 * screen: the last step is a step like any other, and its own content is
 * where the wizard ends.
 *
 * The step you are on is remembered in this browser (localStorage, keyed by
 * the group), because the wizard sends you off to the app and you come back.
 * Storage may be unavailable — then it simply starts at step one.
 */
export function JoinWizard({
  id,
  steps,
  done,
  joinGroup,
}: {
  id: string;
  steps: ParticipationStep[];
  done?: { label: string; href: string };
  /**
   * Where sessions are actually organised (OrgNode.joinGroup). Zwift's
   * Meetup invitations go out by name, not to everyone who has followed the
   * organiser in Zwift Companion, so finishing the app setup here is not
   * enough on its own: whoever runs the group only knows to invite the
   * people who said on Spond that they are coming to that session. A step
   * with `spond: true` (ParticipationStep) shows the sign-up there, between
   * the steps that lead to it and the ones that depend on it.
   */
  joinGroup?: ExternalLink;
}) {
  const key = `join-wizard:${id}`;
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const last = steps.length - 1;

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(key));
      if (saved > 0 && saved <= last) setIndex(saved);
    } catch {}
  }, [key, last]);

  const go = (next: number) => {
    const clamped = Math.max(0, Math.min(next, last));
    moved.current = true;
    setIndex(clamped);
    try {
      window.localStorage.setItem(key, String(clamped));
    } catch {}
  };

  // Keyboard and screen-reader users land on the new step's heading.
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [index]);

  // ← and → move between steps, unless someone is typing or the wizard is off screen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== "ArrowLeft" && e.key !== "ArrowRight") || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const box = root.current?.getBoundingClientRect();
      if (!box || box.bottom < 0 || box.top > window.innerHeight) return;
      go(index + (e.key === "ArrowRight" ? 1 : -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const step = steps[index];

  // On a phone the step is swiped too: a mostly sideways drag of 50 px or more goes to the next or the previous.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const swipe = (e: React.TouchEvent) => {
    const from = touch.current;
    touch.current = null;
    const end = e.changedTouches[0];
    if (!from || !end) return;
    const dx = end.clientX - from.x;
    const dy = end.clientY - from.y;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <div ref={root} className="overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line">
      {/* Progress: one segment per step */}
      <ol aria-label="Steg" className="flex gap-1.5 border-b border-line p-4 sm:px-6">
        {steps.map((s, i) => (
          <li key={s.title} className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => go(i)}
              aria-current={i === index ? "step" : undefined}
              aria-label={`Steg ${i + 1}: ${s.title}`}
              className="group block w-full pt-1 text-left"
            >
              <span className={cn("block h-1.5 rounded-full transition-colors", i < index ? "bg-[var(--club-link)]" : i === index ? "bg-[var(--club-primary)]" : "bg-sunken ring-1 ring-line ring-inset")} />
              <span className={cn("mt-2 hidden truncate t-meta md:block", i === index ? "font-semibold text-ink" : "text-ink-3 group-hover:text-ink-2")}>{s.title}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="flex flex-col-reverse gap-3 border-b border-line bg-sunken/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-8">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink disabled:invisible max-sm:h-[3.25rem] max-sm:w-full max-sm:justify-center max-sm:rounded-[var(--radius-button)] max-sm:bg-surface max-sm:text-[16px] max-sm:shadow-[inset_0_0_0_1px_var(--border-strong)] max-sm:disabled:hidden"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Tilbake
        </button>
        {index < last ? (
          <Button type="button" size="lg" onClick={() => go(index + 1)}>
            Neste
          </Button>
        ) : (
          done && (
            <Link href={done.href} target="_blank" className={buttonClass({ size: "lg" })}>
              {done.label}
            </Link>
          )
        )}
      </div>

      <div
        className="touch-pan-y p-4 sm:p-8"
        aria-live="polite"
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={swipe}
        onTouchCancel={() => (touch.current = null)}
      >
        {/* The picture column is wider on every step but the Spond one, whose screenshot is a tall phone screen that reads better narrow. */}
        <div className={cn("grid gap-5 lg:items-start lg:gap-8", step.spond ? "lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]" : "lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]")}>
          <div>
            <p className="t-meta font-semibold text-ink-3">
              Steg {index + 1} av {steps.length}
            </p>
            <h3 ref={heading} tabIndex={-1} className="mt-2 t-h3 outline-none">
              {step.title}
            </h3>
            {step.text && <p className="mt-3 t-body text-ink-2">{step.text}</p>}
            {step.spond && joinGroup?.kind === "spond" && <SpondNote url={joinGroup.url} label={joinGroup.label} className="mt-5" />}
            {step.points && (
              <ol className="mt-5 space-y-2.5">
                {step.points.map((p, i) => (
                  <li key={p} className="flex gap-3 t-body text-ink">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sunken text-[12px] font-semibold text-ink-2 ring-1 ring-line">{i + 1}</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ol>
            )}
            {step.link && (
              <a href={step.link.url} {...(step.link.url.startsWith("/") ? {} : { target: "_blank", rel: "noreferrer noopener" })} className="mt-5 inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover">
                {step.link.label}
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
            )}
            {step.appLink && <AppLink appLink={step.appLink} />}
          </div>
          {step.images && step.images.length > 0 && (
            <div className={cn("grid items-start gap-3 sm:gap-4", step.images.length > 1 ? "grid-cols-2" : step.spond ? "max-w-[22rem] lg:justify-self-end" : "lg:justify-self-end")}>
              {step.images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.src} src={img.src} width={img.width} height={img.height} alt={img.alt} className={cn("mx-auto h-auto rounded-lg ring-1 ring-line", step.images && step.images.length > 1 ? "w-full" : "max-h-[12rem] w-auto max-w-full lg:max-h-none lg:w-full")} />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
