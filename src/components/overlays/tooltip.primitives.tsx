import {
  type ReactNode,
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useId,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ComponentProps,
  useImperativeHandle,
  useLayoutEffect,
  type MouseEvent,
  type PointerEvent,
  type FocusEvent,
} from "react";

import {
  useFloating,
  autoUpdate,
  offset as floatingOffset,
  flip,
  shift,
  arrow as floatingArrow,
  FloatingPortal,
  FloatingArrow,
  type UseFloatingReturn,
} from "@floating-ui/react";
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  type Transition,
  type HTMLMotionProps,
} from "motion/react";

import { Slot, type WithAsChild } from "@/components/miscellaneous/slot";
import { getStrictContext } from "@/lib/get-strict-context";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

type TooltipData = {
  align: Align;
  alignOffset: number;
  contentAsChild: boolean;
  contentProps: HTMLMotionProps<"div">;
  id: string;
  rect: DOMRect;
  side: Side;
  sideOffset: number;
};

type GlobalTooltipContextType = {
  currentTooltip: TooltipData | null;
  globalId: string;
  referenceElRef: RefObject<HTMLElement | null>;
  transition: Transition;
  hideImmediate: () => void;
  hideTooltip: () => void;
  setReferenceEl: (el: HTMLElement | null) => void;
  showTooltip: (data: TooltipData) => void;
};

const [GlobalTooltipProvider, useGlobalTooltip] =
  getStrictContext<GlobalTooltipContextType>("GlobalTooltipProvider");

type TooltipContextType = {
  align: Align;
  alignOffset: number;
  asChild: boolean;
  id: string;
  props: HTMLMotionProps<"div">;
  setAsChild: Dispatch<SetStateAction<boolean>>;
  setProps: Dispatch<SetStateAction<HTMLMotionProps<"div">>>;
  side: Side;
  sideOffset: number;
};

const [LocalTooltipProvider, useTooltip] = getStrictContext<TooltipContextType>(
  "LocalTooltipProvider"
);

function getResolvedSide(placement: Side | `${Side}-${Align}`) {
  if (placement.includes("-")) {
    return placement.split("-")[0] as Side;
  }
  return placement as Side;
}

function initialFromSide(side: Side): Partial<Record<"x" | "y", number>> {
  if (side === "top") return { y: 15 };
  if (side === "bottom") return { y: -15 };
  if (side === "left") return { x: 15 };
  return { x: -15 };
}

/**
 * @public
 */
export type TooltipProviderProps = {
  children: ReactNode;
  closeDelay?: number;
  id?: string;
  openDelay?: number;
  transition?: Transition;
};

/**
 * @public
 */
export function TooltipProvider({
  children,
  closeDelay = 300,
  id,
  openDelay = 700,
  transition = { damping: 35, stiffness: 300, type: "spring" },
}: TooltipProviderProps) {
  const globalId = useId();
  const [currentTooltip, setCurrentTooltip] = useState<TooltipData | null>(
    null
  );
  const timeoutRef = useRef<number | null>(null);
  const lastCloseTimeRef = useRef<number>(0);
  const referenceElRef = useRef<HTMLElement | null>(null);

  const showTooltip = useCallback(
    (data: TooltipData) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (currentTooltip !== null) {
        setCurrentTooltip(data);
        return;
      }
      const now = Date.now();
      const delay = now - lastCloseTimeRef.current < closeDelay ? 0 : openDelay;
      timeoutRef.current = window.setTimeout(
        () => setCurrentTooltip(data),
        delay
      );
    },
    [openDelay, closeDelay, currentTooltip]
  );

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setCurrentTooltip(null);
      lastCloseTimeRef.current = Date.now();
    }, closeDelay);
  }, [closeDelay]);

  const hideImmediate = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCurrentTooltip(null);
    lastCloseTimeRef.current = Date.now();
  }, []);

  const setReferenceEl = useCallback((el: HTMLElement | null) => {
    referenceElRef.current = el;
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") hideImmediate();
    }
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", hideImmediate, true);
    window.addEventListener("resize", hideImmediate, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", hideImmediate, true);
      window.removeEventListener("resize", hideImmediate, true);
    };
  }, [hideImmediate]);

  return (
    <GlobalTooltipProvider
      value={{
        currentTooltip,
        globalId: id ?? globalId,
        hideImmediate,
        hideTooltip,
        referenceElRef,
        setReferenceEl,
        showTooltip,
        transition,
      }}
    >
      <LayoutGroup>{children}</LayoutGroup>
      <TooltipOverlay />
    </GlobalTooltipProvider>
  );
}

