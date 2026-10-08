import type { Metadata } from "next";
import { AnnualMeetingCard } from "@/components/public/annual-meetings";
import { Section } from "@/components/ui/guides";
import { Breadcrumb } from "@/components/ui/primitives";
import { loadSite } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Årsmøter",
  description: "Sakspapirer og protokoller fra årsmøtene i Bærum og Omegn Cykleklubb, med det som ble vedtatt og hvem som ble valgt til styret.",
};

/**
 * The annual meetings (Club.annualMeetings): for each year the papers and the minutes the club has published, the
 * decisions that matter outside the room and the board that was elected. The two documents open where the club keeps them.
 */
export default async function AnnualMeetingsPage() {
  const { db } = await loadSite();
  const club = db.club;
  const meetings = club.annualMeetings ?? [];

  return (
    <>
      <Section className="pb-14 lg:pb-20">
        <div className="page pt-6 lg:pt-10">
          <Breadcrumb items={[{ label: club.name, href: "/" }, { label: "Styret", href: "/styret" }, { label: "Årsmøter" }]} />
          <div className="mt-8 max-w-[62ch]">
            <p className="t-eyebrow">Om klubben</p>
            <h1 className="mt-3 t-h1">Årsmøtene i {club.shortName}</h1>
            <p className="mt-4 t-body text-ink-2">
              Årsmøtet er klubbens øverste organ. Her er sakspapirene og protokollene fra de siste årsmøtene, med det som ble vedtatt og hvem som ble valgt til styret. Har du spørsmål, kan du skrive til{" "}
              <a href={`mailto:${club.email}`} className="link">
                {club.email}
              </a>
              .
            </p>
          </div>
        </div>
      </Section>
      <Section rule="top" className="pb-20 lg:pb-28">
        <div className="page grid gap-14 pt-10">
          {meetings.length === 0 ? <p className="t-body text-ink-2">Årsmøtene er ikke lagt ut ennå.</p> : meetings.map((m) => <AnnualMeetingCard key={m.year} meeting={m} />)}
        </div>
      </Section>
    </>
  );
}
