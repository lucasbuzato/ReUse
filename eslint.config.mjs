import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["next.config.js", "tailwind.config.js", "postcss.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    ".vercel/**",
    ".test-dist/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "backend/**",
    "scripts/**",
  ]),
]);
