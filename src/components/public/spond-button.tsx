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

/**
 * Spond's invite asks «I'm a member» or «I'm a parent or guardian». To a
 * newcomer «member» sounds like a paid club membership they do not have
 * yet, so the choice is explained before they tap: «member» only means that
 * they are the one riding.
 */
export function SpondChoiceHint({ className }: { className?: string }) {
  return (
    <p className={cn("max-w-[52ch] t-small text-ink-3", className)}>
      Spond spør om du er «member» eller «parent or guardian». Velg «I&apos;m a member» selv om du ikke har meldt deg inn i BOC ennå. Det betyr bare at
      det er du som skal være med i gruppa. Melder du på et barn, velger du «I&apos;m a parent or guardian».
    </p>
  );
}
