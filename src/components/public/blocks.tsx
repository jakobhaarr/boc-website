import { Inlines } from "@/components/public/rich-text";
import { cn } from "@/lib/cn";
import { Photo } from "@/components/public/photo";
import type { Block, Photo as PhotoRecord } from "@/lib/types";

/**
 * Article blocks set as body text: paragraphs, subheadings and lists (links
 * inside them open in place or, when they lead off the site, in a new tab).
 * Used by the club's information pages and a branch's own sections.
 */
export function Blocks({ blocks, className, photos }: { blocks: Block[]; className?: string; /** The photos the blocks may point to (a «photo» block shows nothing without its record). */ photos?: PhotoRecord[] }) {
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
        if (b.type === "quote")
          return (
            <blockquote key={i} className="border-l-2 border-club pl-4 t-body-lg text-ink">
              «<Inlines content={b.content} />»
              <footer className="mt-1 t-small text-ink-3">
                <Inlines content={b.attribution} />
              </footer>
            </blockquote>
          );
        if (b.type === "photo") {
          const photo = photos?.find((x) => x.id === b.photoId);
          if (!photo || photo.withdrawn) return null;
          return (
            <figure key={i} className="py-2">
              <Photo photo={photo} sizes="(min-width: 1024px) 704px, 100vw" className="rounded-xl" />
              {photo.caption && (
                <figcaption className="mt-2 t-small text-ink-3">
                  <Inlines content={photo.caption} />
                </figcaption>
              )}
            </figure>
          );
        }
        return null;
      })}
    </div>
  );
}
