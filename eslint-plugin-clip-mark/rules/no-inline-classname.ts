import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => name);

export const rule = createRule({
  create: (context) => {
    const fileName = context.filename;

    if (!fileName.replace(/\\/g, "/").includes("/components/")) {
      return {};
    }

    return {
      JSXAttribute(node) {
        if (node.name.name !== "className") return {};

        const value = node.value;

        if (value?.type === "Literal" && typeof value.value === "string") {
          context.report({
            messageId: "noInlineClassname",
            node,
          });
        }

        if (value?.type === "JSXExpressionContainer") {
          const expr = value.expression;
          if (
            expr.type === "TemplateLiteral" &&
            expr.expressions.length === 0
          ) {
            context.report({
              messageId: "noInlineClassname",
              node,
            });
          }

          if (expr.type === "Literal" && typeof expr.value === "string") {
            context.report({
              messageId: "noInlineClassname",
              node,
            });
          }
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Disallow inline class names; enforce use of tailwind-variants.",
    },
    messages: {
      noInlineClassname:
        "Inline class names are not allowed in component definition. Use tailwind-variants instead.",
    },
    schema: [],
    type: "problem",
  },
  name: "no-inline-classname",
});
