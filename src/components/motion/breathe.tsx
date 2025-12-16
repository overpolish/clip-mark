import { motion, MotionProps } from "motion/react";

type BreatheProps = MotionProps & {
  children: React.ReactNode;
};

function Breathe({ children, ...props }: BreatheProps) {
  return (
    <motion.div
      {...props}
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 5,
        ease: "backInOut",
        repeat: Infinity,
      }}
    >
      {children}
    </motion.div>
  );
}

export default Breathe;
