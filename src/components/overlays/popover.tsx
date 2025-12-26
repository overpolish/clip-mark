import { tv } from "tailwind-variants";

import {
  Popover as PopoverPrimitive,
  PopoverTrigger as PopoverTriggerPrimitive,
  PopoverContent as PopoverContentPrimitive,
  PopoverPortal as PopoverPortalPrimitive,
  PopoverClose as PopoverClosePrimitive,
  type PopoverProps as PopoverPrimitiveProps,
  type PopoverTriggerProps as PopoverTriggerPrimitiveProps,
  type PopoverContentProps as PopoverContentPrimitiveProps,
  type PopoverCloseProps as PopoverClosePrimitiveProps,
} from "./popover.primitive";

type PopoverProps = PopoverPrimitiveProps;

/**
 * @public
 */
export function Popover(props: PopoverProps) {
  return <PopoverPrimitive {...props} />;
}

type PopoverTriggerProps = PopoverTriggerPrimitiveProps;

/**
 * @public
 */
export function PopoverTrigger(props: PopoverTriggerProps) {
  return <PopoverTriggerPrimitive {...props} />;
}

const popoverContentVariants = tv({
  base: `
    z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md
    border bg-popover p-4 text-popover-foreground shadow-md outline-hidden
  `,
});

type PopoverContentProps = PopoverContentPrimitiveProps;

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
    <PopoverPortalPrimitive>
      <PopoverContentPrimitive
        align={align}
        className={styles}
        sideOffset={sideOffset}
        {...props}
      />
    </PopoverPortalPrimitive>
  );
}

type PopoverCloseProps = PopoverClosePrimitiveProps;

/**
 * @public
 */
export function PopoverClose(props: PopoverCloseProps) {
  return <PopoverClosePrimitive {...props} />;
}
