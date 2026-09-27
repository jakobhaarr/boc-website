import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";
import { Photo } from "./photo";

/**
 * A small spread of members' photographs (the portraits from «Fra
 * medlemmene»), without names: faces, not testimonials. Six prints in two
 * rows of three, the second row set half a step over, like photos spread on
 * a table: close enough to overlap at the edges, far enough apart that every
 * face shows. Order, tilt and a little of each position are shuffled on every
 * request. No border, only a soft shadow, as a photo casts. Pointing at the
 * spread opens it a little. Decorative: the people and their words are on
 * the front page.
 */
export function MemberDeck({ photos, className }: { photos: PhotoRecord[]; className?: string }) {
  const cards = shuffle(photos).slice(0, 6);
  if (cards.length < 2) return null;
  const between = (min: number, max: number) => min + Math.random() * (max - min);

  return (
    <div
      aria-hidden
      className={cn(
        // A card, its step across (most of a card) and its step down (most of a card's height).
        "group relative [--card:6rem] [--step:5rem] sm:[--card:7.5rem] sm:[--step:6.25rem] lg:[--card:8.5rem] lg:[--step:7rem]",
        "[--down:calc(var(--card)*1.25*0.8)]",
        // Three across plus the second row's half step; two rows down; room for tilt and shadow.
        "h-[calc(var(--down)+var(--card)*1.25+1.5rem)] w-[calc(var(--card)+2.5*var(--step)+1rem)]",
        className,
      )}
    >
      {cards.map((photo, i) => {
        const row = i < 3 ? 0 : 1;
        const col = i % 3;
        return (
          <div
            key={photo.id}
            style={
              {
                "--x": `calc(${col} * var(--step) + ${row ? "0.5 * var(--step)" : "0px"} + ${between(-6, 6).toFixed(0)}px)`,
                "--y": `calc(${row} * var(--down) + ${between(-6, 6).toFixed(0)}px + 0.5rem)`,
                "--r": `${between(-7, 7).toFixed(1)}deg`,
                "--open": `${((col - 1) * 0.6).toFixed(2)}rem, ${((row - 0.5) * 0.7).toFixed(2)}rem`,
              } as CSSProperties
            }
            className={cn(
              "absolute top-0 left-0 aspect-[4/5] w-[var(--card)] overflow-hidden rounded-md",
              "shadow-[0_1px_2px_rgb(0_0_0/0.22),0_10px_24px_-6px_rgb(0_0_0/0.38)]",
              "[transform:translate(var(--x),var(--y))_rotate(var(--r))] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              "group-hover:[transform:translate(var(--x),var(--y))_translate(var(--open))_rotate(calc(var(--r)*1.3))] motion-reduce:transition-none",
            )}
          >
            <Photo photo={photo} ratio={4 / 5} sizes="180px" grade={false} className="!aspect-auto size-full" />
          </div>
        );
      })}
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
