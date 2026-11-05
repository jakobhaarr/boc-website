import { cn } from "@/lib/cn";

/**
 * An HTML block from a club administrator (Block «html»), shown in a sandboxed frame. The sandbox has scripts and
 * pop-ups but not «allow-same-origin»: the code runs as a stranger to this site and cannot read its cookies, storage
 * or page, nor send the visitor off this page by itself. The frame has a fixed height (set by whoever added it) and is
 * given a plain white page, so what is inside looks the same in the site's light and dark themes.
 */
export function HtmlEmbed({ code, height, className }: { code: string; height: number; className?: string }) {
  const doc = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>body{margin:0;padding:0;font-family:system-ui,sans-serif;color:#111;background:#fff}</style>${code}`;
  return (
    <iframe
      title="Innebygd innhold"
      srcDoc={doc}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
      referrerPolicy="no-referrer"
      loading="lazy"
      style={{ height }}
      className={cn("block w-full rounded-lg border-0 bg-white ring-1 ring-line", className)}
    />
  );
}
