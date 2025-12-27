import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { useControlledState } from "@/hooks/use-controlled-state";
import { getStrictContext } from "@/lib/get-strict-context";

type PopoverContextType = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

const [PopoverProvider, usePopover] =
  getStrictContext<PopoverContextType>("PopoverContext");

/**
 * @public
 */
export type PopoverProps = React.ComponentProps<typeof PopoverPrimitive.Root>;

/**
 * @public
 */
export function Popover(props: PopoverProps) {
  const [isOpen, setIsOpen] = useControlledState({
    defaultValue: props?.defaultOpen,
    onChange: props?.onOpenChange,
    value: props?.open,
  });

  return (
    <PopoverProvider value={{ isOpen, setIsOpen }}>
      <PopoverPrimitive.Root
        data-slot="popover"
        {...props}
        onOpenChange={setIsOpen}
      />
    </PopoverProvider>
  );
}

/**
 * @public
 */
export type PopoverTriggerProps = React.ComponentProps<
  typeof PopoverPrimitive.Trigger
>;

/**
 * @public
 */
export function PopoverTrigger(props: PopoverTriggerProps) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/**
 * @public
 */
export type PopoverPortalProps = Omit<
  React.ComponentProps<typeof PopoverPrimitive.Portal>,
  "forceMount"
>;

/**
 * @public
 */
export function PopoverPortal(props: PopoverPortalProps) {
  const { isOpen } = usePopover();

  return (
    <AnimatePresence>
      {isOpen && (
        <PopoverPrimitive.Portal
          data-slot="popover-portal"
          forceMount
          {...props}
        />
      )}
    </AnimatePresence>
  );
}

/**
 * @public
 */
export type PopoverContentProps = Omit<
  React.ComponentProps<typeof PopoverPrimitive.Content>,
  "forceMount" | "asChild"
> &
  HTMLMotionProps<"div">;

/**
 * @public
 */
export function PopoverContent({
  align,
  alignOffset,
  arrowPadding,
  avoidCollisions,
  collisionBoundary,
  collisionPadding,
  hideWhenDetached,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onFocusOutside,
  onInteractOutside,
  onOpenAutoFocus,
  onPointerDownOutside,
  side,
  sideOffset,
  sticky,
  transition = { damping: 25, stiffness: 300, type: "spring" },
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Content
      align={align}
      alignOffset={alignOffset}
      arrowPadding={arrowPadding}
      avoidCollisions={avoidCollisions}
      collisionBoundary={collisionBoundary}
      collisionPadding={collisionPadding}
      hideWhenDetached={hideWhenDetached}
      onCloseAutoFocus={onCloseAutoFocus}
      onEscapeKeyDown={onEscapeKeyDown}
      onFocusOutside={onFocusOutside}
      onInteractOutside={onInteractOutside}
      onOpenAutoFocus={onOpenAutoFocus}
      onPointerDownOutside={onPointerDownOutside}
      side={side}
      sideOffset={sideOffset}
      sticky={sticky}
      asChild
      forceMount
    >
      <motion.div
        key="popover-content"
        animate={{ opacity: 1, scale: 1 }}
        data-slot="popover-content"
        exit={{ opacity: 0, scale: 0.5 }}
        initial={{ opacity: 0, scale: 0.5 }}
        transition={transition}
        {...props}
      />
    </PopoverPrimitive.Content>
  );
}

/**
 * @public
 */
export type PopoverAnchorProps = React.ComponentProps<
  typeof PopoverPrimitive.Anchor
>;

/**
 * @public
 */
export function PopoverAnchor({ ...props }: PopoverAnchorProps) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

/**
 * @public
 */
export type PopoverArrowProps = React.ComponentProps<
  typeof PopoverPrimitive.Arrow
>;

/**
 * @public
 */
export function PopoverArrow(props: PopoverArrowProps) {
  return <PopoverPrimitive.Arrow data-slot="popover-arrow" {...props} />;
}

/**
 * @public
 */
export type PopoverCloseProps = React.ComponentProps<
  typeof PopoverPrimitive.Close
>;

/**
 * @public
 */
export function PopoverClose(props: PopoverCloseProps) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}