type RenderedTooltipContextType = {
  align: Align;
  open: boolean;
  side: Side;
};

const [RenderedTooltipProvider, useRenderedTooltip] =
  getStrictContext<RenderedTooltipContextType>("RenderedTooltipContext");

type FloatingContextType = {
  arrowRef: RefObject<SVGSVGElement | null>;
  context: UseFloatingReturn["context"];
};

const [FloatingProvider, useFloatingContext] =
  getStrictContext<FloatingContextType>("FloatingContext");

const MotionTooltipArrow = motion.create(FloatingArrow);

type TooltipArrowProps = Omit<
  ComponentProps<typeof MotionTooltipArrow>,
  "context"
> & {
  withTransition?: boolean;
};

/**
 * @public
 */
export function TooltipArrow({
  ref,
  withTransition = true,
  ...props
}: TooltipArrowProps) {
  const { align, open, side } = useRenderedTooltip();
  const { arrowRef, context } = useFloatingContext();
  const { globalId, transition } = useGlobalTooltip();
  useImperativeHandle(ref, () => arrowRef.current as SVGSVGElement);

  const deg = { bottom: 180, left: -90, right: 90, top: 0 }[side];

  return (
    <MotionTooltipArrow
      ref={arrowRef}
      context={context}
      data-align={align}
      data-side={side}
      data-slot="tooltip-arrow"
      data-state={open ? "open" : "closed"}
      layoutId={withTransition ? `tooltip-arrow-${globalId}` : undefined}
      style={{ rotate: deg }}
      transition={withTransition ? transition : undefined}
      {...props}
    />
  );
}

type TooltipPortalProps = ComponentProps<typeof FloatingPortal>;

function TooltipPortal(props: TooltipPortalProps) {
  return <FloatingPortal {...props} />;
}

function TooltipOverlay() {
  const { currentTooltip, globalId, referenceElRef, transition } =
    useGlobalTooltip();

  const [rendered, setRendered] = useState<{
    data: TooltipData | null;
    open: boolean;
  }>({ data: null, open: false });

  const arrowRef = useRef<SVGSVGElement | null>(null);

  const side = rendered.data?.side ?? "top";
  const align = rendered.data?.align ?? "center";

  const { context, refs, strategy, update, x, y } = useFloating({
    middleware: [
      floatingOffset({
        crossAxis: rendered.data?.alignOffset ?? 0,
        mainAxis: rendered.data?.sideOffset ?? 0,
      }),
      flip(),
      shift({ padding: 8 }),
      floatingArrow({ element: arrowRef }),
    ],
    placement: align === "center" ? side : `${side}-${align}`,
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (currentTooltip) {
      setRendered({ data: currentTooltip, open: true });
    } else {
      setRendered((p) => (p.data ? { ...p, open: false } : p));
    }
  }, [currentTooltip]);

  useLayoutEffect(() => {
    if (referenceElRef.current) {
      refs.setReference(referenceElRef.current);
      update();
    }
  }, [referenceElRef, refs, update, rendered.data]);

  const ready = x != null && y != null;
  const Component = rendered.data?.contentAsChild ? Slot : motion.div;
  const resolvedSide = getResolvedSide(context.placement);

  return (
    <AnimatePresence mode="wait">
      {rendered.data && ready && (
        <TooltipPortal>
          <div
            ref={refs.setFloating}
            data-align={rendered.data.align}
            data-side={resolvedSide}
            data-slot="tooltip-overlay"
            data-state={rendered.open ? "open" : "closed"}
            style={{
              left: 0,
              position: strategy,
              top: 0,
              transform: `translate3d(${x!}px, ${y!}px, 0)`,
              zIndex: 50,
            }}
          >
            <FloatingProvider value={{ arrowRef, context }}>
              <RenderedTooltipProvider
                value={{
                  align: rendered.data.align,
                  open: rendered.open,
                  side: resolvedSide,
                }}
              >
                <Component
                  data-align={rendered.data.align}
                  data-side={resolvedSide}
                  data-slot="tooltip-content"
                  data-state={rendered.open ? "open" : "closed"}
                  layoutId={`tooltip-content-${globalId}`}
                  transition={transition}
                  animate={
                    rendered.open
                      ? { opacity: 1, scale: 1, x: 0, y: 0 }
                      : {
                          opacity: 0,
                          scale: 0,
                          ...initialFromSide(rendered.data.side),
                        }
                  }
                  exit={{
                    opacity: 0,
                    scale: 0,
                    ...initialFromSide(rendered.data.side),
                  }}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    ...initialFromSide(rendered.data.side),
                  }}
                  onAnimationComplete={() => {
                    if (!rendered.open)
                      setRendered({ data: null, open: false });
                  }}
                  {...rendered.data.contentProps}
                  style={{
                    position: "relative",
                    ...(rendered.data.contentProps?.style || {}),
                  }}
                />
              </RenderedTooltipProvider>
            </FloatingProvider>
          </div>
        </TooltipPortal>
      )}
    </AnimatePresence>
  );
}

