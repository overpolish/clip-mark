import { type TSESLint } from "@typescript-eslint/utils";
import { type Linter } from "eslint";

import { rule as limitedInlineClassName } from "./rules/limited-inline-classname";
import { rule as noInlineComponentProps } from "./rules/no-inline-component-props";
import { rule as requireTvVariantsSuffix } from "./rules/require-tv-variants-suffix";
import { rule as requireVariantsCallStylesName } from "./rules/require-variants-call-styles-name";

const rules: TSESLint.FlatConfig.Plugin["rules"] = {
  "limited-inline-classname": limitedInlineClassName,
  "no-inline-component-props": noInlineComponentProps,
  "require-tv-variants-suffix": requireTvVariantsSuffix,
  "require-variants-call-styles-name": requireVariantsCallStylesName,
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
    "clip-mark/limited-inline-classname": "error",
    "clip-mark/no-inline-component-props": "error",
    "clip-mark/require-tv-variants-suffix": "warn",
    "clip-mark/require-variants-call-styles-name": "warn",
  },
};

plugin.configs = {
  recommended,
};

// eslint-disable-next-line no-restricted-exports
export default plugin;
