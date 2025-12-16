import { forwardRef, useRef } from "react";
import ConnectionStatus, { connectionStatus } from "./connection-status";
import { cn } from "@/lib/utils";
import ClipMarkLogo from "@/assets/clip-mark.png";
import ObsLogo from "@/assets/obsstudio.svg";
import { AnimatedBeam } from "@/components/ui/animated-beam";

const Circle = forwardRef<HTMLDivElement, { children?: React.ReactNode }>(
  (props, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white dark:bg-background text-background p-3 shadow-xl shadow-border/20"
        )}
      >
        {props.children}
      </div>
    );
  }
);

type ConnectionGraphProps = {
  status: ConnectionStatus;
};

function ConnectionGraph({ status }: ConnectionGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clipMarkRef = useRef<HTMLDivElement>(null);
  const obsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative flex w-full max-w-35 items-center justify-center"
    >
      <div className="flex size-full flex-col items-stretch justify-between gap-10">
        <div className="flex flex-row justify-between">
          <Circle ref={clipMarkRef}>
            <img src={ClipMarkLogo} />
          </Circle>
          <Circle ref={obsRef}>
            <div className="size-5 rounded-full bg-[#302E31] absolute" />
            <img src={ObsLogo} className="invert" />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={clipMarkRef}
        toRef={obsRef}
        gradientStartColor="var(--color-green-300)"
        gradientStopColor="var(--color-green-400)"
        pathClassName={
          status === connectionStatus.disconnected
            ? "stroke-red-500 dark:stroke-red-400"
            : undefined
        }
        pathOpacity={status === connectionStatus.disconnected ? 0.5 : undefined}
        disable={status !== connectionStatus.connected}
        startYOffset={10}
        endYOffset={10}
        curvature={-20}
      />
      <AnimatedBeam
        fromRef={obsRef}
        toRef={clipMarkRef}
        containerRef={containerRef}
        gradientStartColor="var(--color-green-300)"
        gradientStopColor="var(--color-green-400)"
        pathClassName={
          status === connectionStatus.disconnected
            ? "stroke-red-500 dark:stroke-red-400"
            : undefined
        }
        pathOpacity={status === connectionStatus.disconnected ? 0.5 : undefined}
        disable={status !== connectionStatus.connected}
        startYOffset={-10}
        endYOffset={-10}
        curvature={20}
        reverse
      />
    </div>
  );
}

export default ConnectionGraph;
