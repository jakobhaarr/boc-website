import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReportActions } from "@/components/admin/report-actions";
import { ReportRow, ReportSection } from "@/components/admin/report-parts";
import { Breadcrumb } from "@/components/ui/primitives";
import { fullName } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { formatDateFull } from "@/lib/dates";
import { canAnonymise } from "@/lib/permissions";
import { buildPersonReport } from "@/lib/privacy-report";

export const metadata: Metadata = { title: "Innsynsrapport" };

const day = (iso?: string) => (iso ? formatDateFull(iso.slice(0, 10)) : undefined);

/**
 * The access report on one person (lib/privacy-report.ts), for a club administrator to check and hand over: print it
 * or save it as a PDF, or take the same content as a data file. It is made when the page opens, from the database as
 * it is then.
 */
export default async function AccessReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, org, user, now } = await loadAdmin();
  if (!canAnonymise(user)) redirect("/admin");
  const person = db.people.find((p) => p.id === id);
  if (!person) notFound();
  const r = buildPersonReport(db, org, person, user.name, now);
  const anonymised = person.privacy.status === "anonymised";

  return (
    <div className="page privacy-report pb-20">
      <div className="no-print">
        <Breadcrumb className="pt-6 md:pt-8" items={[{ label: "Personvern-kontroll", href: "/admin/personvern-kontroll#henvendelser" }, { label: "Innsynsrapport" }]} />
      </div>
      <article className="mx-auto mt-8 grid max-w-[52rem] gap-8">
        <div className="grid gap-3">
          <p className="t-eyebrow">Innsyn etter personvernforordningen artikkel 15</p>
          <h1 className="t-h1">Hva {db.club.name} har om {anonymised ? "en anonymisert person" : fullName(person)}</h1>
          <p className="t-body text-ink-2">
            Laget {day(r.issuedAt)} av {r.issuedBy}, fra opplysningene i klubbens nettside og register på det tidspunktet. Rapporten dekker det vi har selv. Hva Spond, Google og de andre tjenestene har, står i personvernerklæringen. Spørsmål om rapporten sender du til{" "}
            <a className="link text-ink" href={`mailto:${db.club.email}`}>
              {db.club.email}
            </a>
            .
          </p>
          <ReportActions dataHref={`/admin/personer/${person.id}/innsyn/data`} />
          <p className="no-print t-small text-ink-3">Sjekk at det er riktig person som ber om innsyn før du sender rapporten. En forelder kan be om innsyn for barn. Rapporten kan inneholde navn på foresatte og andre som er nevnt sammen med personen.</p>
        </div>

        {anonymised ? (
          <ReportSection title="Anonymisert">
            <p>
              Personen er anonymisert{r.person.anonymisedAt ? ` ${day(r.person.anonymisedAt)}` : ""}. Navn og bilder er fjernet fra klubbens innhold, og det finnes ikke lenger noe i registeret som kan knyttes til personen. Bare en loggføring uten navn er igjen.
            </p>
          </ReportSection>
        ) : (
          <>
            <ReportSection title="Registeret">
              <dl className="grid gap-2">
                <ReportRow label="Navn" value={r.person.name} />
                <ReportRow label="Født" value={r.person.born} />
                <ReportRow label="Offentlig synlighet" value={r.person.status} />
                <ReportRow label="Bilder" value={`${r.person.consent}${r.person.consentUpdatedAt ? `, sist endret ${day(r.person.consentUpdatedAt)}` : ""}${r.person.consentBy ? ` (${r.person.consentBy})` : ""}`} />
                {r.person.contact.map((c) => (
                  <ReportRow key={c.label} label={c.label} value={c.value} />
                ))}
              </dl>
            </ReportSection>

            <ReportSection title="Medlemskap og roller" empty="Ingen medlemskap er registrert.">
              {r.memberships.length > 0 && (
                <ul className="list-disc pl-5">
                  {r.memberships.map((m) => (
                    <li key={`${m.group}-${m.role}`}>
                      {m.group}: {m.role}
                    </li>
                  ))}
                </ul>
              )}
            </ReportSection>

            <ReportSection title="Brukerkonto og foresatte" empty="Ingen brukerkonto og ingen foresatte er knyttet til personen.">
              {(r.account || r.guardians.length > 0 || r.guardianOf.length > 0) && (
                <dl className="grid gap-2">
                  {r.account && (
                    <>
                      <ReportRow label="Bruker" value={`${r.account.name}, ${r.account.email}`} />
                      <ReportRow label="Innlogging" value={`${r.account.signIn}${r.account.active ? "" : " (ikke aktiv)"}`} />
                      <ReportRow label="Roller i administrasjonen" value={r.account.roles.length ? r.account.roles.join(", ") : "Ingen"} />
                    </>
                  )}
                  {r.guardians.length > 0 && <ReportRow label="Foresatte" value={r.guardians.map((g) => `${g.name}${g.email ? ` (${g.email})` : ""}`).join(", ")} />}
                  {r.guardianOf.length > 0 && <ReportRow label="Foresatt for" value={r.guardianOf.join(", ")} />}
                </dl>
              )}
            </ReportSection>

            <ReportSection title={`Bilder du er merket i (${r.pictures.length})`} empty="Du er ikke merket i noen bilder.">
              {r.pictures.length > 0 && (
                <ul className="grid gap-3">
                  {r.pictures.map((p) => (
                    <li key={p.id} className="break-inside-avoid border-l-2 border-line pl-4">
                      <p className="text-ink">{p.group}</p>
                      <p className="t-small text-ink-3">
                        {[p.uploadedAt && `Lastet opp ${day(p.uploadedAt)}`, p.uploadedBy && `av ${p.uploadedBy}`, p.photographer && `Foto: ${p.photographer}`].filter(Boolean).join(" · ") || "Ingen opplysninger om opplasting"}
                      </p>
                      <p className="t-small text-ink-3">{p.hidden ? p.note : p.usedAt.length ? `Vises på: ${p.usedAt.join(", ")}` : "Vises ikke offentlig akkurat nå"}</p>
                    </li>
                  ))}
                </ul>
              )}
              {r.picturesTaken > 0 && <p>Du står oppført som fotograf på {r.picturesTaken} bilder.</p>}
              {r.portrait && <p>{r.portrait}</p>}
            </ReportSection>

            <ReportSection title={`Der navnet ditt står i tekst (${r.text.length})`} empty="Navnet ditt står ikke i publisert tekst.">
              {r.text.length > 0 && (
                <ul className="grid gap-3">
                  {r.text.map((t, i) => (
                    <li key={i} className="break-inside-avoid border-l-2 border-line pl-4">
                      <p className="t-small text-ink-3">
                        {t.where} i «{t.in}»
                      </p>
                      <p className="text-ink">{t.wording}</p>
                    </li>
                  ))}
                </ul>
              )}
            </ReportSection>

            <ReportSection title="Sitater og aktiviteter" empty="Ingen sitater eller roller i aktiviteter.">
              {(r.quotes.length > 0 || r.activities.length > 0) && (
                <ul className="list-disc pl-5">
                  {r.quotes.map((q, i) => (
                    <li key={`q${i}`}>
                      Sitat ({q.group}): «{q.text}»
                    </li>
                  ))}
                  {r.activities.map((a, i) => (
                    <li key={`a${i}`}>
                      {a.role}: {a.title}
                    </li>
                  ))}
                </ul>
              )}
            </ReportSection>

            <ReportSection title="Henvendelser og forespørsler" empty="Ingen henvendelser eller forespørsler om samtykke er knyttet til personen.">
              {r.requests.length > 0 && (
                <ul className="list-disc pl-5">
                  {r.requests.map((x, i) => (
                    <li key={i}>
                      {x.kind}, {day(x.at)}: {x.status}
                    </li>
                  ))}
                </ul>
              )}
            </ReportSection>

            <ReportSection title="Aktivitetslogg" empty="Ingen loggførte handlinger er knyttet til personen.">
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
          </>
        )}

        <ReportSection title="Hvem som behandler opplysningene">
          <p>
            Klubben bruker Vercel, Supabase, Resend, Spond og GitHub til å drive nettsiden og registeret, og Claude (Anthropic) til å skrive kode. Se{" "}
            <Link href="/personvern" className="link text-ink">
              personvernerklæringen
            </Link>{" "}
            for hva hver av dem ser, hvor lenge opplysningene beholdes og hva du kan be om: retting, sletting, begrensning, flytting og å nekte at du kan kjennes igjen på nettsiden.
          </p>
        </ReportSection>
      </article>
    </div>
  );
}
