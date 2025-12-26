import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => name);

export const rule = createRule({
  create: (context) => {
    const variantFunctions = new Set<string>();

    return {
      VariableDeclarator(node) {
        const init = node.init;
        const id = node.id;

        if (
          init &&
          init.type === "CallExpression" &&
          init.callee.type === "Identifier" &&
          init.callee.name === "tv" &&
          id.type === "Identifier"
        ) {
          variantFunctions.add(id.name);
          return;
        }

        if (
          init &&
          init.type === "CallExpression" &&
          init.callee.type === "Identifier" &&
          variantFunctions.has(init.callee.name) &&
          id.type === "Identifier"
        ) {
          const variableName = id.name;
          const functionName = init.callee.name;

          if (variableName !== "styles") {
            context.report({
              data: {
                functionName,
                variableName,
              },
              fix: (fixer) => {
                return fixer.replaceText(id, "styles");
              },
              messageId: "variantCallMustBeStyles",
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
      description:
        "Require variables assigned from ...Variants() calls to be named 'styles'.",
    },
    fixable: "code",
    messages: {
      variantCallMustBeStyles:
        "Variable '{{variableName}}' assigned from {{functionName}}() must be named 'styles' when no slots.",
    },
    schema: [],
    type: "suggestion",
  },
  name: "require-variants-call-styles-name",
});
