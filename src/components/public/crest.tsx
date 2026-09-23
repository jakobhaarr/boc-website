import Image from "next/image";
import bocWordmark from "@/components/assets/BOC-main.png";
import bocWordmarkWhite from "@/components/assets/BOC-white.png";

export type ClubLogo = "crest" | "wordmark";

/**
 * The club's mark. Two kinds, because clubs differ: a crest drawn from the
 * theme tokens, or a plain wordmark for clubs whose identity is the letters
 * themselves (BOC). The wordmark is the club's own file in two cuts: the
 * main one in the club blue for light grounds and the yellow menu panel, and
 * a white one (`tone="dark"`) for the footer and other dark grounds.
 */
export function ClubCrest({
  letters,
  className,
  title,
  logo = "crest",
  tone = "light",
}: {
  letters: string;
  className?: string;
  title?: string;
  logo?: ClubLogo;
  /** The ground the mark sits on; picks the wordmark's cut. */
  tone?: "light" | "dark";
}) {
  const label = title ? { role: "img" as const } : { "aria-hidden": true as const };

  if (logo === "wordmark") {
    return (
      <Image
        src={tone === "dark" ? bocWordmarkWhite : bocWordmark}
        alt={title ?? ""}
        className={className}
        aria-hidden={title ? undefined : true}
        priority
      />
    );
  }

  return (
    <svg viewBox="0 0 40 46" className={className} {...label}>
      {title && <title>{title}</title>}
      <path d="M2 2h36v21.5C38 34.6 30.2 41.4 20 44.4 9.8 41.4 2 34.6 2 23.5V2Z" fill="var(--club-primary)" />
      <path d="M2 2h36v6.5H2z" fill="var(--club-secondary)" />
      <path d="M2 8.5h36v1.2H2z" fill="var(--club-accent)" />
      <path
        d="M5.5 13h29v10.2c0 8.6-6 14.3-14.5 16.9C11.5 37.5 5.5 31.8 5.5 23.2V13Z"
        fill="none"
        stroke="var(--club-on-primary)"
        strokeOpacity=".28"
      />
      <text
        x="20"
        y="29.2"
        textAnchor="middle"
        fontSize={letters.length > 3 ? 8.5 : 11}
        fontWeight={700}
        letterSpacing=".5"
        fill="var(--club-on-primary)"
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        {letters}
      </text>
    </svg>
  );
}
