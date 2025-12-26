import { type ComponentProps } from "react";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { tv } from "tailwind-variants";

type PopoverProps = ComponentProps<typeof PopoverPrimitive.Root>;

/**
 * @public
 */
export function Popover({ ...props }: PopoverProps) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

type PopoverTriggerProps = ComponentProps<typeof PopoverPrimitive.Trigger>;

/**
 * @public
 */
export function PopoverTrigger({ ...props }: PopoverTriggerProps) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

const popoverContentVariants = tv({
  base: `
    z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md
    border bg-popover p-4 text-popover-foreground shadow-md outline-hidden
    data-[side=bottom]:slide-in-from-top-2
    data-[side=left]:slide-in-from-right-2
    data-[side=right]:slide-in-from-left-2
    data-[side=top]:slide-in-from-bottom-2
    data-[state=closed]:animate-out data-[state=closed]:fade-out-0
    data-[state=closed]:zoom-out-95
    data-[state=open]:animate-in data-[state=open]:fade-in-0
    data-[state=open]:zoom-in-95
  `,
});

type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Content>;

/**
 * @public
 */
export function PopoverContent({
  align = "center",
  className,
  sideOffset = 4,
  ...props
}: PopoverContentProps) {
  const styles = popoverContentVariants({ className });
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        className={styles}
        data-slot="popover-content"
        sideOffset={sideOffset}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

type PopoverAnchorProps = ComponentProps<typeof PopoverPrimitive.Anchor>;

/**
 * @public
 */
export function PopoverAnchor({ ...props }: PopoverAnchorProps) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}
