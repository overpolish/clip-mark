import type * as React from "react";

import { cx, scv } from "css-variants";

import {
  Switch as SwitchPrimitive,
  SwitchThumb as SwitchThumbPrimitive,
  SwitchIcon as SwitchIconPrimitive,
  type SwitchProps as SwitchPrimitiveProps,
} from "@/components/animate-ui/primitives/radix/switch";

const switchStyles = scv({
  base: {
    icon: [
      "absolute top-1/2 -translate-y-1/2",
      "flex items-center",
      "text-neutral-400 dark:text-neutral-500",
    ],
    root: [
      "peer relative flex shrink-0 items-center justify-start px-px",
      "rounded-full border border-transparent shadow-xs transition-colors outline-none",
      "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:justify-end data-[state=checked]:bg-primary",
      "data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
    ],
    thumb: [
      "pointer-events-none relative z-10 block rounded-full",
      "bg-background ring-0",
      "dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground",
    ],
  },
  defaultVariants: {
    size: "default",
  },
  slots: ["root", "thumb", "icon"],
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
  Parameters<typeof switchStyles>[0] & {
    endIcon?: React.ReactElement;
    pressedWidth?: number;
    startIcon?: React.ReactElement;
    thumbIcon?: React.ReactElement;
  };

function Switch({
  className,
  endIcon,
  pressedWidth = 19,
  size,
  startIcon,
  thumbIcon,
  ...props
}: SwitchProps) {
  const { icon, root, thumb } = switchStyles({ size });

  return (
    <SwitchPrimitive className={cx(root, className)} {...props}>
      <SwitchThumbPrimitive
        className={thumb}
        pressedAnimation={{ width: pressedWidth }}
      >
        {thumbIcon && (
          <SwitchIconPrimitive
            className={cx(icon, "left-1/2 -translate-1/2")}
            position="thumb"
          >
            {thumbIcon}
          </SwitchIconPrimitive>
        )}
      </SwitchThumbPrimitive>

      <SwitchIconPrimitive className={cx(icon, "left-0.5")} position="left">
        {startIcon ?? <span className="justify-self-center">ON</span>}
      </SwitchIconPrimitive>
      {endIcon && (
        <SwitchIconPrimitive className={cx(icon, "right-0.5")} position="right">
          {endIcon}
        </SwitchIconPrimitive>
      )}
    </SwitchPrimitive>
  );
}

export { Switch, type SwitchProps };
