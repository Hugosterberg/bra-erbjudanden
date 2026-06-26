import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message:
            "Persistent app data must be stored in Supabase through server-side actions, not localStorage.",
        },
        {
          name: "sessionStorage",
          message:
            "Persistent app data must be stored in Supabase through server-side actions, not sessionStorage.",
        },
        {
          name: "indexedDB",
          message:
            "Persistent app data must be stored in Supabase through server-side actions, not IndexedDB.",
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "window",
          property: "localStorage",
          message:
            "Persistent app data must be stored in Supabase through server-side actions.",
        },
        {
          object: "window",
          property: "sessionStorage",
          message:
            "Persistent app data must be stored in Supabase through server-side actions.",
        },
        {
          object: "window",
          property: "indexedDB",
          message:
            "Persistent app data must be stored in Supabase through server-side actions.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
