import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const buttonGroupVariants = cva(
  "relative flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([classbutton='w-'])]:w-fit [&>button]:focus-visible:relative [&>button]:focus-visible:z-10 [&>input]:flex-1",
  {
    defaultVariants: {
      orientation: "horizontal",
    },
    variants: {
      orientation: {
        horizontal:
          "[&>button:not(:first-of-type)]:rounded-l-none [&>button:not(:first-of-type)]:border-l-0 [&>button:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>button:not(:first-of-type)]:rounded-t-none [&>button:not(:first-of-type)]:border-t-0 [&>button:not(:last-child)]:rounded-b-none",
      },
    },
  }
);

function ButtonGroup({
  className,
  orientation,
  pulsate,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof buttonGroupVariants> & {
    pulsate?: boolean;
  }) {
  return (
    <div
      className={cn(buttonGroupVariants({ orientation }), className)}
      data-orientation={orientation}
      data-slot="button-group"
      role="group"
      {...props}
    >
      {pulsate && (
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 -z-1 size-full -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-md"
          id="button-group-pulsate"
          style={
            {
              "--duration": "2000ms",
              "--pulse-color": "var(--color-muted)",
            } as React.CSSProperties
          }
        />
      )}

      {props.children}
    </div>
  );
}

function ButtonGroupText({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted px-4 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([classbutton='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "relative m-0! self-stretch bg-input data-[orientation=vertical]:h-auto",
        className
      )}
      {...props}
    />
  );
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
};
