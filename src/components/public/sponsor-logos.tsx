import type { StaticImageData } from "next/image";
import type { ReactNode } from "react";
import antonSportLogo from "@/components/assets/anton-sport-white.png";
import genusLogo from "@/components/assets/genus-new.png";
import kalasLogo from "@/components/assets/kalas-logo.png";

/**
 * Sponsor logos.
 *
 * A real club uploads its partners' logos; BOC's are the partners' own files
 * (LOGO_FILES below). The other demo partners are invented, so the prototype
 * draws them instead, so the strip shows what a row of actual marks looks
 * like rather than a row of plain names. Every mark inherits `currentColor`
 * and is drawn inside a 200 × 40 box, so they share a baseline and weight no
 * matter how different the shapes are.
 */

const box = "h-8 w-auto lg:h-9";

function Mark({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 200 40" role="img" aria-label={label} className={box} fill="currentColor">
      {children}
    </svg>
  );
}

const word = (text: string, x: number, opts: { size?: number; weight?: number; tracking?: number; style?: string } = {}) => (
  <text
    x={x}
    y="26"
    fontFamily="var(--font-schibsted), var(--font-inter), system-ui, sans-serif"
    fontSize={opts.size ?? 19}
    fontWeight={opts.weight ?? 600}
    letterSpacing={opts.tracking ?? -0.4}
    fontStyle={opts.style}
  >
    {text}
  </text>
);

/* Five shapes, reused with different wording — the way a row of real logos
   differs in silhouette but shares weight. */

const bank = (first: string, second: string, x = 116) => (
  <>
    {/* Gable roof over columns — the old savings-bank mark */}
    <path d="M8 18 22 6l14 12v2H8z" />
    <rect x="11" y="22" width="3.5" height="12" />
    <rect x="20" y="22" width="3.5" height="12" />
    <rect x="29" y="22" width="3.5" height="12" />
    <rect x="8" y="35" width="28" height="3" />
    {word(first, 46, { weight: 700 })}
    {word(second, x, { weight: 400 })}
  </>
);

const wheel = (top: string, bottom: string) => (
  <>
    {/* Chainring */}
    <path d="M22 4a18 18 0 1 0 0 36 18 18 0 0 0 0-36Zm0 6a12 12 0 1 1 0 24 12 12 0 0 1 0-24Z" />
    <path d="M21 0h2l1 6h-4zM21 34h2l1 6h-4zM40 21v2l-6 1v-4zM6 21v2l-6 1v-4z" />
    <circle cx="22" cy="22" r="4" />
    {word(top, 50, { size: 15, weight: 700, tracking: 2.2 })}
    <text x="50" y="36" fontFamily="var(--font-inter), system-ui, sans-serif" fontSize="9.5" fontWeight={500} letterSpacing="1.4">
      {bottom}
    </text>
  </>
);

const wheat = (first: string, second: string, x = 104) => (
  <>
    {/* Ear of wheat */}
    <path d="M20 38V14" strokeWidth="2.5" stroke="currentColor" fill="none" />
    <path
      d="M20 12c3-4 8-6 8-6s-1 6-4 8-4 0-4-2Zm0 0c-3-4-8-6-8-6s1 6 4 8 4 0 4-2Zm0 10c3-4 8-5 8-5s-1 5-4 7-4 0-4-2Zm0 0c-3-4-8-5-8-5s1 5 4 7 4 0 4-2Z"
      fill="currentColor"
    />
    {word(first, 40, { size: 21, weight: 500, style: "italic", tracking: -0.6 })}
    {word(second, x, { size: 21, weight: 500, style: "italic", tracking: -0.6 })}
  </>
);

const pulse = (first: string, second: string) => (
  <>
    {/* Pulse inside a rounded square */}
    <path
      d="M6 10a6 6 0 0 1 6-6h18a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V10Zm5 11h6l3-6 4 12 3-6h5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {word(first, 48, { weight: 600 })}
    <text x="48" y="36" fontFamily="var(--font-inter), system-ui, sans-serif" fontSize="10" fontWeight={500} letterSpacing="0.6">
      {second}
    </text>
  </>
);

