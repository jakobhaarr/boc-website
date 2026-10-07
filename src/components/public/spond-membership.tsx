import { ClubCrest } from "@/components/public/crest";
import { cn } from "@/lib/cn";
import spondLogo from "@/components/assets/spond.svg";

/**
 * An illustration for «Bli medlem i klubben»: the membership is arranged in Spond. A BOC membership card lies a little
 * askew with its fields still empty, and a Spond-red card on top of it, turned the other way, carries the logo and a
 * «Meld deg inn» button with an arrow out, so it reads as: go to Spond and the card is filled in. Drawn in HTML and CSS
 * in the club's own colours, and sized with container units like the sports grant certificate. It is a picture, not a form.
 */
const CARD = "absolute right-[-1cqw] bottom-0 w-[58cqw] rotate-[4deg] rounded-[1.4cqw] bg-[#f72b51] px-[5cqw] pt-[5cqw] pb-[4.4cqw] shadow-[0_2.4cqw_5cqw_-2cqw_rgb(13_26_43/0.45),0_0.4cqw_1cqw_rgb(13_26_43/0.15)]";

export function SpondMembership({ club = "klubben", href, className }: { club?: string; /** Where the Spond card leads: the club's membership form in Spond. The card is a link when it is given. */ href?: string; className?: string }) {
  const card = (
    <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spondLogo.src} width={spondLogo.width} height={spondLogo.height} alt="" className="mx-auto h-auto w-[30cqw]" />
            <span className="mt-[4cqw] flex items-center justify-center gap-[1.4cqw] rounded-[1cqw] bg-white py-[2cqw] text-[3.2cqw] font-semibold text-[#f72b51]">
              Meld deg inn
              <svg viewBox="0 0 16 16" aria-hidden className="size-[3.2cqw]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12 12 4M5.5 4H12v6.5" />
              </svg>
            </span>
    </>
  );
  return (
    <div className={className}>
      <div className="mx-auto w-full max-w-[26rem] [container-type:inline-size]">
        <div className="relative pb-[16cqw]">
          {/* The membership card, with its fields empty */}
          <div role="img" aria-label={`Illustrasjon: et tomt medlemskort for ${club}`} className="-rotate-2 rounded-[1cqw] bg-surface p-[1.6cqw] shadow-float ring-1 ring-black/10">
            <div className="overflow-hidden rounded-[0.6cqw] border border-[var(--club-link)]">
              <div className="relative flex items-center bg-club-surface px-[5cqw] py-[3.6cqw]">
                <ClubCrest letters="BOC" logo="wordmark" tone="light" className="h-[6cqw] w-auto" />
                <div aria-hidden className="absolute inset-y-0 right-[4cqw] flex gap-[1.4cqw]">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="block h-full w-[1.3cqw] bg-[var(--club-link)]" style={{ transform: "skewX(-21.25deg)" }} />
                  ))}
                </div>
              </div>
              <div className="px-[5cqw] pt-[4cqw] pb-[6cqw]">
                <p className="text-[2.6cqw] font-semibold tracking-[0.24em] text-[var(--club-link)] uppercase">Medlemskort</p>
                <p className="mt-[3.4cqw] border-b border-dashed border-ink-3/70 pb-[1.6cqw] text-[2.8cqw] text-ink-3">Navn</p>
                <p className="mt-[4.2cqw] border-b border-dashed border-ink-3/70 pb-[1.6cqw] text-[2.8cqw] text-ink-3">Medlem fra</p>
              </div>
            </div>
          </div>

          {/* The Spond card on top: the logo and the button that leads out */}
          {href ? (
            <a href={href} target="_blank" rel="noreferrer noopener" aria-label="Meld deg inn i klubben i Spond (åpnes i ny fane)" className={cn(CARD, "transition-transform duration-200 hover:rotate-[2deg] hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action")}>
              {card}
            </a>
          ) : (
            <div aria-hidden className={CARD}>
              {card}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
