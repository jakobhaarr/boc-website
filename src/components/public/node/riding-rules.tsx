import type { Org } from "@/lib/org";
import { SplitSection } from "./shared";

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
        {rules.map((r, i) => (
          <li key={r.title} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 border-t border-line py-5">
            <span className="font-display text-[1.25rem] leading-tight font-medium tracking-[-0.02em] text-club tnum">{i + 1}</span>
            <span className="min-w-0">
              <span className="block t-label font-semibold text-ink">{r.title}</span>
              <span className="mt-1 block t-small text-ink-2">{r.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </SplitSection>
  );
}
