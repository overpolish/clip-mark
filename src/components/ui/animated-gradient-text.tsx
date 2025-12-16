import { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedGradientTextProps
  extends ComponentPropsWithoutRef<"div"> {
  colorFrom?: string;
  colorTo?: string;
  speed?: number;
}

export function AnimatedGradientText({
  children,
  className,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  speed = 1,
  ...props
}: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        `inline animate-gradient bg-linear-to-r from-(--color-from) via-(--color-to) to-(--color-from) bg-size-[var(--bg-size)_100%] bg-clip-text text-transparent`,
        className
      )}
      style={
        {
          "--bg-size": `${speed * 300}%`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </span>
  );
}
