import type { Metadata } from "next";
import { ArrowUpRight, FileText } from "lucide-react";
import { BylawsText } from "@/components/public/bylaws";
import { Section } from "@/components/ui/guides";
import { Breadcrumb, TextLink } from "@/components/ui/primitives";
import { loadSite } from "@/lib/data/queries";
import { formatDateFull } from "@/lib/dates";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Vedtekter",
  description: "Lov for Bærum og Omegn Cykleklubb, sist revidert på årsmøtet 11. mars 2026.",
};

/** The club's bylaws (Club.bylaws) in full, set in the site's own design; the club's PDF is one link away. */
export default async function BylawsPage() {
  const { db } = await loadSite();
  const club = db.club;
  const bylaws = club.bylaws;
  if (!bylaws) notFound();

  return (
    <>
      <Section className="pb-10 lg:pb-14">
        <div className="page pt-6 lg:pt-10">
          <Breadcrumb items={[{ label: club.name, href: "/" }, { label: "Styret", href: "/styret" }, { label: "Vedtekter" }]} />
          <div className="mt-8 max-w-[62ch]">
            <p className="t-eyebrow">Om klubben</p>
            <h1 className="mt-3 t-h1">{bylaws.title}</h1>
            <p className="mt-4 t-body text-ink-2">
              Stiftet {bylaws.founded}. Sist revidert på årsmøtet {formatDateFull(bylaws.revised)}. {bylaws.basis}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <a href={bylaws.pdf} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 t-small font-medium text-club hover:text-club-hover">
                <FileText aria-hidden className="size-4" />
                Last ned som PDF
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
              <TextLink href="/%C3%A5rsm%C3%B8ter" className="t-small">
                Se årsmøtene
              </TextLink>
            </div>
          </div>
        </div>
      </Section>
      <Section rule="top" className="pb-20 lg:pb-28">
        <BylawsText bylaws={bylaws} />
      </Section>
    </>
  );
}
