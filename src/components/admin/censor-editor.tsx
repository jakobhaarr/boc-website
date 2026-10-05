"use client";

import { Undo2, X } from "lucide-react";
import { useRef, useState } from "react";
import type { CensorRegion } from "@/components/admin/censor-image";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

/** A box smaller than this share of the picture is a stray touch, not a face. */
const MIN = 0.015;

/**
 * Draw a box over each face that must not be recognised. The boxes only mark
 * where; the picture is changed by the caller (censorDataUrl) when «Bruk
 * sladding» is pressed, so the original stays on the device and is never sent.
 */
export function CensorEditor({
  open,
  onClose,
  src,
  regions,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  regions: CensorRegion[];
  onSave: (regions: CensorRegion[]) => void;
}) {
  const [draft, setDraft] = useState<CensorRegion[]>(regions);
  const [live, setLive] = useState<CensorRegion | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const area = useRef<HTMLDivElement>(null);

  const point = (e: React.PointerEvent) => {
    const box = area.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)), y: Math.min(1, Math.max(0, (e.clientY - box.top) / box.height)) };
  };
  const rect = (a: { x: number; y: number }, b: { x: number; y: number }): CensorRegion => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });

  const down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = point(e);
    setLive(null);
  };
  const move = (e: React.PointerEvent) => {
    if (start.current) setLive(rect(start.current, point(e)));
  };
  const up = (e: React.PointerEvent) => {
    if (!start.current) return;
    const r = rect(start.current, point(e));
    start.current = null;
    setLive(null);
    if (r.w >= MIN && r.h >= MIN) setDraft((d) => [...d, r]);
  };

  const box = (r: CensorRegion) => ({ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Sladd ansikter"
      description="Dra en boks over hvert ansikt som skal dekkes til. Bildet endres på enheten din før det lastes opp, så ansiktene er borte for alle."
      footer={
        <>
          <Button variant="ghost" onClick={() => setDraft([])} disabled={draft.length === 0}>
            Fjern alle
          </Button>
          <Button variant="secondary" onClick={() => setDraft((d) => d.slice(0, -1))} disabled={draft.length === 0}>
            <Undo2 aria-hidden />
            Angre
          </Button>
          <Button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Bruk sladding{draft.length ? ` (${draft.length})` : ""}
          </Button>
        </>
      }
    >
      <div className="flex justify-center">
        <div
          ref={area}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          style={{ touchAction: "none" }}
          className="relative inline-block max-w-full cursor-crosshair select-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="Bildet som skal sladdes" draggable={false} className="block max-h-[60dvh] max-w-full" />
          {draft.map((r, i) => (
            <div key={i} style={box(r)} className="absolute border-2 border-white bg-black/60">
              <button
                type="button"
                aria-label={`Fjern sladding ${i + 1}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
                className="absolute -top-3 -right-3 flex size-6 items-center justify-center rounded-full bg-white text-black shadow"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </div>
          ))}
          {live && <div style={box(live)} className="absolute border-2 border-dashed border-white bg-black/40" />}
        </div>
      </div>
    </Dialog>
  );
}
