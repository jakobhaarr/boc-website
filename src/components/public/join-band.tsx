import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass, HoverArrow } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";
import { Photo } from "./photo";

export interface JoinOption {
  id: string;
  name: string;
  href: string;
  note?: string;
}

/**
 * "Bli med" as one large media card, after Stripe's Sessions banner: the
 * photo fills the card, the statement and a light button sit on a dark wash
 * top left, and the groups that take new members run along the bottom.
 * It is the target of every hero's secondary action (#bli-med).
 */
export function JoinBand({
  title,
  text,
  photo,
  action,
  options = [],
  footnote,
}: {
  title: string;
  text?: string;
  photo?: PhotoRecord;
  action: { href: string; label: string; external?: boolean };
  options?: JoinOption[];
  footnote?: ReactNode;
}) {
  return (
    <Section id="bli-med" labelledBy="bli-med-tittel" className="scroll-mt-[var(--header-h)] py-16 lg:py-24">
      <div className="page">
        <div className="on-inverse relative isolate overflow-hidden rounded-xl bg-club-2 text-white">
          {photo && (
            <Photo
              photo={photo}
              ratio={3 / 4}
              mdRatio={16 / 9}
              sizes="(min-width: 1360px) 1280px, 100vw"
              className="absolute inset-0 -z-10 !aspect-auto h-full w-full"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(9_14_22/0.86)_0%,rgb(9_14_22/0.62)_42%,rgb(9_14_22/0.08)_78%),linear-gradient(0deg,rgb(9_14_22/0.7)_0%,transparent_45%)]"
          />

          <div className="flex min-h-[34rem] flex-col justify-between gap-12 p-6 sm:p-10 lg:min-h-[36rem] lg:p-12">
            <div className="max-w-[34rem]">
              <p className="t-eyebrow !text-white/70">Bli med</p>
              <h2 id="bli-med-tittel" className="mt-3 t-h1 text-white">
                {title}
              </h2>
              {text && <p className="mt-5 t-body-lg text-white/80">{text}</p>}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href={action.href}
                  {...(action.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                  className={buttonClass({ variant: "inverse", size: "lg", brand: true })}
                >
                  {action.label}
                  {action.external ? <ArrowUpRight aria-hidden /> : <HoverArrow />}
                </a>
                {footnote && <span className="t-small text-white/70">{footnote}</span>}
              </div>
            </div>

            {options.length > 0 && (
              <div>
                <p className="t-meta text-white/60">Andre grupper du kan prøve</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {options.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={o.href}
                        className={cn(
                          "group inline-flex h-10 items-center gap-2 rounded-md bg-white/10 px-3.5 text-[14px] font-medium text-white ring-1 ring-white/20 backdrop-blur-md",
                          "transition-[background-color,box-shadow] duration-150 hover:bg-white/20 hover:ring-white/40",
                        )}
                      >
                        {o.name}
                        {o.note && <span className="text-white/60">{o.note}</span>}
                        <HoverArrow />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
