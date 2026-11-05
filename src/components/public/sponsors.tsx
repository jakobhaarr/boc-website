import { cn } from "@/lib/cn";
import type { Sponsor } from "@/lib/types";
import { SponsorLogo } from "./sponsor-logos";

/**
 * The club's backers in two groups, standing still: hovedsponsorer (`tier: "main"`) as large cards, one logo each with
 * what they are to the club under it, and samarbeidspartnere as a quieter row of smaller logos. With so few of each, a
 * moving strip would only hide them; every logo is in view at once and links to the partner's own site.
 *
 * It stands under the hero's numbers on the front page, on Om klubben, and again in the footer of every page;
 * `tone="inverse"` is the footer's, on the club's dark colour, with lower cards and ordinary-sized logos. A club with only one kind shows only that group.
 */
export function Sponsors({ sponsors, tone = "default", className }: { sponsors: Sponsor[]; tone?: "default" | "inverse"; className?: string }) {
  if (!sponsors.length) return null;
  const main = sponsors.filter((s) => s.tier === "main");
  const partners = sponsors.filter((s) => s.tier !== "main");
  const inverse = tone === "inverse";
  return (
    <div className={cn("py-10 lg:py-14", className)}>
      {main.length > 0 && (
        <Group
          title="Hovedsponsorer"
          text="Støtter barne- og ungdomsidretten i klubben."
          inverse={inverse}
        >
          <ul className={cn("grid gap-3 sm:grid-cols-2 lg:gap-4", main.length > 2 && "lg:grid-cols-3")}>
            {main.map((s) => (
              <li key={s.name}>
                <Backer sponsor={s} inverse={inverse} large={!inverse} className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border px-6", inverse ? "h-28 border-white/15 bg-white/[0.04] hover:border-white/35 lg:h-32" : "h-40 gap-4 border-line bg-surface hover:border-line-strong lg:h-48")} />
              </li>
            ))}
          </ul>
        </Group>
      )}
      {partners.length > 0 && (
        <Group title="Samarbeidspartnere" inverse={inverse} className={cn(main.length > 0 && "mt-10 border-t pt-10 lg:mt-12 lg:pt-12", main.length > 0 && (inverse ? "border-white/10" : "border-line"))}>
          <ul className="flex flex-wrap items-start gap-x-10 gap-y-8 lg:gap-x-14">
            {partners.map((s) => (
              <li key={s.name}>
                <Backer sponsor={s} inverse={inverse} className="flex flex-col items-start gap-3" />
              </li>
            ))}
          </ul>
        </Group>
      )}
    </div>
  );
}

/** A heading in the left column and the logos at the right, as the old strip had them; stacked on a phone. */
function Group({ title, text, inverse, className, children }: { title: string; text?: string; inverse: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid-page items-start gap-y-6", className)}>
      <div className="col-span-4 md:col-span-8 lg:col-span-3">
        <h2 className={cn("t-small font-medium", inverse ? "text-white" : "text-ink")}>{title}</h2>
        {text && <p className={cn("t-small", inverse ? "text-white/60" : "text-ink-3")}>{text}</p>}
      </div>
      <div className="col-span-4 md:col-span-8 lg:col-span-9">{children}</div>
    </div>
  );
}

/** One logo, linked to the partner's site when it has one, with what they are to the club under it (unless that only repeats the group's name). */
function Backer({ sponsor: s, inverse, large, className }: { sponsor: Sponsor; inverse: boolean; large?: boolean; className?: string }) {
  const caption = s.kind && !(s.tier === "main" && /^hovedsponsor$/i.test(s.kind)) ? s.kind : undefined;
  const content = (
    <>
      <SponsorLogo name={s.name} size={large ? "lg" : "md"} />
      {caption && <span className={cn("t-small", inverse ? "text-white/60" : "text-ink-3")}>{caption}</span>}
    </>
  );
  const tint = inverse ? "text-white/70 hover:text-white" : "text-ink-2 hover:text-ink";
  const base = cn("transition-colors duration-200", tint, className);
  return s.url ? (
    <a href={s.url} target="_blank" rel="noopener" aria-label={`${s.name}${s.kind ? `, ${s.kind}` : ""}, åpnes på ny side`} className={cn("focus-visible:outline-2 focus-visible:outline-offset-4", base)}>
      {content}
    </a>
  ) : (
    <div className={base}>{content}</div>
  );
}
