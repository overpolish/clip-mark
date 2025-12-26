// Flattened intellisense for types
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Split props into variant props and remaining props
 * @public
 */
export function separateVariantProps<
  Props extends Record<string, unknown>,
  Variants extends Record<string, unknown>
>(
  props: Props,
  tvVariants: { variants?: Variants }
): [
  Prettify<Pick<Props, Extract<keyof Props, keyof Variants>>>,
  Prettify<Omit<Props, keyof Variants>>
] {
  const variantKeys = new Set(
    tvVariants.variants ? Object.keys(tvVariants.variants) : []
  );

  const variantProps: Record<string, unknown> = {};
  const componentProps: Record<string, unknown> = {};

  for (const key in props) {
    if (variantKeys.has(key)) {
      variantProps[key] = props[key];
    } else {
      componentProps[key] = props[key];
    }
  }

  return [
    variantProps as Prettify<Pick<Props, Extract<keyof Props, keyof Variants>>>,
    componentProps as Prettify<Omit<Props, keyof Variants>>,
  ];
}
