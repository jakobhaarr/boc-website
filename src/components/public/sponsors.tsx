import { cn } from "@/lib/cn";
import type { Sponsor } from "@/lib/types";
import { SponsorLogo } from "./sponsor-logos";

/**
 * The club's backers in two groups, standing still and on one row: hovedsponsorer (`tier: "main"`) with slightly larger logos
 * and samarbeidspartnere with ordinary ones, every logo centred in a box of the same height, no captions, a hairline between the two
 * groups (above and below on a phone). With so few of each, a moving strip would only hide them; every logo is in view at once
 * and links to the partner's own site.
 *
 * It stands under the hero's numbers on the front page, on Om klubben, and again in the footer of every page;
 * `tone="inverse"` is the footer's, on the club's dark colour. A club with only one kind shows only that group.
 */
export function Sponsors({ sponsors, tone = "default", className }: { sponsors: Sponsor[]; tone?: "default" | "inverse"; className?: string }) {
  if (!sponsors.length) return null;
  const main = sponsors.filter((s) => s.tier === "main");
  const partners = sponsors.filter((s) => s.tier !== "main");
  const inverse = tone === "inverse";
  const rule = inverse ? "border-white/10" : "border-line";
  return (
    <div className={cn("flex flex-col gap-8 py-8 lg:flex-row lg:items-stretch lg:gap-0 lg:py-10", className)}>
      {main.length > 0 && (
        <Group title="Hovedsponsorer" sponsors={main} inverse={inverse} large className={cn(partners.length > 0 && "lg:pr-16")} />
      )}
      {partners.length > 0 && (
        <Group title="Samarbeidspartnere" sponsors={partners} inverse={inverse} className={cn(main.length > 0 && cn("border-t pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-16", rule))} />
      )}
    </div>
  );
}

/** A heading with the logos under it, each centred in a box of the same height so the logos stand on one line. */
function Group({ title, sponsors, inverse, large, className }: { title: string; sponsors: Sponsor[]; inverse: boolean; large?: boolean; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <h2 className={cn("t-small font-medium", inverse ? "text-white" : "text-ink")}>{title}</h2>
      <ul className="mt-4 flex flex-wrap items-center gap-x-12 gap-y-4">
        {sponsors.map((s) => (
          <li key={s.name}>
            <Backer sponsor={s} inverse={inverse} large={large} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One logo in its box, linked to the partner's site when it has one. What the partner is to the club (`kind`) is in the link's label for a screen reader, not printed. */
function Backer({ sponsor: s, inverse, large }: { sponsor: Sponsor; inverse: boolean; large?: boolean }) {
  const content = (
    <span className="flex h-14 items-center">
      <SponsorLogo name={s.name} size={large ? "lg" : "md"} />
    </span>
  );
  const tint = inverse ? "text-white/70 hover:text-white" : "text-ink-2 hover:text-ink";
  const base = cn("block transition-colors duration-200", tint);
  return s.url ? (
    <a href={s.url} target="_blank" rel="noopener" aria-label={`${s.name}${s.kind ? `, ${s.kind}` : ""}, åpnes på ny side`} className={cn("focus-visible:outline-2 focus-visible:outline-offset-4", base)}>
      {content}
    </a>
  ) : (
    <div className={base}>{content}</div>
  );
}
