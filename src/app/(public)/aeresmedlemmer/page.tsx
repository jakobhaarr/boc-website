import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/guides";
import { Breadcrumb, TextLink } from "@/components/ui/primitives";
import { honoraryMembers } from "@/lib/honorary-members";
import { loadSite } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Æresmedlemmer",
  description: "Æresmedlemmene i Bærum og Omegn Cykleklubb: personer årsmøtet har hedret for en særlig innsats for klubben.",
};

const initials = (name: string) => {
  const parts = name.split(/\s+/);
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`;
};

/** A laurel wreath around a star, drawn in the club's accent colour: nine leaves a side along an arc. */
function Wreath({ className }: { className?: string }) {
  const leaves = Array.from({ length: 9 }, (_, i) => i);
  return (
    <svg aria-hidden viewBox="0 0 200 200" className={className} fill="none">
      {[1, -1].map((side) => (
        <g key={side} transform={side === 1 ? undefined : "translate(200 0) scale(-1 1)"}>
          {leaves.map((i) => {
            const angle = 100 + i * 17; // degrees along the left half of the wreath, from the top round to the bottom
            const rad = (angle * Math.PI) / 180;
            const x = 100 + 78 * Math.cos(rad);
            const y = 100 + 78 * Math.sin(rad);
            return (
              <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle + 180}) scale(1.25)`}>
                <path d="M0 0 C 6 -9 20 -9 28 0 C 20 9 6 9 0 0 Z" fill="var(--header-link)" opacity={0.55 + i * 0.05} />
              </g>
            );
          })}
        </g>
      ))}
      <path d="M100 70 l8.3 16.8 18.5 2.7 -13.4 13 3.2 18.4 -16.6 -8.7 -16.6 8.7 3.2 -18.4 -13.4 -13 18.5 -2.7 Z" fill="var(--header-link)" />
    </svg>
  );
}

/** The club's honorary members (lib/honorary-members.ts), linked from the footer. */
export default async function HonoraryPage() {
  const { db } = await loadSite();
  const members = honoraryMembers(db.club.id, db.people);
  if (!members.length) notFound();
  return (
    <>
      <section className="relative overflow-hidden bg-[var(--header-bg)] text-[var(--header-text,#fff)]">
        <div className="page relative pt-6 pb-14 lg:pt-10 lg:pb-20">
          <Breadcrumb tone="inverse" items={[{ label: db.club.name, href: "/" }, { label: "Om klubben", href: "/om-klubben" }, { label: "Æresmedlemmer" }]} />
          <div className="mt-10 flex flex-col items-start gap-8 lg:mt-14 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[56ch]">
              <p className="t-eyebrow text-[var(--header-link)]">Om klubben</p>
              <h1 className="mt-3 t-h1">Æresmedlemmer</h1>
              <p className="mt-4 t-body opacity-80">
                Æresmedlemskap er klubbens høyeste utmerkelse. Årsmøtet gir det til personer som har lagt ned en særlig innsats for BOC, og som har gjort klubben til det den er i
                dag. Takk for alt dere har gjort.
              </p>
              <p className="mt-6 inline-flex items-baseline gap-2">
                <span className="text-[2.5rem] leading-none font-semibold tnum text-[var(--header-link)]">{members.length}</span>
                <span className="t-small opacity-80">æresmedlemmer</span>
              </p>
            </div>
            <Wreath className="anim-fade size-48 shrink-0 self-center sm:size-56 lg:size-72" />
          </div>
        </div>
      </section>
      <Section className="pt-10 pb-20 lg:pt-14 lg:pb-28">
        <div className="page">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m, i) => (
              <li
                key={m.name}
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                className="anim-rise relative flex items-center gap-4 overflow-hidden rounded-lg border border-line bg-surface p-4 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-[var(--header-link)]"
              >
                <span
                  aria-hidden
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--header-bg)] text-[1.05rem] font-semibold tracking-wide text-[var(--header-link)] ring-2 ring-[var(--header-link)] ring-offset-2 ring-offset-surface"
                >
                  {initials(m.name)}
                </span>
                <span className="min-w-0">
                  <span className="block t-h4">{m.name}</span>
                  <span className="mt-0.5 block t-small text-ink-3">{m.year ? `Æresmedlem siden ${m.year}` : "Æresmedlem"}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <TextLink href="/%C3%A5rsm%C3%B8ter" className="t-small">
              Se årsmøtene
            </TextLink>
          </p>
        </div>
      </Section>
    </>
  );
}
