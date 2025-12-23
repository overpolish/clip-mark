import { createFileRoute } from "@tanstack/react-router";
import { EyeOff, X, Zap } from "lucide-react";

import { Switch } from "@/components/animate-ui/components/radix/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/system-tray-menu")({
  component: SystemTrayMenu,
});

function SystemTrayMenu() {
  return (
    <div className="flex flex-col justify-between gap-0.5">
      <SwitchItem
        icon={<Zap className="text-muted-foreground" />}
        label="Start at Login"
        onChange={(changed) => {
          // TODO
          console.log("Start at Login changed:", changed);
        }}
      />
      <SwitchItem
        icon={<EyeOff className="text-muted-foreground" />}
        label="Hide from Capture"
        onChange={(changed) => {
          // TODO
          console.log("Hide from Capture changed:", changed);
        }}
      />
      <Button
        className="justify-start text-xs"
        size="sm"
        variant="ghost"
        onClick={() => {
          // TODO
          console.log("Exit clicked");
        }}
      >
        <X className="text-destructive" />
        Exit
      </Button>
    </div>
  );
}

type SwitchItemProps = {
  label: string;
  icon?: React.ReactNode;
  onChange?: (checked: boolean) => void;
};
function SwitchItem({ icon, label, onChange }: SwitchItemProps) {
  return (
    <Label className="w-full justify-between px-3 py-2 text-xs">
      <span className="flex items-center gap-1.5 [&_svg]:text-[10px]">
        {icon}
        {label}
      </span>
      <Switch onCheckedChange={onChange} />
    </Label>
  );
}
