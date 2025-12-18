import { Maximize, SquareDashed, SquareDot } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/animate-ui/components/animate/tooltip";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

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
};
function Toolbar({
  isWindowSelected,
  onClickBorderless,
  onClickCenter,
  onClickFullscreen,
}: ToolbarProps) {
  return (
    <TooltipProvider>
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
          icon={<Maximize />}
          onClick={onClickFullscreen}
          tooltip="Fullscreen"
        />
      </ButtonGroup>
    </TooltipProvider>
  );
}

export default Toolbar;
