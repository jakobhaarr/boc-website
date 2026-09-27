/**
 * «BOC 1», «BOC 2», «BOC 3», «BOC 4» → «BOC 1–4»: a run of numbered names
 * with the same prefix collapses to a range, and any other names follow it
 * in a list.
 */
export function groupNamesLabel(names: string[]): string {
  const numbered = names.map((n) => /^(.*?)(\d+)$/.exec(n));
  const prefix = numbered.find(Boolean)?.[1];
  const run = numbered.filter((p) => p && p[1] === prefix).map((p) => Number(p![2])).sort((a, b) => a - b);
  const consecutive = run.length > 1 && run.every((n, i) => i === 0 || n === run[i - 1] + 1);
  const items = consecutive
    ? [`${prefix}${run[0]}–${run.at(-1)}`, ...names.filter((_, i) => !(numbered[i] && numbered[i]![1] === prefix))]
    : names;
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} og ${items.at(-1)}` : (items[0] ?? "");
}
