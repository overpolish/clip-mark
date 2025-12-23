import { useEffect, useRef } from "react";

import { cx } from "class-variance-authority";
import { scv } from "css-variants";
import {
  OverlayScrollbarsComponent,
  type OverlayScrollbarsComponentRef,
} from "overlayscrollbars-react";

const scrollAreaStyles = scv({
  base: {
    end: "pointer-events-none absolute z-100 from-foreground/25 to-transparent",
    os: "relative h-full w-full overflow-hidden",
    start:
      "pointer-events-none absolute z-100 from-foreground/25 to-transparent",
  },
  compoundVariants: [
    {
      classNames: {
        end: "rounded-r-sm",
        start: "rounded-l-sm",
      },
      orientation: "horizontal",
      shadowRadius: "sm",
    },
    {
      classNames: {
        end: "rounded-r-md",
        start: "rounded-l-md",
      },
      orientation: "horizontal",
      shadowRadius: "md",
    },
    {
      classNames: {
        end: "rounded-b-md",
        start: "rounded-t-md",
      },
      orientation: "vertical",
      shadowRadius: "md",
    },
    {
      classNames: {
        end: "rounded-b-md",
        start: "rounded-t-md",
      },
      orientation: "vertical",
      shadowRadius: "md",
    },
    {
      classNames: {
        end: "h-2.5 w-full",
        start: "h-2.5 w-full",
      },
      orientation: "vertical",
    },
    {
      classNames: {
        end: "h-full w-2.5",
        start: "h-full w-2.5",
      },
      orientation: "horizontal",
    },
  ],
  defaultVariants: {
    orientation: "vertical",
    shadowRadius: "sm",
  },
  slots: ["end", "os", "start"],
  variants: {
    insetShadow: {
      true: {
        os: "shadow-inner",
      },
    },
    orientation: {
      horizontal: {
        end: "right-0 bg-linear-to-l",
        start: "left-0 bg-linear-to-r",
      },
      vertical: {
        end: "bottom-0 bg-linear-to-t",
        start: "top-0 bg-linear-to-b",
      },
    },
    shadowRadius: {
      md: {
        os: "rounded-md",
      },
      sm: {
        os: "rounded-sm",
      },
    },
  },
});

type ScrollAreaProps = Parameters<typeof scrollAreaStyles>[0] & {
  children?: React.ReactNode;
  className?: string;
  hideScrollbar?: boolean;
  osClassName?: string;
  startAtEnd?: boolean;
  style?: React.CSSProperties | undefined;
  viewportClassName?: string;
};

export function ScrollArea({
  children,
  className,
  hideScrollbar,
  insetShadow,
  orientation,
  shadowRadius,
  startAtEnd,
  style,
  viewportClassName,
}: ScrollAreaProps) {
  const { end, os, start } = scrollAreaStyles({
    insetShadow,
    orientation,
    shadowRadius,
  });

  const osRef = useRef<OverlayScrollbarsComponentRef>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollElRef = useRef<HTMLElement | null>(null);

  function updateShadows() {
    const scrollEl = scrollElRef.current;
    if (!scrollEl || !startRef.current || !endRef.current) return;

    const {
      clientHeight,
      clientWidth,
      scrollHeight,
      scrollLeft,
      scrollTop,
      scrollWidth,
    } = scrollEl;

    const scrollPosition = orientation === "vertical" ? scrollTop : scrollLeft;
    const scrollSize = orientation === "vertical" ? scrollHeight : scrollWidth;
    const clientSize = orientation === "vertical" ? clientHeight : clientWidth;

    const maxScroll = scrollSize - clientSize;

    const hasOverflow = scrollSize > clientSize;
    if (hasOverflow) {
      const scrollAmount = scrollPosition / maxScroll;
      startRef.current.style.opacity = scrollAmount.toString();
      endRef.current.style.opacity = (1 - scrollAmount).toString();
    } else {
      startRef.current.style.opacity = "0";
      endRef.current.style.opacity = "0";
    }
  }

  function createShadowNode(startShadow: boolean) {
    const shadow = document.createElement("div");
    shadow.className = startShadow ? start : end;
    shadow.style.opacity = startShadow ? "0" : "1";
    return shadow;
  }

  // Must manually append to scroll parent, OverlayScrollbars children
  // go inside internal viewport
  function initializeShadows(scrollEl: HTMLElement) {
    if (!startRef.current) {
      startRef.current = createShadowNode(true);
      scrollEl.parentElement?.appendChild(startRef.current);
    }

    if (!endRef.current) {
      endRef.current = createShadowNode(false);
      scrollEl.parentElement?.appendChild(endRef.current);
    }
  }

  function handleInitialized() {
    const viewport = document.querySelector(
      "[data-overlayscrollbars-contents]"
    );

    // Style viewport wrapper - no way to access via props
    if (viewport && viewportClassName) {
      viewport.className = viewportClassName;
    }

    const scrollEl = osRef.current?.osInstance()?.elements().viewport;
    if (!scrollEl) return;

    scrollElRef.current = scrollEl;

    scrollEl.addEventListener("scroll", updateShadows);
    window.addEventListener("resize", updateShadows);

    if (startAtEnd) {
      if (orientation === "vertical") {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      } else {
        scrollEl.scrollLeft = scrollEl.scrollWidth;
      }
    }

    initializeShadows(scrollEl);
    updateShadows();
  }

  useEffect(() => {
    return () => {
      const scrollEl = scrollElRef.current;
      if (scrollEl) {
        scrollEl.removeEventListener("scroll", updateShadows);
        window.removeEventListener("resize", updateShadows);
      }
    };
  }, []);

  return (
    <OverlayScrollbarsComponent
      ref={osRef}
      className={os}
      events={{
        updated: handleInitialized,
      }}
      options={{
        overflow: {
          x: orientation === "horizontal" ? "scroll" : "hidden",
          y: orientation === "vertical" ? "scroll" : "hidden",
        },
        scrollbars: {
          autoHide: "scroll",
          theme: "os-theme-scroll-area",
          visibility: hideScrollbar ? "hidden" : "visible",
        },
      }}
      defer
    >
      <div
        className={cx(orientation === "horizontal" && "text-nowrap", className)}
        style={style}
      >
        {children}
      </div>
    </OverlayScrollbarsComponent>
  );
}
