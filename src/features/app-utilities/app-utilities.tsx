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
  CenterWindow: "center_window",
  FullscreenWindow: "fullscreen_window",
  ListWindows: "list_windows",
  MakeBorderless: "make_borderless",
  RestoreBorder: "restore_border",
} as const;

async function listWindows(): Promise<WindowInfo[]> {
  return await invoke<WindowInfo[]>(commands.ListWindows);
}

async function centerWindow(hwnd: number) {
  invoke<void>(commands.CenterWindow, { hwnd });
}

async function makeBorderless(hwnd: number) {
  invoke<void>(commands.MakeBorderless, { hwnd });
}

async function restoreBorder(hwnd: number) {
  invoke<void>(commands.RestoreBorder, { hwnd });
}

async function fullscreenWindow(hwnd: number) {
  invoke<void>(commands.FullscreenWindow, { hwnd });
}

function AppUtilities({ className }: AppUtilitiesProps) {
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
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

  function onClick<T extends (hwnd: number) => void>(input: string | null) {
    return (fn: T) => {
      if (input === null) return;

      const hwnd = Number(input);
      if (isNaN(hwnd)) return;

      fn(hwnd);
    };
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
          onValueChange={setSelectedWindow}
          open={comboboxOpen}
          placeholder="Select a Window"
          searchPlaceholder="Search Windows..."
          setOpen={setComboboxOpen}
          triggerClassName="shrink min-w-0"
          value={selectedWindow}
        />

        <Toolbar
          isWindowSelected={selectedWindow !== null}
          onClickBorderless={() => onClick(selectedWindow)(makeBorderless)}
          onClickCenter={() => onClick(selectedWindow)(centerWindow)}
          onClickFullscreen={() => onClick(selectedWindow)(fullscreenWindow)}
          onClickRestoreBorder={() => onClick(selectedWindow)(restoreBorder)}
        />
      </div>
    </div>
  );
}

export default AppUtilities;
