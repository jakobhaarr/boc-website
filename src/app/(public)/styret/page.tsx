import type { Metadata } from "next";
import { BoardMember } from "@/components/public/people";
import { Section } from "@/components/ui/guides";
import { Breadcrumb } from "@/components/ui/primitives";
import { fullName, membershipTitle } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import type { MembershipRole } from "@/lib/types";

export const metadata: Metadata = { title: "Styret" };

const CARD_GRID = "mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

/**
 * Styret, valgt av årsmøtet, plus the two committees the annual meeting also
 * elects. All three are memberships on the org root rather than any group —
 * boardChair/generalManager for styret itself, volunteer (with the title the
 * annual meeting gave the seat) for the committees, since contactsFor's
 * staffRoles deliberately leaves "volunteer" out of every group's public
 * contact list.
 */
export default async function BoardPage() {
  const { db, org } = await loadSite();
  const { club } = db;

  const membersWith = (roles: MembershipRole[], title?: string) =>
    db.people.flatMap((p) =>
      p.memberships
        .filter((m) => m.nodeId === org.root.id && roles.includes(m.role) && (!title || m.title === title))
        .map((m) => ({ person: p, membership: m })),
    );

  const board = membersWith(["boardChair", "generalManager"]);
  const controlCommittee = membersWith(["volunteer"], "Kontrollutvalget");
  const electionCommittee = membersWith(["volunteer"], "Valgkomité");

  const cards = (list: typeof board) =>
    list.map(({ person, membership }) => (
      <BoardMember
        key={`${person.id}-${membership.nodeId}-${membership.title}`}
        name={fullName(person)}
        title={membershipTitle(membership.role, membership.title)}
        phone={person.publicContact?.phone}
        email={person.publicContact?.email}
      />
    ));

  return (
    <>
      <Section className="pb-14 lg:pb-20">
        <div className="page pt-6 lg:pt-10">
          <Breadcrumb items={[{ label: club.name, href: "/" }, { label: "Styret" }]} />
          <div className="mt-8 max-w-[62ch]">
            <p className="t-eyebrow">Om klubben</p>
            <h1 className="mt-3 t-h1">Styret i {club.name}</h1>
            <p className="mt-4 t-body text-ink-2">
              Styret drives av frivillige og velges av årsmøtet. Har du noe du vil ta opp, kan du nå styret på{" "}
              <a href={`mailto:${club.email}`} className="link">
                {club.email}
              </a>
              .
            </p>
          </div>
          <div className={CARD_GRID}>{cards(board)}</div>
        </div>
      </Section>

      {controlCommittee.length > 0 && (
        <Section labelledBy="kontrollutvalget" tone="sunken" rule="top" className="py-20 lg:py-28">
          <div className="page">
            <p className="t-eyebrow">Tillitsvalgte</p>
            <h2 id="kontrollutvalget" className="mt-3 t-h2">
              Kontrollutvalget
            </h2>
            <div className={CARD_GRID}>{cards(controlCommittee)}</div>
          </div>
        </Section>
      )}

      {electionCommittee.length > 0 && (
        <Section labelledBy="valgkomite" rule="top" className="py-20 lg:py-28">
          <div className="page">
            <p className="t-eyebrow">Tillitsvalgte</p>
            <h2 id="valgkomite" className="mt-3 t-h2">
              Valgkomité
            </h2>
            <div className={CARD_GRID}>{cards(electionCommittee)}</div>
          </div>
        </Section>
      )}
    </>
  );
}
