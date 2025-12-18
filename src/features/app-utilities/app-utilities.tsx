import { useEffect, useState } from "react";

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import z from "zod";

import Combobox, { ComboboxData } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";

import Toolbar from "./toolbar";

const _windowInfoSchema = z.object({
  app_name: z.string(),
  hwnd: z.number(),
  iconPath: z.string().optional(),
  title: z.string(),
});

type WindowInfo = z.infer<typeof _windowInfoSchema>;

type AppUtilitiesProps = {
  className?: string;
};

const events = {
  ConfigurationWillHide: "window:configuration_will_hide",
} as const;

const commands = {
  ListWindows: "list_windows",
} as const;

async function listWindows(): Promise<WindowInfo[]> {
  return await invoke<WindowInfo[]>(commands.ListWindows);
}

function AppUtilities({ className }: AppUtilitiesProps) {
  const [windowOptions, setWindowOptions] = useState<ComboboxData[]>([]);

  const [comboboxOpen, setComboboxOpen] = useState(false);

  function getWindows() {
    listWindows().then((wins) => {
      const options: ComboboxData[] = wins.map((win) => ({
        label: win.title,
        left: win.iconPath && (
          <img
            alt={win.app_name}
            height={18}
            src={convertFileSrc(win.iconPath)}
            width={18}
          />
        ),
        value: win.hwnd.toString(),
      }));

      setWindowOptions(options);
    });
  }

  useEffect(() => {
    const unlisten = listen(events.ConfigurationWillHide, () => {
      setComboboxOpen(false);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div className={className}>
      <div>
        <div className="relative flex items-center">
          <span className="absolute left-3 -translate-y-[50%] bg-background px-1 text-xs text-muted-foreground">
            Window Utilities
          </span>
          <Separator className="mb-3" />
        </div>
      </div>

      <div className="flex max-w-full gap-2">
        <Combobox
          data={windowOptions}
          emptyMessage="No Windows found."
          onOpen={getWindows}
          open={comboboxOpen}
          placeholder="Select a Window"
          searchPlaceholder="Search Windows..."
          setOpen={setComboboxOpen}
          triggerClassName="shrink"
          value={null}
        />

        <Toolbar />
      </div>
    </div>
  );
}

export default AppUtilities;
