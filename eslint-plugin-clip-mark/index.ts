import { rule as noInlineClassname } from "./rules/no-inline-classname";

// eslint-disable-next-line no-restricted-exports
export default {
  rules: {
    "no-inline-classname": noInlineClassname as unknown,
  },
};
