import type * as React from "react";

import {
  Switch as SwitchPrimitive,
  SwitchThumb as SwitchThumbPrimitive,
  SwitchIcon as SwitchIconPrimitive,
  type SwitchProps as SwitchPrimitiveProps,
} from "@/components/animate-ui/primitives/radix/switch";
import { cn } from "@/lib/utils";

type SwitchProps = SwitchPrimitiveProps & {
  endIcon?: React.ReactElement;
  pressedWidth?: number;
  startIcon?: React.ReactElement;
  thumbIcon?: React.ReactElement;
};

function Switch({
  className,
  endIcon,
  pressedWidth = 19,
  startIcon,
  thumbIcon,
  ...props
}: SwitchProps) {
  return (
    <SwitchPrimitive
      className={cn(
        "peer relative flex h-5 w-8 shrink-0 items-center justify-start rounded-full border border-transparent px-px shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:justify-end data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80",
        className
      )}
      {...props}
    >
      <SwitchThumbPrimitive
        pressedAnimation={{ width: pressedWidth }}
        className={cn(
          "pointer-events-none relative z-10 block size-4 rounded-full bg-background ring-0 dark:data-[state=checked]:bg-primary-foreground dark:data-[state=unchecked]:bg-foreground"
        )}
      >
        {thumbIcon && (
          <SwitchIconPrimitive
            className="absolute top-1/2 left-1/2 -translate-1/2 text-neutral-400 dark:text-neutral-500 [&_svg]:size-2.25"
            position="thumb"
          >
            {thumbIcon}
          </SwitchIconPrimitive>
        )}
      </SwitchThumbPrimitive>

      <SwitchIconPrimitive
        className="absolute top-1/2 left-0.5 flex -translate-y-1/2 items-center text-neutral-400 dark:text-neutral-500 [&_svg]:size-2.25 [&_svg]:text-[8px]"
        position="left"
      >
        {startIcon ?? (
          <span className="justify-self-center text-[6px]">ON</span>
        )}
      </SwitchIconPrimitive>
      {endIcon && (
        <SwitchIconPrimitive
          className="absolute top-1/2 right-0.5 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 [&_svg]:size-2.25"
          position="right"
        >
          {endIcon}
        </SwitchIconPrimitive>
      )}
    </SwitchPrimitive>
  );
}

export { Switch, type SwitchProps };
