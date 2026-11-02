import { useId } from "react";
import { cn } from "@/lib/cn";
import { parseSteps, ZONE_NAMES, zoneOf, ZWIFT_WORKOUTS, type ZwiftWorkout } from "@/lib/data/zwift-workouts";

/**
 * Charts for the Zwift workouts (/presentasjon/zwift-treningsplan), drawn on
 * the deck's dark ground and sized in px on its 1600 × 900 stage.
 *
 * Zone colours follow Zwift's own order of cool to hot, so a rider who knows
 * the Training window reads them at once, in the club's dark-ground set: grey,
 * blue, green, the club's yellow, orange and the warm red. The same colour
 * means the same zone in the profile, the zone bar and the key.
 */
export const ZONE_COLORS = ["#8793a3", "#8fb8ff", "#7fd19b", "var(--club-primary)", "#ffa36b", "#ff8a7a"] as const;

/**
 * Two sizes: the deck's (drawn at 1360 px on its stage) and the compact one for
 * a phone held upright, which scales to the screen and has bigger type for its
 * width and fewer watt labels, since the blocks are narrower.
 */
const SIZES = {
  deck: { W: 1360, H: 200, PAD: 22, AXIS: 34, LABEL_MIN: 40, FONT: 20, BAR_FONT: 18, TICK: 10, END: 50 },
  compact: { W: 640, H: 270, PAD: 26, AXIS: 36, LABEL_MIN: 34, FONT: 22, BAR_FONT: 20, TICK: 10, END: 56 },
} as const;
/** The profile's top: 130 % of FTP (the highest block on any of the ten is 125 %). */
const TOP = 130;
const GAP = 1.5;

/**
 * The workout's profile: one bar per block, as wide as it lasts and as tall as
 * its % of FTP, coloured by the zone it falls in. A ramp is a slanted block
 * that fades from the colour of where it starts to where it ends. The dashed
 * line is 100 % of FTP.
 *
 * With the rider's FTP (`ftp`, in watts) every block also says how hard it is:
 *   watts = round(FTP × % of FTP / 100)
 * written over each block wide enough to hold it, on the guide lines, and in
 * the tooltip of every block (a ramp gives its start and its end). Without an
 * FTP the chart is in % of FTP only.
 */
export function WorkoutProfile({ workout, ftp = null, compact = false }: { workout: ZwiftWorkout; ftp?: number | null; compact?: boolean }) {
  const { W, H, PAD, AXIS, LABEL_MIN, FONT, BAR_FONT, END } = SIZES[compact ? "compact" : "deck"];
  const id = useId();
  const segments = parseSteps(workout.steps);
  const total = segments.reduce((sum, s) => sum + s.sec, 0);
  const plotH = H - AXIS;
  const x = (sec: number) => (sec / total) * W;
  const y = (pct: number) => plotH - (Math.min(pct, TOP) / TOP) * plotH;
  const minutes = Math.floor(total / 60);
  const watts = (pct: number) => (ftp ? Math.round((ftp * pct) / 100) : null);
  const tip = (sec: number, from: number, to: number) => {
    const span = from === to ? `${from} %` : `${from} til ${to} %`;
    const w = watts(from) !== null && watts(to) !== null ? (from === to ? ` · ${watts(from)} W` : ` · ${watts(from)} til ${watts(to)} W`) : "";
    return `${Math.floor(sec / 60) ? `${Math.floor(sec / 60)} min ` : ""}${sec % 60 ? `${sec % 60} s ` : ""}· ${span}${w}`.replace(/^· /, "").replace(/\s+/g, " ");
  };

  let at = 0;
  return (
    <svg
      viewBox={`0 ${-PAD} ${W} ${H + PAD}`}
      {...(compact ? {} : { width: W, height: H + PAD })}
      role="img"
      aria-label={`Profil for ${workout.name}: ${workout.steps.join(", ")}`}
      className={cn("block overflow-visible", compact && "h-auto w-full")}
    >
      {[50, 100].map((g) => (
        <line key={g} x1={0} x2={W} y1={y(g)} y2={y(g)} stroke={g === 100 ? "var(--club-primary)" : "var(--guide-strong)"} strokeWidth={g === 100 ? 1.5 : 1} strokeDasharray={g === 100 ? "6 6" : undefined} opacity={g === 100 ? 0.7 : 1} />
      ))}
      {segments.map((s, i) => {
        const left = x(at);
        const width = x(s.sec);
        at += s.sec;
        const bx = left + GAP / 2;
        const bw = Math.max(width - GAP, 1.2);
        if (s.from === s.to) {
          const top = y(s.from);
          const label = watts(s.from);
          return (
            <g key={i}>
              <path d={roundedTop(bx, top, bw, plotH - top)} fill={ZONE_COLORS[zoneOf(s.from)]}>
                <title>{tip(s.sec, s.from, s.to)}</title>
              </path>
              {label !== null && width >= LABEL_MIN && (
                <text x={bx + bw / 2} y={top - 6} textAnchor="middle" fontSize={BAR_FONT} fontWeight={600} fill="var(--text-primary)" stroke="var(--background)" strokeWidth={5} paintOrder="stroke">
                  {label}
                </text>
              )}
            </g>
          );
        }
        const gradient = `${id}-${i}`;
        return (
          <g key={i}>
            <defs>
              <linearGradient id={gradient} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor={ZONE_COLORS[zoneOf(s.from)]} />
                <stop offset="1" stopColor={ZONE_COLORS[zoneOf(s.to)]} />
              </linearGradient>
            </defs>
            <polygon points={`${bx},${plotH} ${bx},${y(s.from)} ${bx + bw},${y(s.to)} ${bx + bw},${plotH}`} fill={`url(#${gradient})`}>
              <title>{tip(s.sec, s.from, s.to)}</title>
            </polygon>
          </g>
        );
      })}
      <line x1={0} x2={W} y1={plotH} y2={plotH} stroke="var(--border-strong)" />
      {/* The labels come last, so a bar never covers them; the ground-coloured outline keeps them readable over one. */}
      {[50, 100].map((g) => (
        <text key={g} x={W} y={y(g) - 8} textAnchor="end" fontSize={FONT} fill={g === 100 ? "var(--club-primary)" : "var(--text-muted)"} stroke="var(--background)" strokeWidth={6} paintOrder="stroke">
          {ftp ? `${g} % · ${watts(g)} W` : `${g} % av FTP`}
        </text>
      ))}
      {/* A tick this close to the end would run off the chart. */}
      {Array.from({ length: Math.floor(minutes / 10) }, (_, k) => (k + 1) * 10).filter((m) => x(m * 60) < W - END).map((m) => (
        <text key={m} x={x(m * 60)} y={H - 6} textAnchor="middle" fontSize={FONT} fill="var(--text-muted)">
          {m} min
        </text>
      ))}
    </svg>
  );
}

