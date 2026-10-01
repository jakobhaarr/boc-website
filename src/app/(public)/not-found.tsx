import Image from "next/image";
import photo from "@/components/assets/boc-404.jpg";
import { NotFoundSuggestions } from "@/components/public/not-found-suggestions";
import { ButtonLink } from "@/components/ui/button";
import { loadSite } from "@/lib/data/queries";
import { youthExplorer } from "@/lib/finder";
import { buildSearchIndex } from "@/lib/search";

/**
 * The page for an address that leads nowhere. It keeps the site's header and
 * footer (it sits inside the public layout), says what likely happened in
 * plain words (an old link, or a group that was renamed), offers the two
 * ways forward most people want, and suggests pages that share words with
 * the address they tried (NotFoundSuggestions). A club that only cycles gets a
 * cycling joke and a photo of two riders at a sign that reads «Calle 404».
 */
export default async function NotFound() {
  const { db, org, today } = await loadSite();
  const hasYouth = youthExplorer(db, org, today).youth.length > 0;
  const entries = buildSearchIndex(db, org, { hasYouth });
  // A club that only does cycling gets a cycling joke; every other club keeps the plain wording.
  const sports = org.sports();
  const cycling = sports.length === 1 && /sykkel/i.test(sports[0].name);
  const quick = entries.filter((e) => ["bli-med", "aktiviteter", "nyheter", "om-klubben"].includes(e.id));

  return (
    <div className="page py-12 lg:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] lg:gap-16">
        <div className="lg:order-1">
          <h1 className="t-h1">{cycling ? "Her har du syklet deg vill" : "Vi fant ikke siden"}</h1>
          <p className="mt-4 max-w-[48ch] t-body text-ink-2">
            {cycling ? "Siden du leter etter finnes ikke, eller den har fått nytt navn. " : "Lenken kan være gammel, eller gruppen kan ha fått nytt navn. "}
            {cycling ? "Ta en U-sving, bruk søket øverst på siden, eller sykle videre herfra." : "Prøv søket øverst på siden, eller gå videre herfra."}
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <ButtonLink href="/" brand>
              Til forsiden
            </ButtonLink>
            <ButtonLink href="/#finn-gruppen" variant="secondary" brand slant="both">
              Finn gruppen for deg
            </ButtonLink>
          </div>
        </div>
        {cycling && (
          <div className="overflow-hidden rounded-lg bg-sunken lg:order-2">
            <Image
              src={photo}
              alt="To syklister i BOC-drakt ved et veiskilt der det står Calle 404"
              sizes="(min-width: 1024px) 512px, 100vw"
              placeholder="blur"
              priority
              className="aspect-[4/3] w-full object-cover object-[50%_58%] lg:aspect-[4/5]"
            />
          </div>
        )}
      </div>

      <NotFoundSuggestions entries={entries} />

      {quick.length > 0 && (
        <nav aria-label="Vanlige sider" className="mt-12 flex flex-wrap gap-x-6 gap-y-2 t-small">
          {quick.map((e) => (
            <a key={e.id} href={e.href} className="font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-current">
              {e.title}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
