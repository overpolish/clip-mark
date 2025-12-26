import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => name);

function isDisallowedType(node: TSESTree.TypeNode | null | undefined): boolean {
  if (!node) return false;

  switch (node.type) {
    case "TSTypeLiteral":
    case "TSIntersectionType":
    case "TSUnionType":
      return true;

    default:
      return false;
  }
}

function isReactComponent(node: TSESTree.FunctionDeclaration): boolean {
  if (!node.id?.name || !/^[A-Z]/.test(node.id.name)) {
    return false;
  }

  if (node.returnType) {
    const returnType = node.returnType.typeAnnotation;

    if (returnType.type === "TSTypeReference") {
      const typeName = returnType.typeName;
      if (typeName.type === "Identifier") {
        const name = typeName.name;
        if (
          name === "Element" ||
          name === "ReactElement" ||
          name === "ReactNode" ||
          name === "JSX"
        ) {
          return true;
        }
      }

      if (typeName.type === "TSQualifiedName") {
        if (
          typeName.left.type === "Identifier" &&
          (typeName.left.name === "JSX" || typeName.left.name === "React")
        ) {
          return true;
        }
      }
    }
  }

  return true;
}

export const rule = createRule({
  create: (context) => {
    return {
      FunctionDeclaration(node) {
        if (node.params.length === 0) return;

        if (!isReactComponent(node)) return;

        const param = node.params[0];
        if (
          param.type === "Identifier" &&
          param.typeAnnotation &&
          isDisallowedType(param.typeAnnotation.typeAnnotation)
        ) {
          context.report({
            messageId: "noInlineComponentProps",
            node: param.typeAnnotation,
          });
        }

        if (
          param.type === "ObjectPattern" &&
          param.typeAnnotation &&
          isDisallowedType(param.typeAnnotation.typeAnnotation)
        ) {
          context.report({
            messageId: "noInlineComponentProps",
            node: param.typeAnnotation,
          });
        }
      },
    };
  },
  defaultOptions: [],
  meta: {
    docs: {
      description:
        "Disallow inline object, intersection, or union types for React component props. Use a named type alias instead.",
    },
    fixable: "code",
    messages: {
      noInlineComponentProps:
        "Component props must use a named type alias (no inline object, intersection, or union types).",
    },
    schema: [],
    type: "problem",
  },
  name: "no-inline-component-props",
});
