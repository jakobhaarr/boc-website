import { Inlines } from "@/components/public/rich-text";
import { cn } from "@/lib/cn";
import type { Block } from "@/lib/types";

/**
 * Article blocks set as body text: paragraphs, subheadings and lists (links
 * inside them open in place or, when they lead off the site, in a new tab).
 * Used by the club's information pages and a branch's own sections.
 */
export function Blocks({ blocks, className }: { blocks: Block[]; className?: string }) {
  return (
    <div className={cn("max-w-[68ch] space-y-4 t-body text-ink-2", className)}>
      {blocks.map((b, i) => {
        if (b.type === "paragraph")
          return (
            <p key={i}>
              <Inlines content={b.content} />
            </p>
          );
        if (b.type === "heading")
          return (
            <h3 key={i} className="pt-2 t-h3 text-ink">
              {b.text}
            </h3>
          );
        if (b.type === "list") {
          const List = b.ordered ? "ol" : "ul";
          return (
            <List key={i} className={cn("space-y-2 pl-5", b.ordered ? "list-decimal" : "list-disc", "marker:text-ink-3")}>
              {b.items.map((item, j) => (
                <li key={j} className="pl-1">
                  <Inlines content={item} />
                </li>
              ))}
            </List>
          );
        }
        return null;
      })}
    </div>
  );
}
