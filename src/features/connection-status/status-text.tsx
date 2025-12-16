import { ComponentProps } from "react";
import ConnectionStatus, { connectionStatus } from "./connection-status";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";

type StatusTextProps = {
  children: ConnectionStatus;
};
function StatusText({ children }: StatusTextProps) {
  const textProps: ComponentProps<typeof AnimatedGradientText> = {
    className: "text-3xl font-bold tracking-tight capitalize",
  };

  const colors = {
    colorFrom: "var(--color-red-400)",
    colorTo: "var(--color-red-500)",
  };

  if (children === connectionStatus.connected) {
    colors.colorFrom = "var(--color-green-300)";
    colors.colorTo = "var(--color-green-400)";
  } else if (children === connectionStatus.retrying) {
    colors.colorFrom = "var(--color-amber-300)";
    colors.colorTo = "var(--color-amber-400)";
  }

  return (
    <AnimatedGradientText {...textProps} {...colors}>
      {children}
    </AnimatedGradientText>
  );
}

export default StatusText;
