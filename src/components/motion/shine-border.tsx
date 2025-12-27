import { type HTMLAttributes } from "react";

import { tv } from "tailwind-variants";

const shineBorderVariants = tv({
  base: `
    pointer-events-none absolute inset-0 size-full rounded-[inherit]
    bg-[radial-gradient(transparent,transparent,var(--color-shine),transparent,transparent)]
    bg-size-[300%_300%] mask-exclude p-(--border-width)
    will-change-[background-position]
    [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]
    motion-safe:animate-shine
  `,
});

type ShineBorderProps = {
  /**
   * Width of the border in pixels
   * @default 1
   */
  borderWidth?: number;
  /**
   * Duration of the animation in seconds
   * @default 14
   */
  duration?: number;
  /**
   * Color of the border, can be a single color or an array of colors
   * @default "#000000"
   */
  shineColor?: string | string[];
} & HTMLAttributes<HTMLDivElement>;

/**
 * Shine Border
 *
 * An animated background border effect component with configurable properties.
 * @public
 */
export function ShineBorder({
  borderWidth = 1,
  className,
  duration = 14,
  shineColor = "#000000",
  ...props
}: ShineBorderProps) {
  const styles = shineBorderVariants({ className });
  return (
    <div
      className={styles}
      style={
        {
          "--border-width": `${borderWidth}px`,
          "--color-shine": Array.isArray(shineColor)
            ? shineColor.join(",")
            : shineColor,
          "--duration": `${duration}s`,
          // Arbitrary tailwind does not support webkit mask properties
          WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMaskComposite: "xor",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
