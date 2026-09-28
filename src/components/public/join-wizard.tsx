"use client";

import { Check, ChevronLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import appStoreBadge from "@/components/assets/app-store-badge.png";
import googlePlayBadge from "@/components/assets/google-play-badge.png";
import { SpondNote } from "@/components/public/schedule-explorer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ExternalLink, ParticipationStep } from "@/lib/types";

/** Store badges for a step that asks someone to install an app (ParticipationStep.appLink). */
function AppLink({ appLink }: { appLink: NonNullable<ParticipationStep["appLink"]> }) {
  return (
    <div className="mt-5 flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={appLink.icon.src} width={appLink.icon.width} height={appLink.icon.height} alt="" className="size-10 shrink-0 rounded-lg ring-1 ring-line" />
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
 * setting up an app and following the organiser, and a list of five steps
 * with every screenshot at once is a wall; one step with its picture is a
 * thing you can do, then press «Neste».
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
   * people who said on Spond that they are coming to that session.
   */
  joinGroup?: ExternalLink;
}) {
  const key = `join-wizard:${id}`;
  const [index, setIndex] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const finished = index >= steps.length;

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(key));
      if (saved > 0 && saved <= steps.length) setIndex(saved);
    } catch {}
  }, [key, steps.length]);

  const go = (next: number) => {
    moved.current = true;
    setIndex(next);
    try {
      window.localStorage.setItem(key, String(next));
    } catch {}
  };

  // Keyboard and screen-reader users land on the new step's heading.
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [index]);

  const step = steps[Math.min(index, steps.length - 1)];

  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line">
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
              <span className={cn("block h-1.5 rounded-full transition-colors", i < index || finished ? "bg-[var(--club-link)]" : i === index ? "bg-[var(--club-primary)]" : "bg-sunken ring-1 ring-line ring-inset")} />
              <span className={cn("mt-2 hidden truncate t-meta md:block", i === index ? "font-semibold text-ink" : "text-ink-3 group-hover:text-ink-2")}>{s.title}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* Shown on every step, not just once the app is set up: the Meetup
          invitation depends on that week's Spond sign-up, so this can't wait
          behind five steps most visitors only ever do once. */}
      {joinGroup?.kind === "spond" && <SpondNote url={joinGroup.url} label={joinGroup.label} className="m-5 sm:mx-8 sm:mt-6 sm:mb-0" />}

      <div className="p-5 sm:p-8" aria-live="polite">
        {finished ? (
          <div className="flex flex-col items-start">
            <span className="flex size-12 items-center justify-center rounded-full bg-[var(--club-primary)] text-[var(--club-on-primary)]">
              <Check className="size-6" />
            </span>
            <h3 ref={heading} tabIndex={-1} className="mt-5 t-h3 outline-none">
              Klart! Husk å melde deg på hver økt i Spond.
            </h3>
            <p className="mt-2 max-w-[60ch] t-body text-ink-2">
              Zwift Companion sender ikke invitasjonen til alle som følger, bare til dem som har sagt ifra at de kommer.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              {done && (
                <Link href={done.href} target="_blank" className="t-small font-medium text-[var(--club-link)] hover:underline">
                  {done.label} ↗
                </Link>
              )}
              <button type="button" onClick={() => go(0)} className="inline-flex items-center gap-1.5 t-small font-medium text-ink-3 hover:text-ink">
                <RotateCcw className="size-3.5" />
                Se stegene på nytt
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
            <div>
              <p className="t-meta font-semibold text-ink-3">
                Steg {index + 1} av {steps.length}
              </p>
              <h3 ref={heading} tabIndex={-1} className="mt-2 t-h3 outline-none">
                {step.title}
              </h3>
              {step.text && <p className="mt-3 t-body text-ink-2">{step.text}</p>}
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
              {step.appLink && <AppLink appLink={step.appLink} />}
            </div>
            {step.images && step.images.length > 0 && (
              <div className={cn("grid items-start gap-4", step.images.length > 1 && "sm:grid-cols-2")}>
                {step.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.src} src={img.src} width={img.width} height={img.height} alt={img.alt} className="h-auto w-full rounded-lg ring-1 ring-line" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!finished && (
        <div className="flex items-center justify-between gap-4 border-t border-line bg-sunken/50 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="inline-flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink disabled:invisible"
          >
            <ChevronLeft className="size-4" />
            Tilbake
          </button>
          <Button type="button" onClick={() => go(index + 1)} brand arrow>
            {index === steps.length - 1 ? "Ferdig" : "Neste"}
          </Button>
        </div>
      )}
    </div>
  );
}
