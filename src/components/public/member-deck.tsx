import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";
import { Photo } from "./photo";

/**
 * A small, loosely stacked deck of members' photographs (the portraits from
 * «Fra medlemmene»), without names: faces, not testimonials. The order, tilt
 * and offset are shuffled on every request, so the stack looks dropped on
 * the table rather than laid out. Pointing at it fans the cards out a little.
 * Decorative: the people and their words are on the front page.
 */
export function MemberDeck({ photos, className }: { photos: PhotoRecord[]; className?: string }) {
  const cards = shuffle(photos).slice(0, 5);
  if (cards.length < 2) return null;
  const mid = (cards.length - 1) / 2;
  const between = (min: number, max: number) => min + Math.random() * (max - min);

  return (
    <div aria-hidden className={cn("group relative h-[12rem] w-[10rem] sm:h-[14rem] sm:w-[11.5rem]", className)}>
      {cards.map((photo, i) => (
        <div
          key={photo.id}
          style={
            {
              "--r": `${between(-9, 9).toFixed(1)}deg`,
              "--x": `${between(-12, 12).toFixed(0)}px`,
              "--y": `${between(-8, 8).toFixed(0)}px`,
              "--fan": `${((i - mid) * 3.25).toFixed(2)}rem`,
            } as CSSProperties
          }
          className={cn(
            "absolute inset-0 overflow-hidden rounded-lg bg-surface shadow-raised ring-4 ring-surface",
            "[transform:translate(var(--x),var(--y))_rotate(var(--r))] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "group-hover:[transform:translate(calc(var(--x)+var(--fan)),var(--y))_rotate(calc(var(--r)*1.4))] motion-reduce:transition-none",
          )}
        >
          <Photo photo={photo} ratio={4 / 5} sizes="200px" grade={false} className="!aspect-auto size-full" />
        </div>
      ))}
    </div>
  );
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
