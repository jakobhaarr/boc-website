import { cn } from "@/lib/cn";
import type { Sponsor } from "@/lib/types";
import { SponsorLogo } from "./sponsor-logos";

/**
 * Partner strip, after Stripe's logo carousel: the logos scroll slowly and
 * continuously, pause when you point at them, and stand still (wrapped in a
 * row) for anyone who has asked for reduced motion.
 *
 * The track holds two copies of the logos; the second is hidden from
 * assistive technology and only exists so the loop has no visible seam.
 *
 * It stands under the hero's numbers on the front page and again in the
 * footer of every page; `tone="inverse"` is the footer's, on the club's dark
 * colour.
 */
export function Sponsors({ sponsors, tone = "default", className }: { sponsors: Sponsor[]; tone?: "default" | "inverse"; className?: string }) {
  if (!sponsors.length) return null;
  const track = [...sponsors, ...sponsors];
  const inverse = tone === "inverse";
  return (
    <div className={cn("grid-page items-center", className)}>
      <div className="col-span-4 pt-10 pb-2 md:col-span-8 lg:col-span-3 lg:py-12">
        <h2 className={cn("t-small font-medium", inverse ? "text-white" : "text-ink")}>Samarbeidspartnere</h2>
        <p className={cn("t-small", inverse ? "text-white/60" : "text-ink-3")}>Støtter barne- og ungdomsidretten i klubben.</p>
      </div>
      <div className="col-span-4 md:col-span-8 lg:col-span-9">
        <div className="logo-marquee relative overflow-hidden py-6 lg:py-12">
          <ul className="logo-marquee__track flex w-max items-center">
            {track.map((s, i) => {
              const duplicate = i >= sponsors.length;
              return (
                <li
                  key={`${s.name}-${i}`}
                  aria-hidden={duplicate || undefined}
                  title={`${s.name} · ${s.kind}`}
                  className={cn(
                    "shrink-0 transition-colors duration-200",
                    inverse ? "text-white/60 hover:text-white" : "text-ink-3 hover:text-ink",
                    duplicate && "logo-marquee__copy",
                  )}
                >
                  <SponsorLogo name={s.name} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
