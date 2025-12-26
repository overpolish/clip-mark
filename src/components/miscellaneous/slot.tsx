import {
  type CSSProperties,
  type ElementType,
  isValidElement,
  type ReactElement,
  type Ref,
  type RefCallback,
  type RefObject,
  useMemo,
} from "react";

import { motion, isMotionComponent, type HTMLMotionProps } from "motion/react";
import { cn } from "tailwind-variants";

type AnyProps = Record<string, unknown>;

type DOMMotionProps<T extends HTMLElement = HTMLElement> = Omit<
  HTMLMotionProps<keyof HTMLElementTagNameMap>,
  "ref"
> & { ref?: Ref<T> };

/**
 * @public
 */
export type WithAsChild<Base extends object> =
  | (Base & { asChild: true; children: ReactElement })
  | (Base & { asChild?: false | undefined });

type SlotProps<T extends HTMLElement = HTMLElement> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
} & DOMMotionProps<T>;

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as RefObject<T | null>).current = node;
      }
    });
  };
}

function mergeProps<T extends HTMLElement>(
  childProps: AnyProps,
  slotProps: DOMMotionProps<T>
): AnyProps {
  const merged: AnyProps = { ...childProps, ...slotProps };

  if (childProps.className || slotProps.className) {
    merged.className = cn(
      childProps.className as string,
      slotProps.className as string
    );
  }

  if (childProps.style || slotProps.style) {
    merged.style = {
      ...(childProps.style as CSSProperties),
      ...(slotProps.style as CSSProperties),
    };
  }

  return merged;
}

/**
 * @public
 */
export function Slot<T extends HTMLElement = HTMLElement>({
  children,
  ref,
  ...props
}: SlotProps<T>) {
  const isAlreadyMotion =
    typeof children.type === "object" &&
    children.type !== null &&
    isMotionComponent(children.type);

  const Base = useMemo(
    () =>
      isAlreadyMotion
        ? (children.type as ElementType)
        : motion.create(children.type as ElementType),
    [isAlreadyMotion, children.type]
  );

  if (!isValidElement(children)) return null;

  const { ref: childRef, ...childProps } = children.props as AnyProps;

  const mergedProps = mergeProps(childProps, props);

  return <Base {...mergedProps} ref={mergeRefs(childRef as Ref<T>, ref)} />;
}
