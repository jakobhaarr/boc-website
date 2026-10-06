import { Columns2, Droplets, Equal, Flashlight, Hand, LifeBuoy, TrafficCone, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Org } from "@/lib/org";
import type { RidingRuleIcon } from "@/lib/types";
import { SplitSection } from "./shared";

/** Lucide's icons, which keep Feather's line style: 24-grid, 2 px round strokes. */
const RIDING_RULE_ICONS: Record<RidingRuleIcon, LucideIcon> = {
  "side-by-side": Columns2,
  level: Equal,
  traffic: TrafficCone,
  light: Flashlight,
  spit: Droplets,
  hazard: TriangleAlert,
  stop: Hand,
  wait: LifeBuoy,
};

/**
 * The club's rules for riding together (OrgNode.ridingRules), on the node
 * that sets them and on every group under it — BOC's Landevei and BOC 1–4
 * all show the same list. Nothing is rendered where no ancestor has rules.
 */
export function RidingRules({ org, nodeId }: { org: Org; nodeId: string }) {
  const rules = org
    .lineage(nodeId)
    .reverse()
    .find((n) => n.ridingRules?.length)?.ridingRules;
  if (!rules) return null;

  return (
    <SplitSection id="gruppekjoring" eyebrow="Gruppekjøring" title="Slik sykler vi sammen">
      <ol className="grid gap-x-[var(--grid-gap)] sm:grid-cols-2">
        {rules.map((r, i) => {
          const Icon = r.icon && RIDING_RULE_ICONS[r.icon];
          return (
          <li key={r.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-t border-line py-5">
            {Icon ? (
              <span className="flex size-10 items-center justify-center rounded-md bg-club-tint text-club">
                <Icon aria-hidden className="size-5" strokeWidth={2} />
              </span>
            ) : (
              <span className="font-display text-[1.25rem] leading-tight font-medium tracking-[-0.012em] text-club tnum">{i + 1}</span>
            )}
            <span className="min-w-0 self-center">
              <span className="block t-label font-semibold text-ink">{r.title}</span>
              <span className="mt-1 block t-small text-ink-2">{r.text}</span>
            </span>
          </li>
          );
        })}
      </ol>
    </SplitSection>
  );
}
