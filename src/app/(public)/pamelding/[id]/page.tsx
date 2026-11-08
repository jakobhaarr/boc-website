import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SignupForm } from "@/components/public/signup-form";
import { Section } from "@/components/ui/guides";
import { Breadcrumb } from "@/components/ui/primitives";
import { loadSite } from "@/lib/data/queries";
import { formatDateFull } from "@/lib/dates";
import { isFull, signupState } from "@/lib/signups";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { db } = await loadSite();
  const s = db.signups.find((x) => x.id === id && x.kind === "form");
  return s ? { title: s.title, description: s.summary } : {};
}

/** The page for a sign-up form made in admin (Påmeldinger). A banner-only sign-up has no page; an archived or closed form says it is finished. */
export default async function SignupPage({ params }: Props) {
  const { id } = await params;
  const { db, today } = await loadSite();
  const s = db.signups.find((x) => x.id === id && x.kind === "form");
  if (!s) notFound();
  const state = signupState(s, today);
  const full = isFull(db, s);
  const open = state === "open" && !full;
  return (
    <Section className="pb-20 lg:pb-28">
      <div className="page pt-6 lg:pt-10">
        <Breadcrumb items={[{ label: db.club.name, href: "/" }, { label: "Påmelding" }]} />
        <div className="mt-8 max-w-[62ch]">
          <p className="t-eyebrow">Påmelding{s.closesOn && open ? ` · frist ${formatDateFull(s.closesOn)}` : ""}</p>
          <h1 className="mt-3 t-h1">{s.title}</h1>
          <p className="mt-4 whitespace-pre-line t-body text-ink-2">{s.summary}</p>
          <div className="mt-8">
            {open ? (
              <SignupForm signupId={s.id} title={s.title} />
            ) : (
              <p role="status" className="rounded-lg bg-sunken p-5 t-body text-ink-2">
                {state === "upcoming" ? `Påmeldingen åpner ${s.opensOn ? formatDateFull(s.opensOn) : "senere"}.` : full && state === "open" ? "Påmeldingen er full. Ta kontakt med klubben." : "Påmeldingen er avsluttet."}
              </p>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
