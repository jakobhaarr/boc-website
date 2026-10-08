import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Blocks } from "@/components/public/blocks";
import { StipendCertificate } from "@/components/public/stipend-certificate";
import { SplitSection } from "@/components/public/node/shared";
import { ExternalButton } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { Breadcrumb } from "@/components/ui/primitives";
import { slugify } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";

type Props = { params: Promise<{ slug: string }> };

async function findPage(slug: string) {
  const { db } = await loadSite();
  return { club: db.club, photos: db.photos, page: db.club.pages?.find((p) => p.slug === slug) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await findPage((await params).slug);
  return page ? { title: page.title, description: page.lead } : {};
}

/**
 * One of the club's information pages (Club.pages): the police certificate
 * guide, the sports grant. The club's own words, a lead and an action at the
 * top, then one section per part, set like the group pages.
 */
export default async function InfoPageRoute({ params }: Props) {
  const { club, photos, page } = await findPage((await params).slug);
  if (!page) notFound();

  return (
    <>
      <Section className="pb-12 lg:pb-16">
        <div className="page pt-6 lg:pt-10">
          <Breadcrumb items={[{ label: club.name, href: "/" }, { label: "Om klubben", href: "/om-klubben" }, { label: page.navLabel }]} />
          <div className={page.illustration ? "mt-8 grid items-center gap-x-[var(--grid-gap)] gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]" : "mt-8"}>
          <div className="max-w-[64ch]">
            {page.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={page.logo.src}
                width={page.logo.width}
                height={page.logo.height}
                alt={page.logo.alt}
                className="mb-6 h-10 w-auto [:root[data-theme=dark]_&]:brightness-0 [:root[data-theme=dark]_&]:invert"
              />
            )}
            <p className="t-eyebrow">{page.eyebrow}</p>
            <h1 className="mt-3 t-h1">{page.title}</h1>
            <p className="mt-5 t-body-lg text-ink-2">{page.lead}</p>
            {page.action && (
              <ExternalButton href={page.action.href} size="lg" brand arrow className="mt-8">
                {page.action.label}
              </ExternalButton>
            )}
          </div>
          {page.illustration?.kind === "stipend" && <StipendCertificate club={club.shortName} amount={page.illustration.amount} />}
          </div>
        </div>
      </Section>
      {page.sections.map((s) => (
        <SplitSection key={s.title} id={s.id ?? slugify(s.title)} eyebrow={s.eyebrow} title={s.title}>
          <Blocks blocks={s.blocks} photos={photos} />
        </SplitSection>
      ))}
    </>
  );
}
