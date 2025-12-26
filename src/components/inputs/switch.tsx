import { type ReactElement } from "react";

import { tv, type VariantProps } from "tailwind-variants";

import {
  Switch as SwitchPrimitive,
  SwitchThumb as SwitchThumbPrimitive,
  SwitchIcon as SwitchIconPrimitive,
  type SwitchProps as SwitchPrimitiveProps,
} from "@/components/inputs/switch.primitives";
import { separateVariantProps } from "@/lib/variants";

const switchVariants = tv({
  defaultVariants: {
    size: "default",
  },
  slots: {
    base: `
      peer relative flex shrink-0 items-center justify-start rounded-full border
      border-transparent px-px shadow-xs transition-colors outline-none
      focus-visible:border-ring focus-visible:ring-[3px]
      focus-visible:ring-ring/50
      disabled:cursor-not-allowed disabled:opacity-50
      data-[state=checked]:justify-end data-[state=checked]:bg-primary
      data-[state=unchecked]:bg-input
      dark:data-[state=unchecked]:bg-input/80
    `,
    icon: `
      absolute top-1/2 flex -translate-y-1/2 items-center text-neutral-400
      dark:text-neutral-500
    `,
    thumb: `
      pointer-events-none relative z-10 block rounded-full bg-background ring-0
      dark:data-[state=checked]:bg-primary-foreground
      dark:data-[state=unchecked]:bg-foreground
    `,
  },
  variants: {
    size: {
      default: {
        icon: "text-[8px]",
        root: "h-5 w-8",
        thumb: "size-4",
      },
      sm: {
        icon: "text-[6px]",
        root: "h-4 w-7",
        thumb: "size-3",
      },
    },
  },
});

type SwitchProps = SwitchPrimitiveProps &
  VariantProps<typeof switchVariants> & {
    endIcon?: ReactElement;
    pressedWidth?: number;
    startIcon?: ReactElement;
    thumbIcon?: ReactElement;
  };

export function Switch({
  className,
  endIcon,
  pressedWidth = 19,
  startIcon,
  thumbIcon,
  ...allProps
}: SwitchProps) {
  const [variants, props] = separateVariantProps(allProps, switchVariants);
  const { base, icon, thumb } = switchVariants({ ...variants });
  return (
    <SwitchPrimitive className={base({ className })} {...props}>
      <SwitchThumbPrimitive
        className={thumb()}
        pressedAnimation={{ width: pressedWidth }}
      >
        {thumbIcon && (
          <SwitchIconPrimitive
            className={icon({ className: "left-1/2 -translate-1/2" })}
            position="thumb"
          >
            {thumbIcon}
          </SwitchIconPrimitive>
        )}
      </SwitchThumbPrimitive>

      <SwitchIconPrimitive
        className={icon({ className: "left-0.5" })}
        position="left"
      >
        {startIcon ?? <span className="justify-self-center">ON</span>}
      </SwitchIconPrimitive>

      {endIcon && (
        <SwitchIconPrimitive
          className={icon({ className: "right-0.5" })}
          position="right"
        >
          {endIcon}
        </SwitchIconPrimitive>
      )}
    </SwitchPrimitive>
  );
}
