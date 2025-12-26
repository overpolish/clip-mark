import { Slot } from "@radix-ui/react-slot";
import { tv, type VariantProps } from "tailwind-variants";

import { Separator } from "@/components/miscellaneous/separator";
import { separateVariantProps } from "@/lib/variants";

const buttonGroupVariants = tv({
  defaultVariants: {
    orientation: "horizontal",
  },
  slots: {
    base: `
      relative flex w-fit items-stretch
      has-[>[data-slot=button-group]]:gap-2
      has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md
      [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit
      [&>button]:focus-visible:relative [&>button]:focus-visible:z-10
      [&>input]:flex-1
    `,
    pulsate: `
      pointer-events-none absolute top-1/2 left-1/2 -z-1 size-full
      -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-md
      [--duration:2000ms]
      [--pulse-color:var(--color-muted)]
    `,
  },
  variants: {
    orientation: {
      horizontal: {
        base: `
          [&>button:not(:first-of-type)]:rounded-l-none
          [&>button:not(:first-of-type)]:border-l-0
          [&>button:not(:last-child)]:rounded-r-none
        `,
      },
      vertical: {
        base: `
          flex-col
          [&>button:not(:first-of-type)]:rounded-t-none
          [&>button:not(:first-of-type)]:border-t-0
          [&>button:not(:last-child)]:rounded-b-none
        `,
      },
    },
  },
});

/**
 *
 * @public
 */
export function ButtonGroup({
  className,
  pulsate,
  ...allProps
}: React.ComponentProps<"div"> &
  VariantProps<typeof buttonGroupVariants> & {
    pulsate?: boolean;
  }) {
  const [variants, props] = separateVariantProps(allProps, buttonGroupVariants);
  const { base, pulsate: pulsateStyles } = buttonGroupVariants({ ...variants });
  return (
    <div
      className={base({ className })}
      data-orientation={variants.orientation}
      data-slot="button-group"
      role="group"
      {...props}
    >
      {pulsate && <div className={pulsateStyles()} />}
      {props.children}
    </div>
  );
}

const buttonGroupTextVariants = tv({
  base: `
    flex items-center gap-2 rounded-md border bg-muted px-4 text-sm font-medium
    shadow-xs
    [&_svg]:pointer-events-none
    [&_svg:not([class*='size-'])]:size-4
  `,
});

/**
 *
 * @public
 */
export function ButtonGroupText({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "div";
  const styles = buttonGroupTextVariants({ className });
  return <Comp className={styles} {...props} />;
}

const buttonGroupSeparatorVariants = tv({
  base: `
    relative m-0! self-stretch bg-input
    data-[orientation=vertical]:h-auto
  `,
});

/**
 * @public
 */
export function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  const styles = buttonGroupSeparatorVariants({ className });
  return (
    <Separator
      className={styles}
      data-slot="button-group-separator"
      orientation={orientation}
      {...props}
    />
  );
}
