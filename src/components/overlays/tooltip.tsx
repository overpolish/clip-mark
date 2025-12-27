import { type ReactNode } from "react";

import { motion } from "motion/react";
import { tv } from "tailwind-variants";

import {
  TooltipProvider as TooltipProviderPrimitive,
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
  TooltipContent as TooltipContentPrimitive,
  TooltipArrow as TooltipArrowPrimitive,
  type TooltipProviderProps as TooltipProviderPrimitiveProps,
  type TooltipProps as TooltipPrimitiveProps,
  type TooltipTriggerProps as TooltipTriggerPrimitiveProps,
  type TooltipContentProps as TooltipContentPrimitiveProps,
} from "@/components/overlays/tooltip.primitive";

type TooltipProviderProps = TooltipProviderPrimitiveProps;

/**
 * @public
 */
export function TooltipProvider({
  openDelay = 0,
  ...props
}: TooltipProviderProps) {
  return <TooltipProviderPrimitive openDelay={openDelay} {...props} />;
}

type TooltipProps = TooltipPrimitiveProps;

/**
 * @public
 */
export function Tooltip({ sideOffset = 10, ...props }: TooltipProps) {
  return <TooltipPrimitive sideOffset={sideOffset} {...props} />;
}

type TooltipTriggerProps = TooltipTriggerPrimitiveProps;

/**
 * @public
 */
export function TooltipTrigger({ ...props }: TooltipTriggerProps) {
  return <TooltipTriggerPrimitive {...props} />;
}

const tooltipContentVariants = tv({
  slots: {
    arrow: `
      size-3 fill-primary
      data-[side='bottom']:translate-y-px
      data-[side='left']:-translate-x-px
      data-[side='right']:translate-x-px
      data-[side='top']:-translate-y-px
    `,
    base: "z-50 w-fit rounded-md bg-primary text-primary-foreground",
  },
});

type TooltipContentProps = Omit<TooltipContentPrimitiveProps, "asChild"> & {
  children: ReactNode;
  layout?: boolean | "position" | "size" | "preserve-aspect";
  showArrow?: boolean;
};

/**
 * @public
 */
export function TooltipContent({
  children,
  className,
  layout = "preserve-aspect",
  showArrow = true,
  ...props
}: TooltipContentProps) {
  const { arrow, base } = tooltipContentVariants();
  return (
    <TooltipContentPrimitive className={base({ className })} {...props}>
      <motion.div className="overflow-hidden px-3 py-1.5 text-xs text-balance">
        <motion.div layout={layout}>{children}</motion.div>
      </motion.div>
      {showArrow && <TooltipArrowPrimitive className={arrow()} tipRadius={2} />}
    </TooltipContentPrimitive>
  );
}
