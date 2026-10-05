"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { removeOwnAvatar, setOwnAvatar } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/primitives";

/** Side of the square crop area on screen, and of the picture that is saved. */
const VIEW = 288;
const OUTPUT = 512;
const MAX_ZOOM = 4;

/**
 * Your own profile picture: choose a photo, move and zoom it inside a round
 * frame, and save what the frame shows. The picture is drawn on a canvas, so
 * what you see is exactly what is uploaded, and drawing it anew drops the
 * file's metadata (camera, time, GPS position) before it leaves the device.
 * Only the signed-in person's own picture is ever set here (setOwnAvatar);
 * it is shown in admin, never on the public site.
 */
export function AvatarEditor({ open, onClose, name, photo }: { open: boolean; onClose: () => void; name: string; photo?: { src: string; focal?: { x: number; y: number } } }) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const canvas = useRef<HTMLCanvasElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const router = useRouter();

  // The picture covers the frame at zoom 1; zooming only ever makes it larger, so no edge shows.
  const cover = bitmap ? Math.max(VIEW / bitmap.width, VIEW / bitmap.height) : 1;

  const clamp = useCallback(
    (o: { x: number; y: number }, z: number) => {
      if (!bitmap) return { x: 0, y: 0 };
      const slackX = Math.max(0, (bitmap.width * cover * z - VIEW) / 2);
      const slackY = Math.max(0, (bitmap.height * cover * z - VIEW) / 2);
      return { x: Math.min(slackX, Math.max(-slackX, o.x)), y: Math.min(slackY, Math.max(-slackY, o.y)) };
    },
    [bitmap, cover],
  );

  /** Draws the part of the picture the frame shows onto a square canvas of `size` px. */
  const draw = useCallback(
    (target: HTMLCanvasElement, size: number) => {
      if (!bitmap) return;
      const scale = cover * zoom;
      // Region of the picture inside the frame, in the picture's own pixels.
      const sw = VIEW / scale;
      const sx = (bitmap.width * scale) / 2 / scale - sw / 2 - offset.x / scale;
      const sy = (bitmap.height * scale) / 2 / scale - sw / 2 - offset.y / scale;
      target.width = size;
      target.height = size;
      target.getContext("2d")!.drawImage(bitmap, sx, sy, sw, sw, 0, 0, size, size);
    },
    [bitmap, cover, zoom, offset],
  );

  useEffect(() => {
    if (canvas.current) draw(canvas.current, VIEW * 2);
  }, [draw]);

  const reset = () => {
    bitmap?.close();
    setBitmap(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setError(undefined);
  };

  const close = () => {
    reset();
    onClose();
  };

  const choose = async (file: File) => {
    setError(undefined);
    try {
      // createImageBitmap applies the photo's orientation, so a phone photo is not turned on its side.
      const next = await createImageBitmap(file);
      bitmap?.close();
      setBitmap(next);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    } catch {
      setError("Kunne ikke lese bildet. Velg et JPEG-, PNG- eller WebP-bilde.");
    }
  };

  const changeZoom = (next: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    setZoom(z);
    setOffset((o) => clamp(o, z));
  };

  const save = () =>
    start(async () => {
      if (!canvas.current || !bitmap) return;
      setError(undefined);
      const out = document.createElement("canvas");
      draw(out, OUTPUT);
      const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", 0.88));
      if (!blob) return setError("Kunne ikke lage bildet.");
      const form = new FormData();
      form.set("file", new File([blob], "profil.jpg", { type: "image/jpeg" }));
      form.set("width", String(OUTPUT));
      form.set("height", String(OUTPUT));
      const res = await setOwnAvatar(form);
      if (!res.ok) return setError(res.error);
      announceChange();
      router.refresh();
      close();
    });

  const remove = () =>
    start(async () => {
      const res = await removeOwnAvatar();
      if (!res.ok) return setError(res.error);
      announceChange();
      router.refresh();
      close();
    });

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const last = pointers.current.get(e.pointerId);
    if (!last || !bitmap) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      changeZoom(pinch.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.distance));
      return;
    }
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    setOffset((o) => clamp({ x: o.x + dx, y: o.y + dy }, zoom));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 12;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      setOffset((o) => clamp({ x: o.x + moves[e.key][0], y: o.y + moves[e.key][1] }, zoom));
    } else if (e.key === "+" || e.key === "=") changeZoom(zoom + 0.2);
    else if (e.key === "-") changeZoom(zoom - 0.2);
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      size="sm"
      title="Profilbilde"
      description="Bildet vises ved navnet ditt i administrasjonen, ikke på nettsiden."
      footer={
        bitmap ? (
          <>
            <Button variant="secondary" onClick={reset} disabled={pending}>
              Velg et annet
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? "Lagrer …" : "Bruk bildet"}
            </Button>
          </>
        ) : (
          <>
            {photo && (
              <Button variant="ghost" onClick={remove} disabled={pending}>
                Fjern bildet
              </Button>
            )}
            <Button onClick={() => picker.current?.click()} disabled={pending}>
              {photo ? "Velg nytt bilde" : "Velg bilde"}
            </Button>
          </>
        )
      }
    >
      <input
        ref={picker}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Velg bilde"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void choose(file);
        }}
      />
      {bitmap ? (
        <div className="grid justify-items-center gap-4">
          <div
            role="group"
            tabIndex={0}
            aria-label="Beskjær bildet. Dra for å flytte det. Piltaster flytter, pluss og minus zoomer."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            style={{ width: VIEW, height: VIEW, touchAction: "none" }}
            className="relative cursor-grab overflow-hidden bg-sunken select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:cursor-grabbing"
          >
            <canvas ref={canvas} style={{ width: VIEW, height: VIEW }} className="block" />
            {/* The round frame: everything outside it is dimmed, so what stays bright is what is saved. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgb(0_0_0/0.5)] ring-2 ring-white/90" />
          </div>
          <div className="flex w-full max-w-[288px] items-center gap-3">
            <button type="button" aria-label="Zoom ut" onClick={() => changeZoom(zoom - 0.25)} className="inline-flex size-9 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink">
              <Minus aria-hidden className="size-4" />
            </button>
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              aria-label="Zoom"
              onChange={(e) => changeZoom(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer accent-[var(--action)]"
            />
            <button type="button" aria-label="Zoom inn" onClick={() => changeZoom(zoom + 0.25)} className="inline-flex size-9 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink">
              <Plus aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          <Avatar name={name} size={96} photo={photo} />
          <p className="t-small text-ink-3">{photo ? "Slik ser bildet ditt ut nå." : "Du har ikke noe profilbilde ennå."}</p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 t-small text-danger">
          {error}
        </p>
      )}
    </Dialog>
  );
}
