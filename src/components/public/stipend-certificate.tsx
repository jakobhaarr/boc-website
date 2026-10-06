import { ClubCrest } from "@/components/public/crest";

/** The points of a five-pointed star in a 100 × 100 box. */
function starPoints(cx: number, cy: number, outer: number, inner: number) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 ? inner : outer;
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

/**
 * An illustration for the sports grant: a certificate lying a little askew, with the club's wordmark in a yellow band,
 * a star, the grant's name and its size. Drawn in HTML and CSS in the club's own colours (the club tokens, so it follows
 * the theme), and sized with container units, so it holds at any width. It says only what the grant page says: up to
 * 150 000 kroner, for talents under 25, agreed at the annual meeting in 2023. It is a picture, not a document.
 */
export function StipendCertificate({ club, amount, className }: { club: string; amount: string; className?: string }) {
  return (
    <div role="img" aria-label={`Illustrasjon: et sertifikat for ${club} idrettsstipend, med en stjerne`} className={className}>
      <div className="mx-auto w-full max-w-[32rem] [container-type:inline-size]">
        <div className="-rotate-2 rounded-[0.5cqw] bg-surface p-[2.2cqw] shadow-float ring-1 ring-black/10">
          {/* Double rule in the club's blue */}
          <div className="rounded-[0.4cqw] border-[0.5cqw] border-[var(--club-link)] p-[0.9cqw]">
            <div className="relative overflow-hidden rounded-[0.2cqw] border border-[var(--club-link)]">
              {/* The band: the wordmark on yellow, the club's slanted bars at its end */}
              <div className="relative flex items-center bg-club-surface px-[5cqw] py-[3.4cqw]">
                <ClubCrest letters="BOC" logo="wordmark" tone="light" className="h-[5.6cqw] w-auto" />
                <div aria-hidden className="absolute inset-y-0 right-[4cqw] flex gap-[1.4cqw]">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="block h-full w-[1.3cqw] bg-[var(--club-link)]" style={{ transform: "skewX(-21.25deg)" }} />
                  ))}
                </div>
              </div>

              <div className="relative px-[5cqw] pt-[4.5cqw] pb-[4cqw] text-center">
                {/* The star: a ring, rays, and the star itself */}
                <svg viewBox="0 0 100 100" aria-hidden className="mx-auto block w-[24cqw]">
                  <circle cx="50" cy="50" r="47" fill="none" stroke="var(--club-link)" strokeWidth="1.2" />
                  <circle cx="50" cy="50" r="43" fill="none" stroke="var(--club-primary)" strokeWidth="5" strokeDasharray="0.1 6.3" strokeLinecap="round" />
                  <polygon points={starPoints(50, 52, 33, 14)} fill="var(--club-primary)" stroke="var(--club-link)" strokeWidth="2.4" strokeLinejoin="round" />
                  <polygon points={starPoints(50, 52, 33, 14)} fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1" strokeLinejoin="round" transform="translate(-1.2 -1.2) scale(.97) translate(1.5 1.5)" />
                </svg>

                <p className="mt-[3.2cqw] text-[2.3cqw] font-semibold tracking-[0.28em] text-[var(--club-link)] uppercase">Sertifikat</p>
                <p className="mt-[0.8cqw] font-display text-[8.6cqw] leading-[1.02] font-medium tracking-[-0.02em] text-ink">Idrettsstipend</p>
                <p className="mx-auto mt-[2.6cqw] w-[34cqw] border-t border-[var(--club-link)]" />
                <p className="mt-[2.6cqw] font-display text-[5.6cqw] leading-tight font-medium tracking-[-0.01em] text-ink">{amount}</p>
                <p className="mt-[1cqw] text-[2.9cqw] text-ink-2">til unge talenter under 25 år</p>

                <div className="mt-[5cqw] flex items-end justify-between gap-[4cqw] text-left text-[2.2cqw] text-ink-3">
                  <span className="flex-1 border-t border-ink-3/60 pt-[1cqw]">Styret</span>
                  <span className="flex-1 border-t border-ink-3/60 pt-[1cqw]">Vedtatt av årsmøtet 2023</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
