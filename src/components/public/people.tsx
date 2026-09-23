import { Mail, Phone } from "lucide-react";
import { Photo } from "@/components/public/photo";
import { HoverArrow } from "@/components/ui/button";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { WEEKDAYS_SHORT, formatDayMonth, formatTimeRange, weekdayName } from "@/lib/dates";
import type { Photo as PhotoRecord } from "@/lib/types";
import type { SessionView } from "@/lib/views";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** A person's round portrait, or their initials until the club has one they may show. */
export function Portrait({ name, photo, size = 40, className }: { name: string; photo?: PhotoRecord; size?: 40 | 48 | 64 | 96; className?: string }) {
  if (!photo) {
    if (size !== 96) return <Avatar name={name} size={size} className={className} />;
    return (
      <span
        aria-hidden
        style={{ width: size, height: size }}
        className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-club-surface font-display text-[2rem] font-medium tracking-tight text-on-club", className)}
      >
        {initials(name)}
      </span>
    );
  }
  return (
    <span className={cn("block shrink-0 overflow-hidden rounded-full", className)} style={{ width: size, height: size }}>
      <Photo photo={photo} ratio={1} sizes={`${size * 2}px`} grade={false} className="size-full" />
    </span>
  );
}

/**
 * The person who presents a group, given room of their own at the top of its
 * page: a large portrait, their name and role, and a direct way to reach
 * them. A new rider or a parent is joining people, not a timetable, and this
 * is the person they will meet first.
 */
export function GroupLead({
  name,
  title,
  photo,
  phone,
  email,
  contactsHref,
  className,
}: {
  name: string;
  title: string;
  photo?: PhotoRecord;
  phone?: string;
  email?: string;
  contactsHref: string;
  className?: string;
}) {
  return (
    <div className={cn("relative isolate flex items-center gap-5 p-4 pr-16 [filter:drop-shadow(0_1px_2px_rgb(13_26_43/0.06))] sm:gap-6 sm:p-5 sm:pr-16", className)}>
      {/* Square on the left and cut on the right like the buttons: the same
          diagonal, 0.4 across for each unit down. The cut is a strip whose
          width follows the box's height (aspect-ratio 2/5), so the angle holds
          however tall the text makes the box. */}
      <div aria-hidden className="absolute inset-0 -z-10 flex">
        <div className="flex-1 border-y border-l border-line bg-surface" />
        <svg viewBox="0 0 2 5" preserveAspectRatio="none" className="aspect-[2/5] h-full shrink-0">
          <polygon points="0,0 2,0 0,5" className="fill-[var(--surface)]" />
          {/* The top edge sits on the svg's edge, so half of a 2px stroke shows: 1px, like the border it continues. */}
          <line x1="0" y1="0" x2="2" y2="0" vectorEffect="non-scaling-stroke" strokeWidth="2" className="stroke-[var(--border)]" />
          <line x1="2" y1="0" x2="0" y2="5" vectorEffect="non-scaling-stroke" strokeWidth="1" className="stroke-[var(--border)]" />
        </svg>
      </div>
      <Portrait name={name} photo={photo} size={96} />
      <div className="min-w-0">
        <p className="t-eyebrow">{title}</p>
        <p className="mt-1 t-h3">{name}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 t-small">
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 font-medium text-ink-2 tnum transition-colors hover:text-club">
              <Phone aria-hidden className="size-3.5 text-ink-3" />
              {phone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 font-medium text-ink-2 transition-colors hover:text-club">
              <Mail aria-hidden className="size-3.5 text-ink-3" />
              Send e-post
            </a>
          )}
          <a href={contactsHref} className="inline-flex items-center font-medium text-club hover:text-club-hover">
            Alle kontakter
            <HoverArrow />
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * The members of an adult group, one tile each: portrait or initials, and a
 * first name. Only people who are visible and 18 or older are passed in (see
 * the group page), and a portrait only appears with photo consent — the rest
 * are their initials, so a missing yes never leaves a gap.
 */
export function MemberGrid({ members }: { members: { id: string; name: string; photo?: PhotoRecord }[] }) {
  return (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5">
      {members.map((m) => (
        <li key={m.id} className="min-w-0">
          {m.photo ? (
            <Photo photo={m.photo} ratio={1} sizes="(min-width: 1024px) 160px, 33vw" grade={false} className="rounded-md" />
          ) : (
            <span aria-hidden className="flex aspect-square items-center justify-center rounded-md bg-club-tint font-display text-[1.75rem] font-medium tracking-tight text-club">
              {initials(m.name)}
            </span>
          )}
          <p className="mt-2 truncate t-small font-medium text-ink">{m.name}</p>
        </li>
      ))}
    </ul>
  );
}

/* ─── ContactPerson ───────────────────────────────────────────────────── */

export function ContactPerson({
  name,
  title,
  phone,
  email,
  note,
  photo,
  className,
}: {
  name: string;
  title: string;
  phone?: string;
  email?: string;
  note?: string;
  photo?: PhotoRecord;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3.5 py-3.5", className)}>
      <Portrait name={name} photo={photo} size={40} />
      <div className="min-w-0">
        <p className="text-[15px] leading-snug font-semibold text-ink">{name}</p>
        <p className="t-small text-ink-3">
          {title}
          {note && <span className="text-ink-3"> · {note}</span>}
        </p>
        {(phone || email) && (
          <div className="mt-1.5 flex flex-col gap-1 t-small">
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-ink-2 tnum transition-colors hover:text-club">
                <Phone aria-hidden className="size-3.5 text-ink-3" />
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-2 text-ink-2 transition-colors hover:text-club">
                <Mail aria-hidden className="size-3.5 shrink-0 text-ink-3" />
                <span className="truncate">{email}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── TrainingSchedule ────────────────────────────────────────────────── */

/** Week strip for at-a-glance rhythm, followed by the sessions themselves. */
export function TrainingSchedule({ sessions, empty }: { sessions: SessionView[]; empty: string }) {
  if (sessions.length === 0) {
    return <p className="border-y border-line py-4 t-small text-ink-2">{empty}</p>;
  }
  const days = new Set(sessions.map((s) => s.weekday));
  return (
    <div>
      <div aria-hidden className="grid grid-cols-7 gap-1">
        {WEEKDAYS_SHORT.map((d, i) => (
          <div
            key={d}
            className={cn(
              "flex h-8 items-center justify-center rounded-sm t-meta capitalize",
              days.has(i + 1) ? "bg-club-surface text-on-club" : "bg-sunken text-ink-3",
            )}
          >
            {d}
          </div>
        ))}
      </div>
      <ul className="mt-4 border-t border-line">
        {sessions.map((s) => (
          <li key={s.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-0.5 border-b border-line py-3 sm:grid-cols-[7.5rem_7rem_minmax(0,1fr)]">
            <span className="t-small font-semibold text-ink capitalize">{weekdayName(s.weekday, true)}</span>
            <span className="t-small text-ink tnum">{formatTimeRange(s.start, s.end, s.startApprox)}</span>
            <span className="col-span-2 t-small text-ink-2 sm:col-span-1">
              {s.place}
              {(s.note || s.shared) && <span className="block text-ink-3">{[s.note, s.shared].filter(Boolean).join(" · ")}</span>}
              {s.cancelledNext && (
                <span className="block text-danger">Avlyst {formatDayMonth(s.cancelledNext)}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
