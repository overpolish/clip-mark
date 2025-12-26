import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => name);

export const rule = createRule({
  create: (context) => {
    return {
      VariableDeclarator(node) {
        const init = node.init;

        if (
          init &&
          init.type === "CallExpression" &&
          init.callee.type === "Identifier" &&
          init.callee.name === "tv"
        ) {
          const id = node.id;

          if (id.type === "Identifier" && !id.name.endsWith("Variants")) {
            context.report({
              fix: (fixer) => {
                return fixer.insertTextAfter(id, "Variants");
              },
              messageId: "requireTvVariantsSuffix",
              node: id,
            });
          }
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: "Require variables assigned from tv() to end with Variants.",
    },
    fixable: "code",
    messages: {
      requireTvVariantsSuffix:
        "Variables assigned from tailwind-variants (tv) must have names ending with 'Variants'.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "require-tv-variants-suffix",
});
