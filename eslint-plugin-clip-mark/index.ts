import { type TSESLint } from "@typescript-eslint/utils";
import { type Linter } from "eslint";

import { rule as noInlineClassname } from "./rules/no-inline-classname";
import { rule as requireTvVariantsSuffix } from "./rules/require-tv-variants-suffix";

const rules: TSESLint.FlatConfig.Plugin["rules"] = {
  "no-inline-classname": noInlineClassname,
  "require-tv-variants-suffix": requireTvVariantsSuffix,
};

const plugin = {
  configs: {} as Record<string, Linter.Config>,
  rules,
};

const recommended: Linter.Config = {
  name: "clip-mark/recommended",
  plugins: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    "clip-mark": plugin as any,
  },
  rules: {
    "clip-mark/no-inline-classname": "error",
    "clip-mark/require-tv-variants-suffix": "warn",
  },
};

plugin.configs = {
  recommended,
};

// eslint-disable-next-line no-restricted-exports
export default plugin;
