import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { tv } from "tailwind-variants";

const separatorVariants = tv({
  base: `
    shrink-0 bg-border
    data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full
    data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px
  `,
});

type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive.Root>;

/**
 * @public
 */
export function Separator({
  className,
  decorative = true,
  orientation = "horizontal",
  ...props
}: SeparatorProps) {
  const styles = separatorVariants({ className });
  return (
    <SeparatorPrimitive.Root
      className={styles}
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  );
}
