import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives inside another project with its own lockfile. Pin the
  // workspace root so Next never treats the parent folder as the project.
  turbopack: { root: path.resolve(__dirname) },
  // Do not generate AGENTS.md / CLAUDE.md — the parent project's CLAUDE.md is protected.
  agentRules: false,
  devIndicators: false,
  // Photos from composer uploads are downscaled client-side, but a post can
  // carry several of them in one server action.
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  // Standalone static page in public/, served at a clean URL. afterFiles
  // rewrites run before dynamic routes, so the (public)/[...path] catch-all
  // doesn't swallow it.
  async rewrites() {
    return [{ source: "/matoppskrift", destination: "/matoppskrift.html" }];
  },
};

export default nextConfig;
