import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Deno製Supabase Edge Function。Next.js/Node向けのlintルールと
    // グローバル（Deno.serve等）が合わないため対象外にする。
    "supabase/**",
  ]),
]);

export default eslintConfig;
