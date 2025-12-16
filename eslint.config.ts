import js from "@eslint/js";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import pluginBoundaries from "eslint-plugin-boundaries";
import perfectionist from "eslint-plugin-perfectionist";
import pluginReact from "eslint-plugin-react";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["routeTree.gen.ts"]),
  {
    extends: ["js/recommended"],
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { js },
  },
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  pluginReact.configs.flat["jsx-runtime"],
  {
    rules: {
      "func-style": ["error", "declaration"],
      "react/jsx-sort-props": [
        "error",
        {
          multiline: "last",
          reservedFirst: true,
          shorthandLast: true,
        },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
      ...eslintPluginBetterTailwindcss.configs["recommended-error"].rules,
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/index.css",
      },
    },
  },
  {
    plugins: { boundaries: pluginBoundaries },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { allow: ["lib"], disallow: ["features"], from: "components" },
            {
              allow: [
                "components",
                "lib",
                ["features", { featureName: "${from.featureName}" }],
              ],
              from: "features",
            },
          ],
        },
      ],
    },
    settings: {
      "boundaries/elements": [
        { capture: ["featureName"], pattern: "features/*", type: "features" },
        { pattern: "components/*", type: "components" },
        { pattern: "lib/*", type: "lib" },
      ],
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { perfectionist },
    rules: {
      "perfectionist/sort-exports": [
        "error",
        {
          ignoreCase: true,
          order: "asc",
          type: "alphabetical",
        },
      ],
      "perfectionist/sort-imports": [
        "error",
        {
          customGroups: [
            {
              elementNamePattern: ["^react$", "^react/.+", "^react-.+"],
              groupName: "react",
            },
          ],
          groups: [
            "type",
            "builtin",
            "react",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
          ],
          ignoreCase: true,
          newlinesBetween: 1,
          order: "asc",
          type: "alphabetical",
        },
      ],
      "perfectionist/sort-interfaces": [
        "error",
        {
          customGroups: {
            class: "^class$",
          },
          groups: [
            "required-property",
            "optional-property",
            "class",
            "required-method",
            "optional-method",
          ],
          order: "asc",
          type: "natural",
        },
      ],
      "perfectionist/sort-object-types": [
        "error",
        {
          customGroups: {
            class: "^class$",
          },
          groups: [
            "required-property",
            "optional-property",
            "class",
            "required-method",
            "optional-method",
          ],
          order: "asc",
          type: "natural",
        },
      ],
      "perfectionist/sort-objects": [
        "error",
        {
          ignoreCase: true,
          order: "asc",
          partitionByNewLine: true,
          type: "alphabetical",
        },
      ],
    },
  },
]);
