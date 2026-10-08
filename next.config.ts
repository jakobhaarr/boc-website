import path from "node:path";
import type { NextConfig } from "next";

// The host of the club's Supabase project: its public pictures go through the image optimiser (lib/photo-src.ts).
const uploadHost = (() => {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).host : "";
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  // This app lives inside another project with its own lockfile. Pin the
  // workspace root so Next never treats the parent folder as the project.
  turbopack: { root: path.resolve(__dirname) },
  // Do not generate AGENTS.md / CLAUDE.md — the parent project's CLAUDE.md is protected.
  agentRules: false,
  devIndicators: false,
  // The annual meetings live at /årsmøter (the folder is spelled in percent-encoding, as Next needs for non-ASCII names); the plain spelling leads there too.
  async redirects() {
    return [{ source: "/arsmoter", destination: "/%C3%A5rsm%C3%B8ter", permanent: false }];
  },
  env: { UPLOAD_HOST: uploadHost },
  images: {
    remotePatterns: uploadHost ? [{ protocol: "https", hostname: uploadHost, pathname: "/storage/v1/object/public/**" }] : [],
    // Uploaded files have a new random name each time, so a resized copy never goes stale: keep it for 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // Photos from composer uploads are downscaled client-side, but a post can
  // carry several of them in one server action.
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
};

export default nextConfig;