const bolt = (first: string, second: string, x = 112) => (
  <>
    {/* Bolt in a circle */}
    <path d="M22 2a20 20 0 1 0 0 40 20 20 0 0 0 0-40Zm0 4a16 16 0 1 1 0 32 16 16 0 0 1 0-32Z" />
    <path d="M24 10l-9 14h6l-2 8 9-14h-6l2-8Z" />
    {word(first, 50, { size: 18, weight: 800, tracking: 0.5 })}
    {word(second, x, { size: 18, weight: 300, tracking: 0.5 })}
  </>
);

const LOGOS: Record<string, ReactNode> = {
  /* Oslo Sportsklubb */
  "Sagene Sparebank": <Mark label="Sagene Sparebank">{bank("Sagene", "Sparebank")}</Mark>,
  "Torshov Sykkelverksted": <Mark label="Torshov Sykkelverksted">{wheel("TORSHOV", "SYKKELVERKSTED")}</Mark>,
  "Myhre Bakeri": <Mark label="Myhre Bakeri">{wheat("Myhre", "Bakeri")}</Mark>,
  "Nydalen Fysioterapi": <Mark label="Nydalen Fysioterapi">{pulse("Nydalen", "FYSIOTERAPI")}</Mark>,
  "Aune Elektro": <Mark label="Aune Elektro">{bolt("AUNE", "ELEKTRO")}</Mark>,

  /* Bærum og Omegn Cykleklubb — the partners' own logos, see LOGO_FILES */
  "Bærum Sparebank": <Mark label="Bærum Sparebank">{bank("Bærum", "Sparebank", 112)}</Mark>,
  "Kolsås Sykkelverksted": <Mark label="Kolsås Sykkelverksted">{wheel("KOLSÅS", "SYKKELVERKSTED")}</Mark>,
  "Sandvika Fysioterapi": <Mark label="Sandvika Fysioterapi">{pulse("Sandvika", "FYSIOTERAPI")}</Mark>,
  "Løkke Elektro": <Mark label="Løkke Elektro">{bolt("LØKKE", "ELEKTRO")}</Mark>,
  "Bekkestua Bakeri": <Mark label="Bekkestua Bakeri">{wheat("Bekkestua", "Bakeri", 134)}</Mark>,
};

/**
 * Partners' own logo files. They are white on transparent, so each is used as
 * a mask filled with `currentColor`: it takes the strip's colour like a drawn
 * mark does — grey on paper, white in the footer — and brightens on hover.
 *
 * Logos this different in shape cannot share a height: at the same height
 * the long Anton Sport wordmark would weigh three times the compact Kalas.
 * Each is sized to the same area instead (LOGO_AREA, in px² at the strip's
 * base size), so the row reads as equal partners.
 */
const LOGO_FILES: Record<string, StaticImageData> = {
  Genus: genusLogo,
  Kalas: kalasLogo,
  "Anton Sport": antonSportLogo,
};
const LOGO_AREA = 3600;
/* How far to lower a logo, as a share of its height, so that its name — not
   its whole box — sits on the strip's centre line. Genus carries a small line
   of text under the wordmark: the wordmark fills rows 0–258 of 415, so its
   middle is 19 % of the height above the box's. */
const LOGO_NUDGE: Record<string, number> = { Genus: 0.19 };

function FileLogo({ name, image }: { name: string; image: StaticImageData }) {
  const aspect = image.width / image.height;
  const height = Math.sqrt(LOGO_AREA / aspect);
  return (
    <span
      role="img"
      aria-label={name}
      className="block bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] lg:scale-110"
      style={{
        width: height * aspect,
        height,
        translate: `0 ${(LOGO_NUDGE[name] ?? 0) * height}px`,
        maskImage: `url(${image.src})`,
        WebkitMaskImage: `url(${image.src})`,
      }}
    />
  );
}

/** Falls back to a plain wordmark for partners without a logo. */
export function SponsorLogo({ name }: { name: string }) {
  const file = LOGO_FILES[name];
  if (file) return <FileLogo name={name} image={file} />;
  return (
    LOGOS[name] ?? (
      <Mark label={name}>
        <rect x="6" y="14" width="12" height="12" rx="3" />
        {word(name, 24, { size: 17, weight: 600 })}
      </Mark>
    )
  );
}

export const hasSponsorLogo = (name: string) => name in LOGOS || name in LOGO_FILES;
