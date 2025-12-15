import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginBoundaries from "eslint-plugin-boundaries";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  pluginReact.configs.flat["jsx-runtime"],
  {
    rules: {
      "func-style": ["error", "declaration"],
    },
  },
  {
    plugins: { boundaries: pluginBoundaries },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
      "boundaries/elements": [
        { type: "features", pattern: "features/*", capture: ["featureName"] },
        { type: "components", pattern: "components/*" },
        { type: "lib", pattern: "lib/*" },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "components", allow: ["lib"], disallow: ["features"] },
            {
              from: "features",
              allow: [
                "components",
                "lib",
                ["features", { featureName: "${from.featureName}" }],
              ],
            },
          ],
        },
      ],
    },
  },
]);
