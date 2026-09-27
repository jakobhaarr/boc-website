import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";
import { Photo } from "./photo";

/**
 * A small spread of members' photographs (the portraits from «Fra
 * medlemmene»), without names: faces, not testimonials. The cards are fanned
 * out like prints dropped on a table, each one far enough from the last that
 * every rider shows, with the order, tilt and height shuffled on every
 * request. No border, only a soft shadow, as a photo casts. Pointing at the
 * spread opens the fan a little more. Decorative: the people and their words
 * are on the front page.
 */
export function MemberDeck({ photos, className }: { photos: PhotoRecord[]; className?: string }) {
  const cards = shuffle(photos).slice(0, 5);
  if (cards.length < 2) return null;
  const mid = (cards.length - 1) / 2;
  const between = (min: number, max: number) => min + Math.random() * (max - min);

  return (
    <div
      aria-hidden
      style={{ "--n": cards.length } as CSSProperties}
      className={cn(
        // Card width + one step per further card; a step is three quarters of a card, so every face stays clear.
        "group relative [--card:5.25rem] [--step:3.75rem] sm:[--card:7.5rem] sm:[--step:5.4rem] lg:[--card:8.5rem] lg:[--step:6.25rem]",
        "h-[calc(var(--card)*1.25+2.5rem)] w-[calc(var(--card)+(var(--n)-1)*var(--step))]",
        className,
      )}
    >
      {cards.map((photo, i) => (
        <div
          key={photo.id}
          style={
            {
              "--i": i,
              // The fan leans outwards from the middle card, with a little chance in it.
              "--r": `${((i - mid) * 5 + between(-3, 3)).toFixed(1)}deg`,
              "--y": `${(Math.abs(i - mid) * 6 + between(-6, 6)).toFixed(0)}px`,
              "--open": `${((i - mid) * 0.9).toFixed(2)}rem`,
            } as CSSProperties
          }
          className={cn(
            "absolute top-5 left-[calc(var(--i)*var(--step))] aspect-[4/5] w-[var(--card)] overflow-hidden rounded-md",
            "shadow-[0_1px_2px_rgb(0_0_0/0.22),0_10px_24px_-6px_rgb(0_0_0/0.38)]",
            "[transform:translateY(var(--y))_rotate(var(--r))] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "group-hover:[transform:translate(var(--open),calc(var(--y)-4px))_rotate(calc(var(--r)*1.3))] motion-reduce:transition-none",
          )}
        >
          <Photo photo={photo} ratio={4 / 5} sizes="180px" grade={false} className="!aspect-auto size-full" />
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
