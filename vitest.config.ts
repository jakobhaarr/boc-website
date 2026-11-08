import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Unit tests for the plain rules in src/lib (access, sign-ups, schedule months, quote pictures). No browser, no server. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
