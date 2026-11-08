import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadSite } from "@/lib/data/queries";

/**
 * The picture shown when a link to the site is shared (Facebook, LinkedIn, WhatsApp, iMessage): 1200 x 630 px, the size the
 * large link card uses. BOC's has the club's road photo, cropped to the right where the riders are, a dark wash to the left
 * for the name, and the white wordmark. Other clubs get their own colour and name. Pages with a picture of their own (news,
 * Mallorca) set `openGraph.images` and use that instead.
 */
export const alt = "Bærum og Omegn Cykleklubb";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const asset = async (name: string, type: string) => `data:${type};base64,${(await readFile(join(process.cwd(), "src/components/assets", name))).toString("base64")}`;

export default async function Image() {
  const { db } = await loadSite();
  const isBoc = db.club.id === "boc";
  const photo = isBoc ? await asset("boc1-styrkeproven-wide.jpg", "image/jpeg") : undefined;
  const logo = isBoc ? await asset("BOC-white.png", "image/png") : undefined;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0b1a1d", color: "#fff" }}>
        {photo && (
          <img src={photo} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover", objectPosition: "90% 60%" }} />
        )}
        <div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, display: "flex", backgroundImage: "linear-gradient(90deg, rgba(11,26,29,0.92) 0%, rgba(11,26,29,0.75) 40%, rgba(11,26,29,0) 70%)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", width: 720, height: 630 }}>
          {logo ? (
              <img src={logo} alt="" width={238} height={75} />
          ) : (
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{db.club.shortName}</div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.05 }}>{db.club.name}</div>
            <div style={{ display: "flex", marginTop: 20, fontSize: 30, opacity: 0.85 }}>Fellestreninger hele året. Ritt, Zwift og Mallorca.</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
