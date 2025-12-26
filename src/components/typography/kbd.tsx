import { Fragment, type ComponentProps } from "react";

import { tv, type VariantProps } from "tailwind-variants";

const kbdVariants = tv({
  base: `
    pointer-events-none inline-flex h-5 w-fit min-w-5 items-center
    justify-center gap-1 rounded-sm border-b-2 border-muted-foreground
    bg-foreground px-1 font-sans text-xs font-medium text-background select-none
    in-data-[slot=tooltip-content]:bg-background/20
    in-data-[slot=tooltip-content]:text-background
    dark:in-data-[slot=tooltip-content]:bg-background/10
    [&_svg:not([class*='size-'])]:size-3
  `,
});

type KbdProps = ComponentProps<"kbd">;

/**
 * @public
 */
export function Kbd({ className, ...props }: KbdProps) {
  const styles = kbdVariants({ className });
  return <kbd className={styles} data-slot="kbd" {...props} />;
}

const kbdGroupVariants = tv({
  base: "inline-flex items-center gap-1",
});

type KbdGroupProps = ComponentProps<"div"> &
  VariantProps<typeof kbdGroupVariants> & {
    keys?: string[];
    withPlusSigns?: boolean;
  };

/**
 * @public
 */
export function KbdGroup({
  className,
  keys,
  withPlusSigns,
  ...props
}: KbdGroupProps) {
  const styles = kbdGroupVariants({ className });
  return (
    <kbd className={styles} data-slot="kbd-group" {...props}>
      {keys?.map((key, index) => (
        <Fragment key={index}>
          <Kbd>{key}</Kbd>
          {withPlusSigns && index < keys.length - 1 && <span>+</span>}
        </Fragment>
      ))}
    </kbd>
  );
}
