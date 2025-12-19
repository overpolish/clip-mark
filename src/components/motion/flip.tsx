import { motion, type MotionProps } from "motion/react";

type FlipProps = MotionProps & {
  children: React.ReactNode;
};

export function Flip({ children, ...props }: FlipProps) {
  return (
    <motion.div
      {...props}
      animate={{
        opacity: 1,
        rotateY: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        rotateY: 90,
        scale: 0.9,
      }}
      initial={{
        opacity: 0,
        rotateY: -90,
        scale: 0.9,
      }}
      transition={{
        damping: 20,
        mass: 0.5,
        stiffness: 400,
        type: "spring",
      }}
    >
      {children}
    </motion.div>
  );
}
