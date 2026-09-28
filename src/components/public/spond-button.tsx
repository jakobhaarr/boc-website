import { ArrowUpRight } from "lucide-react";
import spondLogo from "@/components/assets/spond.svg";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * A button to a Spond group, in Spond's red (#f72b51), that says what it
 * opens with Spond's own white wordmark for the word «Spond»: «Åpne BOC
 * Landevei i [Spond]», «Se når og hvor på [Spond]». Screen readers get the
 * whole label. Set like every other large button; white on that red is
 * 3.9:1, below WCAG AA for text that size, kept because the red is what
 * makes it read as Spond.
 */
export function SpondButton({ url, label, className }: { url: string; label: string; className?: string }) {
  const lead = label.replace(/\s*Spond\s*$/, "");
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className={cn(buttonClass({ size: "lg" }), "!bg-[#f72b51] !text-white hover:!bg-[#e0203f]", className)}
    >
      {lead}
      {lead !== label && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={spondLogo.src} alt="" aria-hidden className="h-[0.95em] w-auto translate-y-[0.05em]" />
      )}
      <ArrowUpRight aria-hidden />
    </a>
  );
}
