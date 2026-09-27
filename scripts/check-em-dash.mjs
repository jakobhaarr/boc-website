// Fails when a long dash (— U+2014) appears in text the site shows: string
// literals and JSX text in src/. Comments are skipped. See «Tekst» in AGENTS.md.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(ts|tsx)$/.test(name)) files.push(path);
  }
};
walk("src");

/** The source with every comment blanked out, strings and JSX text kept. */
function withoutComments(src) {
  const out = src.split("");
  let quote = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (src.startsWith("/*", i)) {
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? src.length : end + 2;
      for (let k = i; k < stop; k++) if (out[k] !== "\n") out[k] = " ";
      i = stop - 1;
    } else if (src.startsWith("//", i) && src[i - 1] !== ":") {
      const end = src.indexOf("\n", i);
      const stop = end < 0 ? src.length : end;
      for (let k = i; k < stop; k++) out[k] = " ";
      i = stop - 1;
    } else if (c === '"' || c === "'" || c === "`") {
      quote = c;
    }
  }
  return out.join("");
}

const hits = [];
for (const file of files) {
  withoutComments(readFileSync(file, "utf8"))
    .split("\n")
    .forEach((line, i) => line.includes("—") && hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 140)}`));
}

if (hits.length) {
  console.error(`Lang tankestrek (—) i tekst som vises på siden:\n${hits.join("\n")}`);
  process.exit(1);
}
console.log("Ingen lange tankestreker i sidetekst.");
