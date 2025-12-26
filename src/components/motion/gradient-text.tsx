import { type CSSProperties, type ComponentPropsWithoutRef } from "react";

import { tv } from "tailwind-variants";

const animatedGradientTextVariants = tv({
  base: `
    inline animate-gradient bg-linear-to-r from-(--color-from) via-(--color-to)
    to-(--color-from) bg-size-[var(--bg-size)_100%] bg-clip-text
    text-transparent
  `,
});

type AnimatedGradientTextProps = {
  colorFrom?: string;
  colorTo?: string;
  speed?: number;
} & ComponentPropsWithoutRef<"div">;

/**
 * @public
 */
export function AnimatedGradientText({
  children,
  className,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  speed = 1,
  ...props
}: AnimatedGradientTextProps) {
  const styles = animatedGradientTextVariants({ className });
  return (
    <span
      className={styles}
      style={
        {
          "--bg-size": `${speed * 300}%`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </span>
  );
}
