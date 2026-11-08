import { Section } from "@/components/ui/guides";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { formatDateFull } from "@/lib/dates";
import type { Signup } from "@/lib/types";

/**
 * The banners for the sign-ups made in admin (Påmeldinger), one band each: the front page and the group pages show those placed
 * there (lib/signups.ts). A form sends to /pamelding/[id]; a banner only sends on to its own link, usually Spond. `full` holds the
 * ids of forms that have no places left.
 */
export function SignupBands({ signups, full = [] }: { signups: Signup[]; full?: string[] }) {
  if (!signups.length) return null;
  return (
    <>
      {signups.map((s) => {
        const label = s.linkLabel || "Meld deg på";
        const isFull = full.includes(s.id);
        return (
          <Section key={s.id} labelledBy={`pamelding-${s.id}`} rule="both" className="bg-club-surface py-8 lg:py-10">
            <div className="page grid-page items-center gap-y-6">
              <div className="col-span-4 md:col-span-8 lg:col-span-8">
                <p className="t-eyebrow text-on-club/70">Påmelding{s.closesOn ? ` · frist ${formatDateFull(s.closesOn)}` : ""}</p>
                <h2 id={`pamelding-${s.id}`} className="mt-2 t-h2 text-on-club">
                  {s.title}
                </h2>
                <p className="mt-3 max-w-[64ch] t-body text-on-club/80">{s.summary}</p>
              </div>
              <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:flex lg:justify-end">
                {isFull ? (
                  <p className="t-body font-medium text-on-club">Påmeldingen er full.</p>
                ) : s.kind === "form" ? (
                  <ButtonLink href={`/pamelding/${s.id}`} variant="inverse" size="lg" brand arrow className="max-sm:w-full">
                    {label}
                  </ButtonLink>
                ) : (
                  <ExternalButton href={s.href ?? "#"} variant="inverse" size="lg" brand arrow className="max-sm:w-full">
                    {label}
                  </ExternalButton>
                )}
              </div>
            </div>
          </Section>
        );
      })}
    </>
  );
}
