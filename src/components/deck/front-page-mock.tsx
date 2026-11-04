import Image from "next/image";
import heroWide from "@/components/assets/hero-wide-darkmode.png";
import bocWhite from "@/components/assets/BOC-white.png";

/**
 * A drawing in code of the club's front page, for the group leaders' deck (/presentasjon/gruppeleder): the header, the
 * hero with the club's own picture and headline, and the strip of facts, as on a laptop at 1440 × 900. It is laid out at
 * that size and scaled to the screen it stands in. The texts follow the front page (seed/boc.ts) as of November 2026; it
 * is a picture of the page, not the page, so change it by hand if the front page's wording changes.
 */

const W = 1440;
const H = 900;

export const FRONT_PAGE_RATIO = W / H;

/** Lays out its children at 1440 × 900 and scales them to a screen of the given width in px. */
export function ScaledScreen({ width, children }: { width: number; children: React.ReactNode }) {
  const scale = width / W;
  return (
    <div style={{ width, height: H * scale }} className="relative overflow-hidden bg-[#0f1419]">
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }} className="absolute top-0 left-0 font-sans text-white">
        {children}
      </div>
    </div>
  );
}

export function FrontPageScreen() {
  const nav = ["Aktiviteter", "Grupper ⌄", "Barn og ungdom", "Nyheter", "Om klubben"];
  const facts = [
    ["18", "lag og grupper"],
    ["Hele året", "fellestreninger"],
    ["Alle nivåer", "nybegynner til elitesyklist"],
    ["6", "disipliner"],
  ];
  return (
    <div className="absolute inset-0 bg-[#0c1116]">
      <Image src={heroWide} alt="" fill sizes="1440px" className="object-cover" priority />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
      {/* Header */}
      <div className="absolute inset-x-0 top-0 flex h-[72px] items-center justify-between bg-black/45 px-20">
        <Image src={bocWhite} alt="" className="h-8 w-auto" />
        <div className="flex gap-12 text-[19px] text-white/90">
          {nav.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
        <span className="rounded-md border border-white/60 px-5 py-2 text-[19px] font-medium">Bli med ›</span>
      </div>
      {/* Hero */}
      <div className="absolute top-[270px] left-20 w-[900px]">
        <p className="text-[19px] text-white/85">Bærum og Omegn Cykleklubb · siden 1968</p>
        <p className="mt-4 text-[74px] leading-[1.08] font-medium tracking-[-0.02em]">
          Fellestreninger hele året.
          <br />
          Ritt på vår, sommer og høst.
          <br />
          <span className="text-white/75">Mallorca i mars og oktober.</span>
        </p>
        <p className="mt-6 max-w-[760px] text-[23px] leading-[1.45] text-white/90">
          Fire landeveisgrupper for voksne, og egne grupper for barn og ungdom fra 5 til 17 år. Om vinteren flytter vi inn på spinning og Zwift, og i Velodromen sykler vi hele året.
        </p>
        <div className="mt-9 flex items-center gap-8">
          <span className="rounded-md bg-[#e8ff00] px-8 py-4 text-[22px] font-semibold text-[#0d1a2b]">Finn gruppen din ›</span>
          <span className="text-[22px]">Til barn og ungdom ›</span>
        </div>
      </div>
      {/* Facts */}
      <div className="absolute inset-x-0 bottom-0 grid h-[150px] grid-cols-4 bg-black/65 px-20 pt-9">
        {facts.map(([big, small]) => (
          <div key={big}>
            <p className="text-[34px] font-medium">{big}</p>
            <p className="text-[18px] text-white/60">{small}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
