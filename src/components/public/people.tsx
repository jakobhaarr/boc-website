"use client";

import { ChevronDown, Mail, Phone } from "lucide-react";
import { useState } from "react";
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
  contactsHref,
  className,
}: {
  name: string;
  title: string;
  photo?: PhotoRecord;
  phone?: string;
  contactsHref?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-5 rounded-lg border border-line bg-surface p-4 sm:gap-6 sm:p-5", className)}>
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
          {contactsHref && (
            <a href={contactsHref} className="inline-flex items-center font-medium text-club hover:text-club-hover">
            Alle kontakter
            <HoverArrow />
          </a>
          )}
        </div>
      </div>
    </div>
  );
}

/** Tiles shown before «Vis alle» — enough to fill a row or two without the page opening on a wall of faces. */
const VISIBLE_MEMBERS = 15;

/**
 * The members of an adult group, one tile each: portrait or initials, and a
 * first name. Only people who are visible and 18 or older are passed in (see
 * the group page, which also sorts portraits first), and a portrait only
 * appears with photo consent — the rest are their initials, so a missing yes
 * never leaves a gap.
 *
 * A group of more than fifteen opens on the first fifteen, «Vis alle» away
 * from the rest — mostly initials past that point, since portraits lead the
 * list. Only the expanded view (over 20, like Zwift's 62) gets smaller tiles
 * in more columns, so a small group never shrinks just for having a «Vis
 * alle» button.
 */
export function MemberGrid({ members, others = 0 }: { members: { id: string; name: string; photo?: PhotoRecord; title?: string }[]; /** Members who are not shown by name (no photo consent), as a number only. */ others?: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? members : members.slice(0, VISIBLE_MEMBERS);
  const compact = visible.length > 20;
  return (
    <>
      <ul
        className={cn(
          "grid",
          compact ? "grid-cols-4 gap-x-2 gap-y-3 sm:grid-cols-6 lg:grid-cols-8" : "grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-5",
        )}
      >
        {visible.map((m) => (
          <li key={m.id} className="min-w-0">
            {m.photo ? (
              <Photo
                photo={m.photo}
                ratio={1}
                sizes={compact ? "(min-width: 1024px) 100px, 25vw" : "(min-width: 1024px) 160px, 33vw"}
                grade={false}
                className="rounded-md"
              />
            ) : (
              <span
                aria-hidden
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md bg-club-tint font-display font-medium tracking-tight text-club",
                  compact ? "text-[1.125rem]" : "text-[1.75rem]",
                )}
              >
                {initials(m.name)}
              </span>
            )}
            <p className={cn("truncate font-medium text-ink", compact ? "mt-1.5 t-meta" : "mt-2 t-small")}>{m.name}</p>
            {m.title && <p className="truncate t-meta text-ink-3">{m.title}</p>}
          </li>
        ))}
      </ul>
      {!expanded && members.length > VISIBLE_MEMBERS && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium text-ink shadow-[inset_0_0_0_1px_var(--border)] transition-colors hover:bg-sunken"
        >
          Vis alle {members.length}
          <ChevronDown aria-hidden className="size-3.5 text-ink-3" />
        </button>
      )}
      {others > 0 && (
        <p className="mt-5 t-small text-ink-2">
          og {others} {others === 1 ? "annet medlem" : "andre medlemmer"}
        </p>
      )}
    </>
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

/**
 * A board or committee member, in its own bordered card rather than
 * ContactPerson's divided list row — the Styret page reads as a directory of
 * cards, and Om klubben reuses the same card for the board chair rather than
 * inventing a second style for the same kind of person.
 */
export function BoardMember({
  name,
  title,
  phone,
  email,
  photo,
  className,
}: {
  name: string;
  title: string;
  phone?: string;
  email?: string;
  photo?: PhotoRecord;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-line p-4", className)}>
      <Portrait name={name} photo={photo} size={48} />
      <p className="mt-3 t-label font-semibold text-ink">{name}</p>
      <p className="t-small text-ink-3">{title}</p>
      {(phone || email) && (
        <div className="mt-2 flex flex-col gap-1 t-small">
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-ink-2 tnum transition-colors hover:text-club">
              <Phone aria-hidden className="size-3.5 shrink-0 text-ink-3" />
              {phone}
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-1.5 text-ink-2 transition-colors hover:text-club">
              <Mail aria-hidden className="size-3.5 shrink-0 text-ink-3" />
              <span className="truncate">{email}</span>
            </a>
          )}
        </div>
      )}
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
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
