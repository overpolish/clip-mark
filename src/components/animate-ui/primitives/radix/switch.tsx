"use client";

import * as React from "react";

import {
  motion,
  type TargetAndTransition,
  type VariantLabels,
  type HTMLMotionProps,
  type LegacyAnimationControls,
} from "motion/react";
import { Switch as SwitchPrimitives } from "radix-ui";

import { useControlledState } from "@/hooks/use-controlled-state";
import { getStrictContext } from "@/lib/get-strict-context";

type SwitchContextType = {
  isChecked: boolean;
  isPressed: boolean;
  setIsChecked: (isChecked: boolean) => void;
  setIsPressed: (isPressed: boolean) => void;
};

const [SwitchProvider, useSwitch] =
  getStrictContext<SwitchContextType>("SwitchContext");

type SwitchProps = Omit<
  React.ComponentProps<typeof SwitchPrimitives.Root>,
  "asChild"
> &
  HTMLMotionProps<"button">;

/**
 * @public
 */
export function Switch(props: SwitchProps) {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isChecked, setIsChecked] = useControlledState({
    defaultValue: props.defaultChecked,
    onChange: props.onCheckedChange,
    value: props.checked,
  });

  return (
    <SwitchProvider
      value={{ isChecked, isPressed, setIsChecked, setIsPressed }}
    >
      <SwitchPrimitives.Root {...props} onCheckedChange={setIsChecked} asChild>
        <motion.button
          data-slot="switch"
          initial={false}
          onTap={() => setIsPressed(false)}
          onTapCancel={() => setIsPressed(false)}
          onTapStart={() => setIsPressed(true)}
          whileTap="tap"
          {...props}
        />
      </SwitchPrimitives.Root>
    </SwitchProvider>
  );
}

type SwitchThumbProps = Omit<
  React.ComponentProps<typeof SwitchPrimitives.Thumb>,
  "asChild"
> &
  HTMLMotionProps<"div"> & {
    pressedAnimation?:
      | TargetAndTransition
      | VariantLabels
      | boolean
      | LegacyAnimationControls;
  };

/**
 * @public
 */
export function SwitchThumb({
  pressedAnimation,
  transition = { damping: 25, stiffness: 300, type: "spring" },
  ...props
}: SwitchThumbProps) {
  const { isPressed } = useSwitch();

  return (
    <SwitchPrimitives.Thumb asChild>
      <motion.div
        animate={isPressed ? pressedAnimation : undefined}
        data-slot="switch-thumb"
        transition={transition}
        whileTap="tab"
        layout
        {...props}
      />
    </SwitchPrimitives.Thumb>
  );
}

type SwitchIconPosition = "left" | "right" | "thumb";

type SwitchIconProps = HTMLMotionProps<"div"> & {
  position: SwitchIconPosition;
};

/**
 * @public
 */
export function SwitchIcon({
  position,
  transition = { bounce: 0, type: "spring" },
  ...props
}: SwitchIconProps) {
  const { isChecked } = useSwitch();

  const isAnimated = React.useMemo(() => {
    if (position === "right") return !isChecked;
    if (position === "left") return isChecked;
    if (position === "thumb") return true;
    return false;
  }, [position, isChecked]);

  return (
    <motion.div
      animate={isAnimated ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
      data-slot={`switch-${position}-icon`}
      transition={transition}
      {...props}
    />
  );
}

export {
  type SwitchProps,
  type SwitchThumbProps,
  type SwitchIconProps,
  type SwitchIconPosition,
  type SwitchContextType,
};
