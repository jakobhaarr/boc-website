import { notFound, redirect } from "next/navigation";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { SignupAnswers } from "@/components/admin/signup-answers";
import { Breadcrumb } from "@/components/ui/primitives";
import { loadAdmin } from "@/lib/data/queries";
import { canManageSignups } from "@/lib/permissions";
import { responsesOf } from "@/lib/signups";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Svar på påmelding" };

/** The answers to one sign-up form, with contact details: only for those who manage sign-ups. */
export default async function SignupAnswersPage({ params }: Props) {
  const { id } = await params;
  const { db, org, user } = await loadAdmin();
  if (!canManageSignups(user, org)) redirect("/admin");
  const signup = db.signups.find((s) => s.id === id);
  if (!signup) notFound();
  const rows = responsesOf(db, id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone ?? "", note: r.note ?? "", at: r.createdAt.replace("T", " ") }));
  return (
    <div className="page pb-16">
      <Breadcrumb className="pt-6 md:pt-8" items={[{ label: "Påmeldinger", href: "/admin/pameldinger" }, { label: signup.title }]} />
      <AdminHeader title={signup.title} description={`${rows.length}${signup.capacity ? ` av ${signup.capacity}` : ""} har meldt seg på. Bare de som styrer påmeldingene ser kontaktopplysningene.`} />
      <Panel title="Svar">
        <SignupAnswers rows={rows} />
      </Panel>
    </div>
  );
}