/**
 * @public
 */
export type TooltipProps = {
  children: ReactNode;
  align?: Align;
  alignOffset?: number;
  side?: Side;
  sideOffset?: number;
};

/**
 * @public
 */
export function Tooltip({
  align = "center",
  alignOffset = 0,
  children,
  side = "top",
  sideOffset = 0,
}: TooltipProps) {
  const id = useId();
  const [props, setProps] = useState<HTMLMotionProps<"div">>({});
  const [asChild, setAsChild] = useState(false);

  return (
    <LocalTooltipProvider
      value={{
        align,
        alignOffset,
        asChild,
        id,
        props,
        setAsChild,
        setProps,
        side,
        sideOffset,
      }}
    >
      {children}
    </LocalTooltipProvider>
  );
}

/**
 * @public
 */
export type TooltipContentProps = WithAsChild<HTMLMotionProps<"div">>;

function shallowEqualWithoutChildren(
  a?: HTMLMotionProps<"div">,
  b?: HTMLMotionProps<"div">
) {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a).filter((k) => k !== "children");
  const keysB = Object.keys(b).filter((k) => k !== "children");
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    // @ts-expect-error index
    if (a[k] !== b[k]) return false;
  }
  return true;
}

/**
 * @public
 */
export function TooltipContent({
  asChild = false,
  ...props
}: TooltipContentProps) {
  const { setAsChild, setProps } = useTooltip();
  const lastPropsRef = useRef<HTMLMotionProps<"div"> | undefined>(undefined);

  useEffect(() => {
    if (!shallowEqualWithoutChildren(lastPropsRef.current, props)) {
      lastPropsRef.current = props;
      setProps(props);
    }
  }, [props, setProps]);

  useEffect(() => {
    setAsChild(asChild);
  }, [asChild, setAsChild]);

  return null;
}

/**
 * @public
 */
export type TooltipTriggerProps = WithAsChild<HTMLMotionProps<"div">>;

/**
 * @public
 */
export function TooltipTrigger({
  asChild = false,
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  onPointerDown,
  ref,
  ...props
}: TooltipTriggerProps) {
  const {
    align,
    alignOffset,
    asChild: contentAsChild,
    id,
    props: contentProps,
    side,
    sideOffset,
  } = useTooltip();
  const {
    currentTooltip,
    hideImmediate,
    hideTooltip,
    setReferenceEl,
    showTooltip,
  } = useGlobalTooltip();

  const triggerRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => triggerRef.current as HTMLDivElement);

  const suppressNextFocusRef = useRef(false);

  const handleOpen = useCallback(() => {
    if (!triggerRef.current) return;
    setReferenceEl(triggerRef.current);
    const rect = triggerRef.current.getBoundingClientRect();
    showTooltip({
      align,
      alignOffset,
      contentAsChild,
      contentProps,
      id,
      rect,
      side,
      sideOffset,
    });
  }, [
    showTooltip,
    setReferenceEl,
    contentProps,
    contentAsChild,
    side,
    sideOffset,
    align,
    alignOffset,
    id,
  ]);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(e);
      if (currentTooltip?.id === id) {
        suppressNextFocusRef.current = true;
        hideImmediate();
        Promise.resolve().then(() => {
          suppressNextFocusRef.current = false;
        });
      }
    },
    [onPointerDown, currentTooltip?.id, id, hideImmediate]
  );

  const handleMouseEnter = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      onMouseEnter?.(e);
      handleOpen();
    },
    [handleOpen, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(e);
      hideTooltip();
    },
    [hideTooltip, onMouseLeave]
  );

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      onFocus?.(e);
      if (suppressNextFocusRef.current) return;
      handleOpen();
    },
    [handleOpen, onFocus]
  );

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      onBlur?.(e);
      hideTooltip();
    },
    [hideTooltip, onBlur]
  );

  const Component = asChild ? Slot : motion.div;

  return (
    <Component
      ref={triggerRef}
      data-align={align}
      data-side={side}
      data-slot="tooltip-trigger"
      data-state={currentTooltip?.id === id ? "open" : "closed"}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      {...props}
    />
  );
}
