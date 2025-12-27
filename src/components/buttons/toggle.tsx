import { tv, type VariantProps } from "tailwind-variants";

import { separateVariantProps } from "@/lib/variants";

import {
  Toggle as TogglePrimitive,
  ToggleItem as ToggleItemPrimitive,
  ToggleHighlight as ToggleHighlightPrimitive,
  type ToggleProps as TogglePrimitiveProps,
  type ToggleItemProps as ToggleItemPrimitiveProps,
} from "./toggle.primitive";

const toggleVariants = tv({
  defaultVariants: {
    size: "default",
    variant: "default",
  },
  slots: {
    base: `
      relative rounded-md transition-shadow outline-none
      focus-visible:border-ring focus-visible:ring-[3px]
      focus-visible:ring-ring/50
      aria-invalid:ring-destructive/20
      dark:aria-invalid:ring-destructive/40
    `,
    content: `
      inline-flex items-center justify-center gap-2 rounded-md text-sm
      font-medium whitespace-nowrap
      transition-[color,background-color,box-shadow] duration-200 ease-in-out
      outline-none
      hover:bg-muted/40 hover:text-muted-foreground
      disabled:pointer-events-none disabled:opacity-50
      aria-invalid:border-destructive
      data-[state=on]:text-accent-foreground
      [&_svg]:pointer-events-none [&_svg]:shrink-0
      [&_svg:not([class*='size-'])]:size-4
    `,
  },
  variants: {
    size: {
      default: "h-9 min-w-9 px-2",
      icon: "size-9 text-[12px]",
      lg: "h-10 min-w-10 px-2.5",
      sm: "h-8 min-w-8 px-1.5",
    },
    variant: {
      default: "bg-transparent",
      outline: `
        border border-input bg-transparent shadow-xs
        hover:bg-accent/40 hover:text-accent-foreground
      `,
    },
  },
});

type ToggleProps = TogglePrimitiveProps &
  ToggleItemPrimitiveProps &
  VariantProps<typeof toggleVariants>;

/**
 * @public
 */
export function Toggle({
  className,
  defaultPressed,
  disabled,
  onPressedChange,
  pressed,
  ...allProps
}: ToggleProps) {
  const [variants, props] = separateVariantProps(allProps, toggleVariants);
  const { base, content } = toggleVariants({ ...variants });
  return (
    <TogglePrimitive
      className={base()}
      defaultPressed={defaultPressed}
      disabled={disabled}
      onPressedChange={onPressedChange}
      pressed={pressed}
    >
      <ToggleHighlightPrimitive className="rounded-md bg-accent" />
      <ToggleItemPrimitive className={content({ className })} {...props} />
    </TogglePrimitive>
  );
}
