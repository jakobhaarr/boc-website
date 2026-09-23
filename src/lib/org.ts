import type { NodeKind, OrgNode } from "./types";

export const LEVEL_LABELS: Record<NodeKind, string> = {
  club: "Klubb",
  sport: "Idrett",
  discipline: "Gren",
  ageGroup: "Aldersgruppe",
  team: "Lag/gruppe",
};

export interface Org {
  root: OrgNode;
  nodes: OrgNode[];
  get(id: string): OrgNode | undefined;
  children(id: string): OrgNode[];
  parent(id: string): OrgNode | undefined;
  /** Root → node, inclusive. */
  lineage(id: string): OrgNode[];
  /** Everything below the node, depth-first in sort order. */
  descendants(id: string): OrgNode[];
  /** Node id plus all descendant ids. */
  subtree(id: string): Set<string>;
  isLeaf(id: string): boolean;
  /** Leaf groups at or below the node — the things people actually join. */
  groups(id: string): OrgNode[];
  sportOf(id: string): OrgNode | undefined;
  contains(ancestorId: string, id: string): boolean;
  href(id: string): string;
  /**
   * The one group under a level that has nothing else below it — BOC's
   * Banesykling holds only Banegruppa. Such a level is skipped: its links go
   * to the group, and its own address forwards there, since a page listing a
   * single group is a step with no choice in it.
   */
  soleGroup(id: string): OrgNode | undefined;
  resolve(segments: string[]): OrgNode | undefined;
  /** Level name as the sport calls it, e.g. "Avdeling" or "Gren". */
  levelLabel(node: OrgNode): string;
  /** Lineage without the club root. */
  trail(id: string): OrgNode[];
  sports(): OrgNode[];
}

export function createOrg(nodes: OrgNode[]): Org {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const kids = new Map<string, OrgNode[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const list = kids.get(n.parentId) ?? [];
    list.push(n);
    kids.set(n.parentId, list);
  }
  for (const list of kids.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);

  const root = nodes.find((n) => n.parentId === null);
  if (!root) throw new Error("Organisation has no root node");

  const children = (id: string) => kids.get(id) ?? [];
  const soleGroup = (id: string): OrgNode | undefined => {
    const node = byId.get(id);
    if (!node || node.kind === "club" || node.kind === "sport") return undefined;
    const below = children(id);
    return below.length === 1 && !children(below[0].id).length ? below[0] : undefined;
  };

  const lineage = (id: string) => {
    const out: OrgNode[] = [];
    let cur = byId.get(id);
    while (cur) {
      out.unshift(cur);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return out;
  };

  const descendants = (id: string): OrgNode[] => children(id).flatMap((c) => [c, ...descendants(c.id)]);

  const subtree = (id: string) => new Set([id, ...descendants(id).map((n) => n.id)]);

  const isLeaf = (id: string) => children(id).length === 0;

  const sportOf = (id: string) => lineage(id).find((n) => n.kind === "sport");

  return {
    root,
    nodes,
    get: (id) => byId.get(id),
    children,
    parent: (id) => {
      const p = byId.get(id)?.parentId;
      return p ? byId.get(p) : undefined;
    },
    lineage,
    descendants,
    subtree,
    isLeaf,
    groups: (id) => (isLeaf(id) ? [byId.get(id)!] : descendants(id).filter((n) => isLeaf(n.id))),
    sportOf,
    contains: (ancestorId, id) => lineage(id).some((n) => n.id === ancestorId),
    soleGroup: (id) => soleGroup(id),
    href: (id) => {
      const path = lineage(soleGroup(id)?.id ?? id)
        .filter((n) => n.parentId !== null)
        .map((n) => n.slug);
      return path.length ? `/${path.join("/")}` : "/";
    },
    resolve: (segments) => {
      let cur: OrgNode | undefined = root;
      for (const seg of segments) {
        cur = cur ? children(cur.id).find((c) => c.slug === decodeURIComponent(seg)) : undefined;
        if (!cur) return undefined;
      }
      return cur === root ? undefined : cur;
    },
    levelLabel: (node) => {
      if (node.kind === "club" || node.kind === "sport") return LEVEL_LABELS[node.kind];
      return sportOf(node.id)?.levelLabels?.[node.kind] ?? LEVEL_LABELS[node.kind];
    },
    trail: (id) => lineage(id).filter((n) => n.parentId !== null),
    sports: () => children(root.id),
  };
}

/** "Fotball · Jenter · J16" — the path above a node, for metadata lines. */
export function trailLabel(org: Org, id: string, { includeSelf = false, sep = " · " } = {}): string {
  const trail = org.trail(id);
  return (includeSelf ? trail : trail.slice(0, -1)).map((n) => n.name).join(sep);
}
