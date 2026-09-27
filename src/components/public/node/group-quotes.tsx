import { Portrait } from "@/components/public/people";
import type { GroupQuoteView } from "@/lib/content";

/**
 * «Derfor sykler de her»: why people ride in this particular group, in
 * their own words. Set as type rather than cards — the quote large, the
 * person small under it — up to three side by side from lg, each over a
 * hairline, so it reads as voices from the group and not as advertising.
 */
export function GroupQuotes({ quotes }: { quotes: GroupQuoteView[] }) {
  return (
    <ul className="grid gap-x-[var(--grid-gap)] gap-y-10 md:grid-cols-2 lg:grid-cols-3">
      {quotes.map((q) => (
        <li key={q.id} className="flex flex-col border-t border-line pt-5">
          <blockquote className="t-body-lg text-ink">«{q.quote}»</blockquote>
          <p className="mt-5 flex items-center gap-3">
            <Portrait name={q.name} photo={q.photo} size={40} />
            <span className="min-w-0">
              <span className="block t-small font-semibold text-ink">{q.name}</span>
              {q.detail && <span className="block t-meta text-ink-3">{q.detail}</span>}
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}
