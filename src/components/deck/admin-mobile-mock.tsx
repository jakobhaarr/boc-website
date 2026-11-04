import { ChevronDown, ImagePlus, MessageSquare, X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Drawings of two screens from admin on a phone, in code, for the group leaders' deck (/presentasjon/gruppeleder): the
 * news editor with the «Tilbakemelding» button, and the feedback form open over it. They show admin's light theme
 * whatever the deck's own theme is, so their colours are fixed here, and they are laid out at an iPhone's 375 × 812 and
 * scaled to the phone they stand in. Texts are example texts, not data.
 */

const W = 375;
const H = 812;

/** Lays out its children at 375 × 812 and scales them to a screen of the given height in px, with CSS `zoom` (not a transform: it leaves a layout box at full size, which the PDF cuts at the end of the slide). */
export function MobileScreen({ height, children }: { height: number; children: ReactNode }) {
  const scale = height / H;
  return (
    <div style={{ width: W * scale, height }} className="relative overflow-hidden bg-white">
      <div style={{ width: W, height: H, zoom: scale }} className="absolute top-0 left-0 font-sans text-[#0f172a]">
        {children}
      </div>
    </div>
  );
}

export const MOBILE_SCREEN_RATIO = W / H;

function Pill() {
  return (
    <span className="absolute right-4 bottom-[116px] flex items-center gap-2 rounded-full bg-[#111827] px-4 py-2.5 text-[15px] font-medium text-white shadow-lg">
      <MessageSquare aria-hidden className="size-4" />
      Tilbakemelding
    </span>
  );
}

/** The news editor on a phone: the post being written, and the button for feedback above the bottom bar. */
export function ComposerScreen({ dim = false, pill = true }: { dim?: boolean; pill?: boolean }) {
  return (
    <div className="absolute inset-0 bg-white">
      {/* Status bar, with room for the island */}
      <div className="flex h-[48px] items-end justify-between px-8 pb-1 text-[15px] font-semibold">
        <span>9:41</span>
        <span className="text-[13px]">●●●</span>
      </div>
      <div className="flex h-14 items-center justify-between border-b border-[#e2e8f0] px-4 text-[15px]">
        <span className="flex items-center gap-2 text-[#334155]">
          <X aria-hidden className="size-5" /> Avbryt
        </span>
        <span className="font-semibold">Nytt innlegg</span>
        <span className="font-medium">Forhåndsvis</span>
      </div>
      <div className="flex items-center gap-4 border-b border-[#e2e8f0] px-4 py-3">
        <span className="text-[15px] text-[#64748b]">Til</span>
        <span className="flex-1">
          <span className="block text-[15px] font-semibold">BOC 2</span>
          <span className="block text-[14px] text-[#64748b]">Sykkel · Landevei</span>
        </span>
        <span className="flex items-center gap-1 text-[15px] text-[#64748b]">
          Endre <ChevronDown aria-hidden className="size-4" />
        </span>
      </div>
      <div className="px-4 pt-5">
        <p className="text-[28px] leading-[1.15] font-bold tracking-[-0.02em]">Sesongstart for BOC 2</p>
        <p className="mt-3 text-[17px] leading-[1.45]">Første fellestur i går, med kaffe på Bekkestua etterpå. Takk til alle som kom!</p>
      </div>
      <div className="absolute inset-x-0 top-[330px] border-t border-[#e2e8f0] px-4 pt-4">
        <div className="flex items-center gap-4 rounded-md bg-[#f1f5f9] p-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-white">
            <ImagePlus aria-hidden className="size-6" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold">Legg til bilder</span>
            <span className="block text-[15px] text-[#64748b]">Fra kamera eller bildebibliotek</span>
          </span>
        </div>
        <div className="mt-5 flex items-start gap-3">
          <span className="mt-0.5 size-5 shrink-0 rounded border border-[#94a3b8]" />
          <span>
            <span className="block text-[15px]">Foreslå for klubbens forside</span>
            <span className="block text-[14px] leading-snug text-[#64748b]">En klubbadministrator bestemmer hva som vises på forsiden.</span>
          </span>
        </div>
      </div>
      {pill && <Pill />}
      <div className="absolute inset-x-0 bottom-0 border-t border-[#e2e8f0] bg-white px-4 pt-3 pb-8">
        <p className="mb-2 text-center text-[13px] text-[#64748b]">Publiseres direkte på BOC 2</p>
        <span className="inline-block rounded-md bg-[#111827] px-6 py-3 text-[15px] font-medium text-white">Publiser</span>
      </div>
      {dim && <div className="absolute inset-0 bg-black/35" />}
    </div>
  );
}

/** The feedback form, open as a sheet over the news editor. */
export function FeedbackSheetScreen() {
  const field = "rounded-md border border-[#cbd5e1] bg-white px-3 text-[16px]";
  return (
    <>
      <ComposerScreen dim pill={false} />
      <div className="absolute inset-x-0 bottom-0 top-[168px] rounded-t-2xl bg-white px-5 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[19px] font-semibold">Gi tilbakemelding</p>
            <p className="mt-1 max-w-[270px] text-[15px] leading-snug text-[#64748b]">Om siden du er på nå. Skjermbilder hjelper oss å forstå.</p>
          </div>
          <X aria-hidden className="size-6 text-[#475569]" />
        </div>
        <div className="mt-4 grid gap-3.5 border-t border-[#e2e8f0] pt-4">
          <div>
            <p className="mb-1.5 text-[14px] font-medium">Gjelder</p>
            <div className={`${field} flex h-11 items-center justify-between`}>
              Noe annet <ChevronDown aria-hidden className="size-4 text-[#64748b]" />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[14px] font-medium">Tilbakemelding</p>
            <div className={`${field} h-[150px] py-3 leading-snug`}>Fint å kunne skrive nyheten fra mobilen. Jeg fant ikke hvor jeg la til bilde.</div>
          </div>
          <div>
            <p className="mb-1.5 text-[14px] font-medium">
              Skjermbilder <span className="font-normal text-[#64748b]">(valgfritt)</span>
            </p>
            <span className="inline-flex items-center gap-2 rounded-md border border-[#cbd5e1] px-3 py-2 text-[14px]">
              <ImagePlus aria-hidden className="size-4" /> Legg ved skjermbilde
            </span>
          </div>
          <span className="flex h-11 items-center justify-center rounded-md bg-[#111827] text-[15px] font-medium text-white">Send tilbakemelding</span>
        </div>
      </div>
    </>
  );
}