/** A bar with its two top corners rounded by 2 px (a thin bar rounds by half its width). */
function roundedTop(x: number, y: number, w: number, h: number) {
  const r = Math.min(2, w / 2, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/** The minutes in each zone as one bar, as wide as its minutes (the whole bar is `scale` minutes). */
export function ZoneBar({ zones, scale, className, height = 28 }: { zones: readonly number[]; scale?: number; className?: string; height?: number }) {
  const sum = zones.reduce((a, b) => a + b, 0);
  const whole = scale ?? sum;
  return (
    <div className={cn("flex gap-[3px]", className)} style={{ height }} role="img" aria-label={zones.map((m, i) => `Z${i + 1} ${m} minutter`).join(", ")}>
      {zones.map((m, i) =>
        m > 0 ? <span key={i} className="block rounded-[2px]" style={{ width: `${(m / whole) * 100}%`, background: ZONE_COLORS[i] }} /> : null,
      )}
    </div>
  );
}

/** The six zones with their colour and name. */
export function ZoneKey({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-8 gap-y-2 text-[20px] text-ink-2", className)}>
      {ZONE_NAMES.map((name, i) => (
        <li key={name} className="flex items-center gap-3">
          <span aria-hidden className="block size-4 rounded-[2px]" style={{ background: ZONE_COLORS[i] }} />
          <span>
            Z{i + 1} <span className="text-ink-3">{name}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * All the workouts side by side, hardest first by whatsonzwift's stress points:
 * the minutes in each zone as a bar (all drawn to the longest workout's scale)
 * and the stress points at the end. Used by both Zwift decks.
 */
export function WorkoutOverview({ note }: { note?: string }) {
  const byStress = [...ZWIFT_WORKOUTS].sort((a, b) => b.stress - a.stress);
  const longest = Math.max(...ZWIFT_WORKOUTS.map((w) => w.zones.reduce((a, b) => a + b, 0)));
  return (
    <>
      <ZoneKey />
      <div className="mt-5 border-t border-line">
        {byStress.map((w) => (
          <div key={w.name} className="grid grid-cols-[360px_minmax(0,1fr)_72px] items-center gap-8 border-b border-line py-[7px]">
            <p className="truncate text-[26px] leading-[1.2] font-medium">{w.name}</p>
            <ZoneBar zones={w.zones} scale={longest} height={24} />
            <p className="text-right font-display text-[30px] leading-none font-medium text-[var(--club-primary)] tabular-nums">{w.stress}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[20px] text-ink-3">Hver stolpe er øktas minutter fordelt på sonene. Tallet til høyre er stresspoeng. Kilde: whatsonzwift.com.{note && ` ${note}`}</p>
    </>
  );
}
