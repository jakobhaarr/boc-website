/**
 * An illustration for «Meld deg på rittet»: a race number (112) pinned on, with a yellow stripe across the top where
 * the club's name stands in black capitals, and a «Påmeldt» card with a check mark in a green circle lying over its
 * corner, so it reads as a completed entry. The digits are drawn as shapes, in a heavy, squared cut like the numbers
 * on a pro race bib, so they look the same on every device and do not depend on a font. Drawn in HTML and CSS and
 * sized with container units, like the other step illustrations. It is a picture, not a number from any real ride.
 */
function Pin({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 10" aria-hidden className={className} fill="none" stroke="#8d949c" strokeWidth="1.3" strokeLinecap="round">
      <path d="M3 5h17" />
      <circle cx="4" cy="5" r="2.2" />
      <path d="M20 5c2-2 2-3 0-3.5" />
    </svg>
  );
}

export function RideEntry({ className }: { className?: string }) {
  return (
    <div role="img" aria-label="Illustrasjon: et startnummer 112 med BOC på en gul stripe, og et kort med teksten Påmeldt og et hakemerke i en grønn sirkel" className={className}>
      <div className="mx-auto w-full max-w-[26rem] [container-type:inline-size]">
        <div className="relative pb-[9cqw]">
          {/* The race number */}
          <div className="relative -rotate-2 overflow-hidden rounded-[1cqw] bg-white shadow-float ring-1 ring-black/10">
            <div className="bg-[#f7fd00] px-[5cqw] py-[2.6cqw]">
              <p className="text-center font-sans text-[6.4cqw] leading-none font-black tracking-[0.34em] text-black">BOC</p>
            </div>
            <svg viewBox="0 0 190 100" aria-hidden className="mx-auto block w-[64cqw] py-[3cqw]" fill="#2b2d31">
              {/* 1, 1 and 2: a flag, a heavy stem and a foot; the two is a thick stroke with square ends */}
              <path id="one" d="M4 36 28 12h20v68h14v14H14V80h14V36Z" transform="translate(0 0)" />
              <path d="M70 36 94 12h20v68h14v14H80V80h14V36Z" />
              <path d="M138 34c0-17 12-24 27-24s26 7 26 24c0 14-8 22-26 36l-18 14h46" fill="none" stroke="#2b2d31" strokeWidth="17" strokeLinejoin="miter" transform="translate(-9 0) scale(.94 .94) translate(8 4)" />
            </svg>
            <div className="h-[3cqw] bg-[#2b2d31]" />
            <Pin className="absolute top-[2cqw] left-[1.4cqw] w-[7cqw] rotate-[-8deg]" />
            <Pin className="absolute top-[2cqw] right-[1.4cqw] w-[7cqw] rotate-[8deg]" />
            <Pin className="absolute bottom-[4cqw] left-[1.4cqw] w-[7cqw] rotate-[6deg]" />
            <Pin className="absolute right-[1.4cqw] bottom-[4cqw] w-[7cqw] rotate-[-6deg]" />
          </div>

          {/* The confirmation, lying over the corner */}
          <div className="absolute right-[-1.5cqw] bottom-0 flex rotate-[3deg] items-center gap-[3cqw] rounded-[1.6cqw] bg-surface px-[4.4cqw] py-[3cqw] shadow-[0_2.4cqw_5cqw_-2cqw_rgb(13_26_43/0.4),0_0.4cqw_1cqw_rgb(13_26_43/0.12)] ring-1 ring-black/5">
            <span className="grid size-[9cqw] place-items-center rounded-full bg-[#1f9d55]">
              <svg viewBox="0 0 24 24" aria-hidden className="size-[5.6cqw]" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </span>
            <span className="font-display text-[5.6cqw] leading-none font-semibold tracking-[-0.01em] text-ink">Påmeldt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
