import { cn } from "@/lib/cn";
import type { Sponsor } from "@/lib/types";
import { SponsorLogo } from "./sponsor-logos";

/**
 * The club's backers in two groups, standing still and on one row: hovedsponsorer (`tier: "main"`) with slightly larger logos
 * and samarbeidspartnere with ordinary ones, each logo with what they are to the club under it, a hairline between the two
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
        <Group title="Hovedsponsorer" text="Støtter barne- og ungdomsidretten i klubben." inverse={inverse} className={cn(partners.length > 0 && "lg:pr-14")}>
          {main.map((s) => (
            <li key={s.name}>
              <Backer sponsor={s} inverse={inverse} large />
            </li>
          ))}
        </Group>
      )}
      {partners.length > 0 && (
        <Group title="Samarbeidspartnere" inverse={inverse} className={cn(main.length > 0 && cn("border-t pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-14", rule))}>
          {partners.map((s) => (
            <li key={s.name}>
              <Backer sponsor={s} inverse={inverse} />
            </li>
          ))}
        </Group>
      )}
    </div>
  );
}

/** A heading with the logos under it in a row that wraps; the two groups stand side by side from lg. */
function Group({ title, text, inverse, className, children }: { title: string; text?: string; inverse: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0", className)}>
      <h2 className={cn("t-small font-medium", inverse ? "text-white" : "text-ink")}>{title}</h2>
      {text && <p className={cn("t-small", inverse ? "text-white/60" : "text-ink-3")}>{text}</p>}
      <ul className="mt-5 flex flex-wrap items-start gap-x-10 gap-y-6">{children}</ul>
    </div>
  );
}

/** One logo, linked to the partner's site when it has one, with what they are to the club under it (unless that only repeats the group's name). */
function Backer({ sponsor: s, inverse, large }: { sponsor: Sponsor; inverse: boolean; large?: boolean }) {
  const caption = s.kind && !(s.tier === "main" && /^hovedsponsor$/i.test(s.kind)) ? s.kind : undefined;
  const content = (
    <>
      <SponsorLogo name={s.name} size={large ? "lg" : "md"} />
      {caption && <span className={cn("t-small", inverse ? "text-white/60" : "text-ink-3")}>{caption}</span>}
    </>
  );
  const tint = inverse ? "text-white/70 hover:text-white" : "text-ink-2 hover:text-ink";
  const base = cn("flex flex-col items-start gap-2 transition-colors duration-200", tint);
  return s.url ? (
    <a href={s.url} target="_blank" rel="noopener" aria-label={`${s.name}${s.kind ? `, ${s.kind}` : ""}, åpnes på ny side`} className={cn("focus-visible:outline-2 focus-visible:outline-offset-4", base)}>
      {content}
    </a>
  ) : (
    <div className={base}>{content}</div>
  );
}
