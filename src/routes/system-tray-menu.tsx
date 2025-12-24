import { useEffect, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { exit } from "@tauri-apps/plugin-process";
import { EyeOff, X, Zap } from "lucide-react";
import z from "zod";

import { Button } from "@/components/buttons/button/button";
import { Switch } from "@/components/inputs/switch";
import { Label } from "@/components/typography/label";

const commands = {
  GetAppSettings: "get_app_settings",
  UpdateHideFromCapture: "update_hide_from_capture",
  UpdateStartAtLogin: "update_start_at_login",
} as const;

const schema = z.object({
  hide_from_capture: z.boolean(),
  start_at_login: z.boolean(),
});

type Schema = z.infer<typeof schema>;

async function getAppSettings(): Promise<Schema> {
  const details = await invoke(commands.GetAppSettings);
  return schema.parse(details);
}

async function updateHideFromCapture(hide: boolean) {
  invoke(commands.UpdateHideFromCapture, { hideFromCapture: hide });
}

async function updateStartAtLogin(start: boolean) {
  invoke(commands.UpdateStartAtLogin, { startAtLogin: start });
}

export const Route = createFileRoute("/system-tray-menu")({
  component: SystemTrayMenu,
});

function SystemTrayMenu() {
  const [appSettings, setAppSettings] = useState<Schema>({
    hide_from_capture: false,
    start_at_login: false,
  });

  useEffect(() => {
    getAppSettings().then(setAppSettings);
  }, []);

  function handleSettingChange<K extends keyof Schema>(
    key: K,
    value: Schema[K],
    callback?: (value: Schema[K]) => void
  ) {
    setAppSettings((prev) => ({ ...prev, [key]: value }));
    callback?.(value);
  }

  function handleExit() {
    exit(0);
  }

  return (
    <div className="flex flex-col justify-between gap-0.5">
      <SwitchItem
        checked={appSettings.start_at_login}
        icon={<Zap className="text-muted-foreground" />}
        label="Start at Login"
        onChange={(changed) =>
          handleSettingChange("start_at_login", changed, updateStartAtLogin)
        }
      />
      <SwitchItem
        checked={appSettings.hide_from_capture}
        icon={<EyeOff className="text-muted-foreground" />}
        label="Hide from Capture"
        onChange={(changed) =>
          handleSettingChange(
            "hide_from_capture",
            changed,
            updateHideFromCapture
          )
        }
      />
      <Button
        className="justify-start text-xs"
        onClick={handleExit}
        size="sm"
        variant="ghost"
      >
        <X className="text-destructive" />
        Exit
      </Button>
    </div>
  );
}

type SwitchItemProps = {
  label: string;
  checked?: boolean;
  icon?: React.ReactNode;
  onChange?: (checked: boolean) => void;
};
function SwitchItem({ checked, icon, label, onChange }: SwitchItemProps) {
  return (
    <Label className="w-full justify-between px-3 py-2 text-xs">
      <span className="flex items-center gap-1.5 [&_svg]:text-[10px]">
        {icon}
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} size="sm" />
    </Label>
  );
}
