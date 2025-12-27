import {
  Maximize,
  SquareDashed,
  SquareDashedBottom,
  SquareDot,
} from "lucide-react";

import { Button } from "@/components/buttons/button";
import { ButtonGroup } from "@/components/buttons/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/overlays/tooltip";

type ToolButtonProps = {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
};

function ToolButton({ icon, onClick, tooltip }: ToolButtonProps) {
  return (
    <Tooltip sideOffset={-7}>
      <TooltipTrigger asChild>
        <Button onClick={onClick} size="icon" variant="outline">
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent showArrow={false}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

type ToolbarProps = {
  isWindowSelected?: boolean;
  onClickBorderless?: () => void;
  onClickCenter?: () => void;
  onClickFullscreen?: () => void;
  onClickRestoreBorder?: () => void;
};

export function Toolbar({
  isWindowSelected,
  onClickBorderless,
  onClickCenter,
  onClickFullscreen,
  onClickRestoreBorder,
}: ToolbarProps) {
  return (
    <ButtonGroup aria-label="Window Utilities" pulsate={isWindowSelected}>
      <ToolButton
        icon={<SquareDot />}
        onClick={onClickCenter}
        tooltip="Center"
      />

      <ToolButton
        icon={<SquareDashed />}
        onClick={onClickBorderless}
        tooltip="Borderless"
      />
      <ToolButton
        icon={<SquareDashedBottom />}
        onClick={onClickRestoreBorder}
        tooltip="Restore Border"
      />
      <ToolButton
        icon={<Maximize />}
        onClick={onClickFullscreen}
        tooltip="Fullscreen"
      />
    </ButtonGroup>
  );
}
