import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Errors fail the build in CI (npm run lint). The React Compiler-era rules below flag patterns that were written before they
 * existed (state set in effects, refs read while rendering, components made inside components). They are real smells, but
 * rewriting them all at once is risky, so they are warnings: the list is the cleanup backlog, and new code should not add to it.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "@next/next/no-location-assign-relative-destination": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/components/assets/**", "public/**", "scripts/**"]),
]);
