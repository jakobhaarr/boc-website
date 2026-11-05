import { cn } from "@/lib/cn";

/**
 * A ring that shows how many of the rooms are taken (lib/trip-signup.ts, `roomsTaken`): the filled part in the club's colour,
 * the number in the middle. `size` is in pixels. Read out as «X av Y rom er tatt» for a screen reader.
 */
export function TripProgress({ taken, total, size = 132, className }: { taken: number; total: number; size?: number; className?: string }) {
  const stroke = Math.round(size * 0.1);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const share = Math.min(1, taken / total);
  return (
    <div role="img" aria-label={`${taken} av ${total} rom er tatt`} className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg aria-hidden width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-strong, #d5dbe3)" strokeWidth={stroke} opacity={0.6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--club-link)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - share)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-[1.9rem] leading-none font-semibold tnum text-ink">{taken}</span>
        <span className="mt-1 t-small text-ink-2">av {total} rom</span>
      </div>
    </div>
  );
}
