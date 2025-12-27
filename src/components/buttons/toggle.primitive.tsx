import { type ReactNode, type ComponentProps } from "react";

import { motion, AnimatePresence, type HTMLMotionProps } from "motion/react";
import { Toggle as TogglePrimitive } from "radix-ui";

import { useControlledState } from "@/hooks/use-controlled-state";
import { getStrictContext } from "@/lib/get-strict-context";

type ToggleContextType = {
  isPressed: boolean;
  disabled?: boolean;
  setIsPressed: (isPressed: boolean) => void;
};

const [ToggleProvider, useToggle] =
  getStrictContext<ToggleContextType>("ToggleContext");

/**
 * @public
 */
export type ToggleProps = Omit<
  ComponentProps<typeof TogglePrimitive.Root>,
  "asChild"
> &
  HTMLMotionProps<"button">;

/**
 * @public
 */
export function Toggle({
  defaultPressed,
  disabled,
  onPressedChange,
  pressed,
  ...props
}: ToggleProps) {
  const [isPressed, setIsPressed] = useControlledState({
    defaultValue: defaultPressed,
    onChange: onPressedChange,
    value: pressed,
  });

  return (
    <ToggleProvider value={{ disabled, isPressed, setIsPressed }}>
      <TogglePrimitive.Root
        defaultPressed={defaultPressed}
        disabled={disabled}
        onPressedChange={setIsPressed}
        pressed={pressed}
        asChild
      >
        <motion.button
          data-slot="toggle"
          whileTap={{ scale: 0.95 }}
          {...props}
        />
      </TogglePrimitive.Root>
    </ToggleProvider>
  );
}

/**
 * @public
 */
export type ToggleHighlightProps = HTMLMotionProps<"div">;

/**
 * @public
 */
export function ToggleHighlight({ style, ...props }: ToggleHighlightProps) {
  const { disabled, isPressed } = useToggle();

  return (
    <AnimatePresence>
      {isPressed && (
        <motion.div
          animate={{ opacity: 1 }}
          aria-pressed={isPressed}
          data-disabled={disabled}
          data-slot="toggle-highlight"
          data-state={isPressed ? "on" : "off"}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          style={{ inset: 0, position: "absolute", zIndex: 0, ...style }}
          {...props}
        />
      )}
    </AnimatePresence>
  );
}

/**
 * @public
 */
export type ToggleItemProps = HTMLMotionProps<"div"> & {
  deselectedContent?: ReactNode;
};

/**
 * @public
 */
export function ToggleItem({
  children,
  deselectedContent,
  style,
  ...props
}: ToggleItemProps) {
  const { disabled, isPressed } = useToggle();

  return (
    <motion.div
      aria-pressed={isPressed}
      data-disabled={disabled}
      data-slot="toggle-item"
      data-state={isPressed ? "on" : "off"}
      style={{ position: "relative", zIndex: 1, ...style }}
      {...props}
    >
      {deselectedContent && !isPressed ? deselectedContent : children}
    </motion.div>
  );
}
