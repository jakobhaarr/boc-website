import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { GroupPage } from "@/components/public/node/group-page";
import { SectionPage } from "@/components/public/node/section-page";
import { SportPage } from "@/components/public/node/sport-page";
import { loadSite } from "@/lib/data/queries";

type Props = { params: Promise<{ path: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path } = await params;
  const { org } = await loadSite();
  const node = org.resolve(path);
  if (!node) return {};
  const sport = org.sportOf(node.id);
  return {
    title: sport && sport.id !== node.id ? `${node.name} · ${sport.name}` : node.name,
    description: node.summary,
  };
}

/**
 * Every node in the organisation has a page at its hierarchical path,
 * e.g. /fotball/jenter/j16/j16-2. The template follows the node's position:
 * sports get a landing page, leaves a group page, everything between an
 * overview — so skipped levels need no special handling.
 */
export default async function NodePage({ params }: Props) {
  const { path } = await params;
  const site = await loadSite();
  const node = site.org.resolve(path);
  if (!node) notFound();
  // A level with a single group under it forwards to the group (Org.soleGroup).
  const sole = site.org.soleGroup(node.id);
  if (sole) redirect(site.org.href(sole.id));
  if (node.kind === "sport") return <SportPage node={node} site={site} />;
  if (site.org.isLeaf(node.id)) return <GroupPage node={node} site={site} />;
  return <SectionPage node={node} site={site} />;
}
