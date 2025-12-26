import { type ReactNode } from "react";

import { motion, type MotionProps } from "motion/react";

type ShadowPulseProps = MotionProps & {
  children: ReactNode;
  brightest?: string;
  dimmest?: string;
};

/**
 * @public
 */
export function ShadowPulse({
  brightest = "rgba(251,191,36,0.6)",
  children,
  dimmest = "rgba(251,191,36,0.3)",
  ...props
}: ShadowPulseProps) {
  return (
    <motion.div
      {...props}
      animate={{
        filter: [
          `drop-shadow(0 0 6px ${dimmest})`,
          `drop-shadow(0 0 10px ${brightest})`,
          `drop-shadow(0 0 6px ${dimmest})`,
        ],
      }}
      transition={{
        duration: 5,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      {children}
    </motion.div>
  );
}
