import { SpondButton } from "@/components/public/spond-button";
import type { FirstTrainingItem } from "@/lib/first-training";

/**
 * «Før første trening»: the answers someone wants before turning up where
 * they know nobody, as one quiet list rather than an FAQ. Label over value,
 * two columns from md, hairlines between rows; «Når og hvor» first, since
 * it is what they came for. Only facts the club has given are passed in
 * (lib/first-training.ts), so the list is as long as the club has made it.
 */
export function FirstTraining({ items }: { items: FirstTrainingItem[] }) {
  return (
    <dl className="grid gap-x-[var(--grid-gap)] md:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className={item.id === "tid" ? "border-t border-line py-4 md:col-span-2" : "border-t border-line py-4"}>
          <dt className="t-meta font-semibold text-ink-3">{item.label}</dt>
          {Array.isArray(item.value) ? (
            item.value.map((line) => (
              <dd key={line} className="mt-1 t-body text-ink">
                {line}
              </dd>
            ))
          ) : (
            <dd className="mt-1 max-w-[52ch] t-body text-ink">{item.value}</dd>
          )}
          {item.action && (
            <dd className="mt-4">
              <SpondButton url={item.action.href} label={item.action.label} />
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
