import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { SignupManager, type SignupRowView } from "@/components/admin/signup-manager";
import { loadAdmin } from "@/lib/data/queries";
import { formatDateFull } from "@/lib/dates";
import { canManageSignups, canSeeSignups } from "@/lib/permissions";
import { isFull, responsesOf, signupState, SIGNUP_STATE_LABEL } from "@/lib/signups";
import { allSignups } from "@/lib/trip-sheet";
import { TRIP } from "@/lib/trip-signup";

export const metadata = { title: "Påmeldinger" };

/**
 * The club's sign-ups: the Mallorca trip (its own list, /admin/mallorca) and the ones made here, as a form on the site or only a
 * banner that sends on to Spond. Made and changed by whoever runs the groups of the whole club (`canManageSignups`).
 */
export default async function SignupsPage() {
  const { db, org, user, today } = await loadAdmin();
  const manage = canManageSignups(user, org);
  const mallorca = canSeeSignups(user, org);
  if (!manage && !mallorca) redirect("/admin");

  const label = (id: string) => org.trail(id).slice(1).map((n) => n.name).join(" › ");
  const rows: SignupRowView[] = manage
    ? [...db.signups]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((s) => {
          const state = signupState(s, today);
          const answers = responsesOf(db, s.id).length;
          return {
            id: s.id,
            title: s.title,
            summary: s.summary,
            kind: s.kind,
            href: s.href ?? "",
            linkLabel: s.linkLabel ?? "",
            opensOn: s.opensOn ?? "",
            closesOn: s.closesOn ?? "",
            capacity: s.capacity ? String(s.capacity) : "",
            onFront: s.onFront,
            nodeIds: s.nodeIds.filter((id) => org.get(id)),
            archived: !!s.archived,
            stateLabel: state === "open" && isFull(db, s) ? "Full" : SIGNUP_STATE_LABEL[state],
            stateTone: state === "open" && !isFull(db, s) ? "success" : state === "upcoming" ? "warning" : "neutral",
            placeLabels: [...(s.onFront ? ["Forsiden"] : []), ...s.nodeIds.flatMap((id) => (org.get(id) ? [org.get(id)!.name] : []))],
            responses: answers,
            responsesLabel: s.capacity ? `${answers} av ${s.capacity}` : String(answers),
          };
        })
    : [];

  const groups = org.nodes.filter((n) => n.kind !== "club").map((n) => ({ id: n.id, label: label(n.id) })).sort((a, b) => a.label.localeCompare(b.label, "nb"));
  const trip = mallorca ? await allSignups(db) : [];

  return (
    <div className="page pb-16">
      <AdminHeader title="Påmeldinger" description="Lag påmeldinger som skjema på nettsiden, eller bare et banner som sender folk videre til Spond. Når en påmelding er ferdig, arkiverer du den: den ligger igjen med svarene, men vises ikke lenger på nettsiden." />
      <SignupManager
        rows={rows}
        groups={groups}
        mallorca={mallorca ? { stateLabel: TRIP.open ? "Åpen" : "Stengt", summary: `${formatDateFull(TRIP.from)} til ${formatDateFull(TRIP.to)}. ${trip.length} påmeldt.` } : undefined}
      />
    </div>
  );
}
