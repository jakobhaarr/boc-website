import { Status } from "@/components/ui/primitives";
import type { TestimonialView } from "@/lib/content";
import { Portrait } from "./people";

/**
 * Member quotes: what it is like to ride with the club, in a member's own
 * words, signed with first name, age, groups and portrait (initials until
 * the member has a portrait they have agreed to show). A placeholder quote
 * carries an «Eksempel» tag, so it is never read as a real member's words.
 * Three across from lg; a row that scrolls sideways below it.
 */
export function Testimonials({ items }: { items: TestimonialView[] }) {
  return (
    <ul className="scroll-x -mx-[var(--page-gutter)] flex snap-x snap-mandatory scroll-px-[var(--page-gutter)] gap-4 px-[var(--page-gutter)] lg:mx-0 lg:grid lg:scroll-px-0 lg:grid-cols-3 lg:gap-[var(--grid-gap)] lg:px-0">
      {items.map((t) => (
        <li key={t.id} className="w-[min(20rem,82vw)] shrink-0 snap-start lg:w-auto">
          <figure className="flex h-full flex-col rounded-xl bg-surface p-6 shadow-card ring-1 ring-line">
            {t.example && (
              <Status tone="warning" className="mb-4 self-start">
                Eksempel
              </Status>
            )}
            <blockquote className="flex-1 font-display text-[1.25rem] leading-[1.35] font-medium tracking-[-0.015em] text-ink">
              <span aria-hidden className="text-club">«</span>
              {t.quote}
              <span aria-hidden className="text-club">»</span>
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <Portrait name={t.firstName} photo={t.photo} size={48} />
              <span className="min-w-0">
                <span className="block t-label font-semibold text-ink">
                  {t.firstName}
                  {t.age !== undefined && <span className="font-normal text-ink-3">, {t.age} år</span>}
                </span>
                {t.groups.length > 0 && <span className="block truncate t-small text-ink-3">{t.groups.join(" · ")}</span>}
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
