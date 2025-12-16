import { ComponentProps, forwardRef, useRef } from "react";

import ClipMarkLogo from "@/assets/clip-mark.png";
import ObsLogo from "@/assets/obsstudio.svg";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";

import ConnectionStatus, { connectionStatus } from "./connection-status";

const Circle = forwardRef<HTMLDivElement, { children?: React.ReactNode }>(
  (props, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 text-background shadow-xl shadow-border/20 dark:bg-background"
        )}
      >
        {props.children}
      </div>
    );
  }
);

type BeamProps = Pick<
  ComponentProps<typeof AnimatedBeam>,
  | "containerRef"
  | "fromRef"
  | "toRef"
  | "startYOffset"
  | "endYOffset"
  | "curvature"
  | "reverse"
> & {
  status: ConnectionStatus;
};

function Beam({
  containerRef,
  curvature,
  endYOffset,
  fromRef,
  reverse,
  startYOffset,
  status,
  toRef,
}: BeamProps) {
  return (
    <AnimatedBeam
      containerRef={containerRef}
      curvature={curvature}
      disable={status !== connectionStatus.connected}
      endYOffset={endYOffset}
      fromRef={fromRef}
      gradientStartColor="var(--color-green-300)"
      gradientStopColor="var(--color-green-400)"
      pathOpacity={status === connectionStatus.disconnected ? 0.5 : undefined}
      reverse={reverse}
      startYOffset={startYOffset}
      toRef={toRef}
      pathClassName={
        status === connectionStatus.disconnected
          ? "stroke-red-500 dark:stroke-red-400"
          : undefined
      }
    />
  );
}

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
            <div className="absolute size-5 rounded-full bg-[#302E31]" />
            <img className="invert" src={ObsLogo} />
          </Circle>
        </div>
      </div>

      <Beam
        containerRef={containerRef}
        curvature={-20}
        endYOffset={10}
        fromRef={clipMarkRef}
        startYOffset={10}
        status={status}
        toRef={obsRef}
      />

      <Beam
        containerRef={containerRef}
        curvature={20}
        endYOffset={-10}
        fromRef={obsRef}
        startYOffset={-10}
        status={status}
        toRef={clipMarkRef}
        reverse
      />
    </div>
  );
}

export default ConnectionGraph;
