import { Bike } from "lucide-react";
import { formatDayMonth } from "@/lib/dates";
import { BIKE_LABEL, ROOM_LABEL, type PublicSignupRow } from "@/lib/trip-signup";

/** Who has signed up, for everyone to see: name, dates, room, roommate and bike. No contact details (lib/trip-signup.ts, `publicSignups`). */
export function TripSignupList({ rows }: { rows: PublicSignupRow[] }) {
  if (!rows.length) return <p className="t-body text-ink-2">Ingen er påmeldt ennå.</p>;
  const range = (r: PublicSignupRow) => (r.arrival === r.departure ? formatDayMonth(r.arrival) : `${formatDayMonth(r.arrival)} til ${formatDayMonth(r.departure)}`);
  return (
    <ul className="divide-y divide-line border-y border-line">
      {rows.map((r, i) => (
        <li key={`${r.name}-${i}`} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.8fr)] sm:items-baseline">
          <span className={r.hidden ? "t-body text-ink-3" : "t-body font-medium text-ink"}>{r.name}</span>
          <span className="t-small tnum text-ink-2">{range(r)}</span>
          <span className="t-small text-ink-2">
            {ROOM_LABEL[r.room]}
            {r.shareWith ? `, med ${r.shareWith}` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 t-small text-ink-2">
            <Bike aria-hidden className="size-3.5 text-ink-3" />
            {BIKE_LABEL[r.bike]}
          </span>
        </li>
      ))}
    </ul>
  );
}
