import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => name);

const MAX_INLINE_CLASSES = 5;

function countClasses(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

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
        if (!value) return {};

        // className="..."
        if (
          value.type === AST_NODE_TYPES.Literal &&
          typeof value.value === "string"
        ) {
          if (countClasses(value.value) > MAX_INLINE_CLASSES) {
            context.report({
              messageId: "limitedInlineClassName",
              node,
            });
            return;
          }
        }

        if (value.type !== AST_NODE_TYPES.JSXExpressionContainer) return;

        const expr = value.expression;

        // className={`...`}
        if (
          expr.type === AST_NODE_TYPES.TemplateLiteral &&
          expr.expressions.length === 0
        ) {
          const raw = expr.quasis[0]?.value.cooked ?? "";
          if (countClasses(raw) > MAX_INLINE_CLASSES) {
            context.report({
              messageId: "limitedInlineClassName",
              node,
            });
            return;
          }
        }

        // className={"..."}
        if (
          expr.type === AST_NODE_TYPES.Literal &&
          typeof expr.value === "string"
        ) {
          if (countClasses(expr.value) > MAX_INLINE_CLASSES) {
            context.report({
              messageId: "limitedInlineClassName",
              node,
            });
            return;
          }
        }

        // Disallow cn()
        if (
          expr.type === AST_NODE_TYPES.CallExpression &&
          expr.callee.type === AST_NODE_TYPES.Identifier &&
          expr.callee.name === "cn"
        ) {
          context.report({
            messageId: "noCnInClassName",
            node,
          });
          return;
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: `Allow up to ${MAX_INLINE_CLASSES} inline class names; require use of tailwind-variants.`,
    },
    messages: {
      limitedInlineClassName: `Inline className may contain at most ${MAX_INLINE_CLASSES} class. Use tailwind-variants instead.`,
      noCnInClassName:
        "Using cn() in className is not allowed in component definition. Use tailwind-variants instead.",
    },
    schema: [],
    type: "problem",
  },
  name: "limited-inline-classname",
});
