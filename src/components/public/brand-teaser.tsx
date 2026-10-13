import Image from "next/image";
import bocWhite from "@/components/assets/BOC-white.png";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";

/**
 * A pointer from «Om klubben» to the brand guidelines (/brand): logo, colours,
 * type, imagery and examples of use, for members, sponsors and anyone making
 * material for the club. BOC only, since /brand shows BOC's own identity.
 * The slants are the same -21.25 degrees as the hero's and the page guides.
 */
export function BrandTeaser() {
  return (
    <Section labelledBy="merkevare-tittel" tone="inverse" rule="top" className="relative overflow-hidden py-20 lg:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-[6%] hidden gap-5 lg:flex">
        {[0, 1, 2].map((i) => (
          <span key={i} className="block h-full w-7 bg-club-surface" style={{ transform: "skewX(-21.25deg)" }} />
        ))}
      </div>
      <div className="page relative grid-page gap-y-8">
        <div className="col-span-4 md:col-span-8 lg:col-span-3">
          <p className="t-eyebrow !text-[var(--club-primary)]">Merkevare</p>
          <h2 id="merkevare-tittel" className="mt-3 t-h2">
            Slik ser BOC ut.
          </h2>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-4">
          <Image src={bocWhite} alt="" className="h-7 w-auto" />
          <p className="mt-6 max-w-[52ch] t-body-lg text-white/80">
            Logo, farger, skrift, bilder og mønster, med eksempler på bruk i sosiale medier, på trykk og på drakten. Lag gjerne noe for klubben? Start her.
          </p>
          <ButtonLink href="/brand" variant="inverse" arrow className="mt-8 sm:w-auto">
            Se merkevaren
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
