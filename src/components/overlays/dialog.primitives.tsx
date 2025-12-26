import { type ComponentProps } from "react";

import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { useControlledState } from "@/hooks/use-controlled-state";
import { getStrictContext } from "@/lib/get-strict-context";

/**
 * @public
 */
export type DialogContextType = {
  isOpen: boolean;
  setIsOpen: DialogProps["onOpenChange"];
};

const [DialogProvider, useDialog] =
  getStrictContext<DialogContextType>("DialogContext");

/**
 * @public
 */
export type DialogProps = ComponentProps<typeof DialogPrimitive.Root>;

/**
 * @public
 */
export function Dialog(props: DialogProps) {
  const [isOpen, setIsOpen] = useControlledState({
    defaultValue: props?.defaultOpen,
    onChange: props?.onOpenChange,
    value: props?.open,
  });

  return (
    <DialogProvider value={{ isOpen, setIsOpen }}>
      <DialogPrimitive.Root
        data-slot="dialog"
        {...props}
        onOpenChange={setIsOpen}
      />
    </DialogProvider>
  );
}

/**
 * @public
 */
export type DialogTriggerProps = ComponentProps<typeof DialogPrimitive.Trigger>;

/**
 * @public
 */
export function DialogTrigger(props: DialogTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/**
 * @public
 */
export type DialogPortalProps = Omit<
  ComponentProps<typeof DialogPrimitive.Portal>,
  "forceMount"
>;

/**
 * @public
 */
export function DialogPortal(props: DialogPortalProps) {
  const { isOpen } = useDialog();

  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPrimitive.Portal
          data-slot="dialog-portal"
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
export type DialogOverlayProps = Omit<
  ComponentProps<typeof DialogPrimitive.Overlay>,
  "forceMount" | "asChild"
> &
  HTMLMotionProps<"div">;

/**
 * @public
 */
export function DialogOverlay({
  transition = { duration: 0.2, ease: "easeInOut" },
  ...props
}: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay data-slot="dialog-overlay" asChild forceMount>
      <motion.div
        key="dialog-overlay"
        animate={{ filter: "blur(0px)", opacity: 1 }}
        exit={{ filter: "blur(4px)", opacity: 0 }}
        initial={{ filter: "blur(4px)", opacity: 0 }}
        transition={transition}
        {...props}
      />
    </DialogPrimitive.Overlay>
  );
}

/**
 * @public
 */
export type DialogFlipDirection = "top" | "bottom" | "left" | "right";

/**
 * @public
 */
export type DialogContentProps = Omit<
  ComponentProps<typeof DialogPrimitive.Content>,
  "forceMount" | "asChild"
> &
  HTMLMotionProps<"div"> & {
    from?: DialogFlipDirection;
  };

/**
 * @public
 */
export function DialogContent({
  from = "top",
  onCloseAutoFocus,
  onEscapeKeyDown,
  onInteractOutside,
  onOpenAutoFocus,
  onPointerDownOutside,
  transition = { damping: 25, stiffness: 150, type: "spring" },
  ...props
}: DialogContentProps) {
  const initialRotation =
    from === "bottom" || from === "left" ? "20deg" : "-20deg";
  const isVertical = from === "top" || from === "bottom";
  const rotateAxis = isVertical ? "rotateX" : "rotateY";

  return (
    <DialogPrimitive.Content
      onCloseAutoFocus={onCloseAutoFocus}
      onEscapeKeyDown={onEscapeKeyDown}
      onInteractOutside={onInteractOutside}
      onOpenAutoFocus={onOpenAutoFocus}
      onPointerDownOutside={onPointerDownOutside}
      asChild
      forceMount
    >
      <motion.div
        key="dialog-content"
        data-slot="dialog-content"
        transition={transition}
        animate={{
          filter: "blur(0px)",
          opacity: 1,
          transform: `perspective(500px) ${rotateAxis}(0deg) scale(1)`,
        }}
        exit={{
          filter: "blur(4px)",
          opacity: 0,
          transform: `perspective(500px) ${rotateAxis}(${initialRotation}) scale(0.8)`,
        }}
        initial={{
          filter: "blur(4px)",
          opacity: 0,
          transform: `perspective(500px) ${rotateAxis}(${initialRotation}) scale(0.8)`,
        }}
        {...props}
      />
    </DialogPrimitive.Content>
  );
}

/**
 * @public
 */
export type DialogCloseProps = ComponentProps<typeof DialogPrimitive.Close>;

/**
 * @public
 */
export function DialogClose(props: DialogCloseProps) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * @public
 */
export type DialogHeaderProps = ComponentProps<"div">;

/**
 * @public
 */
export function DialogHeader(props: DialogHeaderProps) {
  return <div data-slot="dialog-header" {...props} />;
}

/**
 * @public
 */
export type DialogFooterProps = ComponentProps<"div">;

/**
 * @public
 */
export function DialogFooter(props: DialogFooterProps) {
  return <div data-slot="dialog-footer" {...props} />;
}

/**
 * @public
 */
export type DialogTitleProps = ComponentProps<typeof DialogPrimitive.Title>;

/**
 * @public
 */
export function DialogTitle(props: DialogTitleProps) {
  return <DialogPrimitive.Title data-slot="dialog-title" {...props} />;
}

/**
 * @public
 */
export type DialogDescriptionProps = ComponentProps<
  typeof DialogPrimitive.Description
>;

/**
 * @public
 */
export function DialogDescription(props: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description data-slot="dialog-description" {...props} />
  );
}
