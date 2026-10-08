import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReportActions } from "@/components/admin/report-actions";
import { ReportRow, ReportSection } from "@/components/admin/report-parts";
import { Breadcrumb } from "@/components/ui/primitives";
import { loadAdmin } from "@/lib/data/queries";
import { formatDateFull } from "@/lib/dates";
import { canAnonymise } from "@/lib/permissions";
import { buildExternalReport, buildUserReport } from "@/lib/privacy-report";

export const metadata: Metadata = { title: "Innsynsrapport" };

const day = (iso?: string) => (iso ? formatDateFull(iso.slice(0, 10)) : undefined);

/**
 * The access report for someone who is not a person in the register: an external (a photographer) or a user (a
 * guardian), reached from a privacy message once their identity is confirmed. A person in the register has theirs at
 * /admin/personer/[id]/innsyn.
 */
export default async function OtherAccessReportPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const { db, org, user, now } = await loadAdmin();
  if (!canAnonymise(user)) redirect("/admin");
  const external = kind === "ekstern" ? db.externals.find((e) => e.id === id) : undefined;
  const subject = kind === "bruker" ? db.users.find((u) => u.id === id) : undefined;
  if (!external && !subject) notFound();
  const name = external?.name ?? subject!.name;
  const issued = `Laget ${day(now)} av ${user.name}`;

  const intro = (
    <div className="grid gap-3">
      <p className="t-eyebrow">Innsyn etter personvernforordningen artikkel 15</p>
      <h1 className="t-h1">Hva {db.club.name} har om {name}</h1>
      <p className="t-body text-ink-2">
        {issued}, fra opplysningene i klubbens nettside og register på det tidspunktet. Rapporten dekker det vi har selv. Hva Spond, Google og de andre tjenestene har, står i personvernerklæringen. Spørsmål om rapporten sender du til{" "}
        <a className="link text-ink" href={`mailto:${db.club.email}`}>
          {db.club.email}
        </a>
        .
      </p>
      <ReportActions dataHref={null} />
      <p className="no-print t-small text-ink-3">Sjekk at det er riktig person som ber om innsyn før du sender rapporten.</p>
    </div>
  );
  const processors = (
    <ReportSection title="Hvem som behandler opplysningene">
      <p>
        Klubben bruker Vercel, Supabase, Resend, Spond og GitHub til å drive nettsiden og registeret. Se{" "}
        <Link href="/personvern" className="link text-ink">
          personvernerklæringen
        </Link>{" "}
        for hva hver av dem ser og hva du kan be om: retting, sletting, begrensning, flytting og å nekte at du kan kjennes igjen på nettsiden.
      </p>
    </ReportSection>
  );

  if (external) {
    const r = buildExternalReport(db, org, external, user.name, now);
    return (
      <div className="page privacy-report pb-20">
        <div className="no-print">
          <Breadcrumb className="pt-6 md:pt-8" items={[{ label: "Personvern-kontroll", href: "/admin/personvern-kontroll#henvendelser" }, { label: "Innsynsrapport" }]} />
        </div>
        <article className="mx-auto mt-8 grid max-w-[52rem] gap-8">
          {intro}
          <ReportSection title="Det klubben har registrert">
            <dl className="grid gap-2">
              <ReportRow label="Navn" value={r.name} />
              <ReportRow label="Merknad" value={r.note} />
              <ReportRow label="Lagt inn" value={`${day(r.addedAt)}${r.addedBy ? ` av ${r.addedBy}` : ""}`} />
            </dl>
          </ReportSection>
          <ReportSection title={`Bilder der du er oppført som fotograf (${r.pictures.length})`} empty="Du er ikke oppført som fotograf på noen bilder.">
            {r.pictures.length > 0 && (
              <ul className="grid gap-3">
                {r.pictures.map((p, i) => (
                  <li key={i} className="break-inside-avoid border-l-2 border-line pl-4">
                    <p className="text-ink">{p.group}</p>
                    <p className="t-small text-ink-3">{[p.uploadedAt && `Lastet opp ${day(p.uploadedAt)}`, p.hidden ? "Skjult" : p.usedAt.length ? `Vises på: ${p.usedAt.join(", ")}` : "Vises ikke offentlig akkurat nå"].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            )}
          </ReportSection>
          {processors}
        </article>
      </div>
    );
  }

  const r = buildUserReport(db, org, subject!, user.name, now);
  return (
    <div className="page privacy-report pb-20">
      <div className="no-print">
        <Breadcrumb className="pt-6 md:pt-8" items={[{ label: "Personvern-kontroll", href: "/admin/personvern-kontroll#henvendelser" }, { label: "Innsynsrapport" }]} />
      </div>
      <article className="mx-auto mt-8 grid max-w-[52rem] gap-8">
        {intro}
        <ReportSection title="Brukerkonto">
          <dl className="grid gap-2">
            <ReportRow label="Navn" value={r.name} />
            <ReportRow label="E-post" value={r.email} />
            <ReportRow label="Innlogging" value={`${r.signIn}${r.active ? "" : " (ikke aktiv)"}`} />
            <ReportRow label="Roller i administrasjonen" value={r.roles.length ? r.roles.join(", ") : "Ingen"} />
            <ReportRow label="Foresatt for" value={r.guardianOf.length ? r.guardianOf.join(", ") : undefined} />
          </dl>
        </ReportSection>
        <ReportSection title="Innlegg og bilder" empty="Du har ikke skrevet innlegg eller lastet opp bilder.">
          {(r.articles.length > 0 || r.picturesUploaded > 0) && (
            <>
              {r.articles.length > 0 && (
                <ul className="list-disc pl-5">
                  {r.articles.map((a, i) => (
                    <li key={i}>
                      {a.title}
                      {a.published ? "" : " (ikke publisert)"}
                    </li>
                  ))}
                </ul>
              )}
              {r.picturesUploaded > 0 && <p>Du har lastet opp {r.picturesUploaded} bilder.</p>}
            </>
          )}
        </ReportSection>
        <ReportSection title="Aktivitetslogg" empty="Ingen loggførte handlinger er knyttet til deg.">
          {r.log.length > 0 && (
            <ul className="grid gap-1.5 t-small">
              {r.log.map((l, i) => (
                <li key={i}>
                  <span className="tnum text-ink-3">{l.at}</span> {l.what}
                </li>
              ))}
            </ul>
          )}
        </ReportSection>
        {processors}
      </article>
    </div>
  );
}
