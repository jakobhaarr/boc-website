import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { CompleteContact } from "@/components/admin/privacy-contact-actions";
import { Status } from "@/components/ui/primitives";
import { loadAdmin } from "@/lib/data/queries";
import { formatDayMonth, relativeTime } from "@/lib/dates";
import { canAnonymise } from "@/lib/permissions";
import { ON_BEHALF_LABEL, WANT_LABEL } from "@/lib/privacy-contact";
import type { PrivacyContact } from "@/lib/types";

export const metadata = { title: "Personvern" };

function Contact({ c, now }: { c: PrivacyContact; now: string }) {
  return (
    <li className="grid gap-3 px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="t-label font-semibold">{c.fromName}</span>
        <a href={`mailto:${c.fromEmail}`} className="link t-small text-ink-2">
          {c.fromEmail}
        </a>
        <span className="t-meta text-ink-3">{relativeTime(c.receivedAt, now as never)}</span>
        {c.status === "completed" && <Status tone="success">Behandlet {c.completedAt ? formatDayMonth(c.completedAt.slice(0, 10)) : ""}</Status>}
      </div>
      <dl className="grid max-w-[44rem] grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-1 t-small">
        <dt className="text-ink-3">På vegne av</dt>
        <dd>{ON_BEHALF_LABEL[c.onBehalfOf]}{c.subjectName ? `: ${c.subjectName}` : ""}</dd>
        {c.where && (
          <>
            <dt className="text-ink-3">Lag eller gruppe</dt>
            <dd>{c.where}</dd>
          </>
        )}
        <dt className="text-ink-3">Ber om</dt>
        <dd>{c.wants.map((w) => WANT_LABEL[w]).join(", ")}</dd>
        {c.message && (
          <>
            <dt className="text-ink-3">Melding</dt>
            <dd className="whitespace-pre-wrap">{c.message}</dd>
          </>
        )}
      </dl>
      {c.status === "open" && <CompleteContact id={c.id} />}
    </li>
  );
}

export default async function PrivacyContactsPage() {
  const { db, user, now } = await loadAdmin();
  if (!canAnonymise(user)) redirect("/admin");
  const open = db.privacyContacts.filter((c) => c.status === "open");
  const done = db.privacyContacts.filter((c) => c.status === "completed");

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Personvern"
        description="Henvendelser fra skjemaet under Personvern på Om klubben: innsyn, sletting og anonymisering. Sjekk at det er riktig person før du gir ut noe, og svar på e-post."
      />
      <div className="grid gap-6">
        <Panel title="Åpne henvendelser" accent={open.length ? "warning" : 2}>
          {open.length ? (
            <ul className="divide-y divide-line">
              {open.map((c) => (
                <Contact key={c.id} c={c} now={now} />
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 t-small text-ink-2">Ingen åpne henvendelser.</p>
          )}
        </Panel>
        <p className="t-small text-ink-2">
          Finn personen under <Link href="/admin/personer" className="link text-ink">Medlemmer</Link>. Der kan du se hvor personen er publisert, anonymisere og slette fra registeret.
        </p>
        {done.length > 0 && (
          <Panel title="Behandlet">
            <ul className="divide-y divide-line">
              {done.map((c) => (
                <Contact key={c.id} c={c} now={now} />
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
