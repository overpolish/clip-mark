import { type ComponentProps } from "react";

import * as LabelPrimitive from "@radix-ui/react-label";
import { tv } from "tailwind-variants";

const labelVariants = tv({
  base: `
    flex items-center gap-2 text-sm leading-none font-medium select-none
    group-data-[disabled=true]:pointer-events-none
    group-data-[disabled=true]:opacity-50
    peer-disabled:cursor-not-allowed peer-disabled:opacity-50
  `,
});

type LabelProps = ComponentProps<typeof LabelPrimitive.Root>;

/**
 * @public
 */
export function Label({ className, ...props }: LabelProps) {
  const styles = labelVariants({ className });
  return (
    <LabelPrimitive.Root className={styles} data-slot="label" {...props} />
  );
}
