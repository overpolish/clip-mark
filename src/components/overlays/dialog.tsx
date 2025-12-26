import { XIcon } from "lucide-react";
import { tv } from "tailwind-variants";

import {
  Dialog as DialogPrimitive,
  DialogContent as DialogContentPrimitive,
  DialogDescription as DialogDescriptionPrimitive,
  DialogFooter as DialogFooterPrimitive,
  DialogHeader as DialogHeaderPrimitive,
  DialogTitle as DialogTitlePrimitive,
  DialogTrigger as DialogTriggerPrimitive,
  DialogPortal as DialogPortalPrimitive,
  DialogOverlay as DialogOverlayPrimitive,
  DialogClose as DialogClosePrimitive,
  type DialogProps as DialogPrimitiveProps,
  type DialogContentProps as DialogContentPrimitiveProps,
  type DialogDescriptionProps as DialogDescriptionPrimitiveProps,
  type DialogFooterProps as DialogFooterPrimitiveProps,
  type DialogHeaderProps as DialogHeaderPrimitiveProps,
  type DialogTitleProps as DialogTitlePrimitiveProps,
  type DialogTriggerProps as DialogTriggerPrimitiveProps,
  type DialogOverlayProps as DialogOverlayPrimitiveProps,
  type DialogCloseProps as DialogClosePrimitiveProps,
} from "@/components/overlays/dialog.primitives";

type DialogProps = DialogPrimitiveProps;

/**
 * @public
 */
export function Dialog(props: DialogProps) {
  return <DialogPrimitive {...props} />;
}

type DialogTriggerProps = DialogTriggerPrimitiveProps;

/**
 * @public
 */
export function DialogTrigger(props: DialogTriggerProps) {
  return <DialogTriggerPrimitive {...props} />;
}

type DialogCloseProps = DialogClosePrimitiveProps;

/**
 * @public
 */
export function DialogClose(props: DialogCloseProps) {
  return <DialogClosePrimitive {...props} />;
}

const dialogOverlayVariants = tv({
  base: "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs",
});

type DialogOverlayProps = DialogOverlayPrimitiveProps;

function DialogOverlay({ className, ...props }: DialogOverlayProps) {
  const styles = dialogOverlayVariants({ className });
  return <DialogOverlayPrimitive className={styles} {...props} />;
}

const dialogContentVariants = tv({
  slots: {
    base: `
      fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]
      translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border
      bg-background p-6 shadow-lg
      sm:max-w-lg
    `,
    close: `
      absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background
      transition-opacity
      hover:opacity-100
      focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden
      disabled:pointer-events-none
      data-[state=open]:bg-accent data-[state=open]:text-muted-foreground
      [&_svg]:pointer-events-none [&_svg]:shrink-0
      [&_svg:not([class*='size-'])]:size-4
    `,
  },
});

type DialogContentProps = DialogContentPrimitiveProps & {
  showCloseButton?: boolean;
};

/**
 * @public
 */
export function DialogContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: DialogContentProps) {
  const { base, close } = dialogContentVariants();
  return (
    <DialogPortalPrimitive>
      <DialogOverlay />
      <DialogContentPrimitive className={base({ className })} {...props}>
        {children}
        {showCloseButton && (
          <DialogClosePrimitive className={close()}>
            <XIcon className="text-xs" />
            <span className="sr-only">Close</span>
          </DialogClosePrimitive>
        )}
      </DialogContentPrimitive>
    </DialogPortalPrimitive>
  );
}

const dialogHeaderVariants = tv({
  base: "flex flex-col gap-2 text-left",
});

type DialogHeaderProps = DialogHeaderPrimitiveProps;

/**
 * @public
 */
export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  const styles = dialogHeaderVariants({ className });
  return <DialogHeaderPrimitive className={styles} {...props} />;
}

const dialogFooterVariants = tv({
  base: `
    flex flex-col-reverse gap-2
    sm:flex-row sm:justify-end
  `,
});

type DialogFooterProps = DialogFooterPrimitiveProps;

/**
 * @public
 */
export function DialogFooter({ className, ...props }: DialogFooterProps) {
  const styles = dialogFooterVariants({ className });
  return <DialogFooterPrimitive className={styles} {...props} />;
}

const dialogTitleVariants = tv({
  base: "text-lg leading-none font-semibold",
});

type DialogTitleProps = DialogTitlePrimitiveProps;

/**
 * @public
 */
export function DialogTitle({ className, ...props }: DialogTitleProps) {
  const styles = dialogTitleVariants({ className });
  return <DialogTitlePrimitive className={styles} {...props} />;
}

const dialogDescriptionVariants = tv({
  base: "text-sm text-muted-foreground",
});

type DialogDescriptionProps = DialogDescriptionPrimitiveProps;

/**
 * @public
 */
export function DialogDescription({
  className,
  ...props
}: DialogDescriptionProps) {
  const styles = dialogDescriptionVariants({ className });
  return <DialogDescriptionPrimitive className={styles} {...props} />;
}
