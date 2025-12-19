import { useEffect, useRef, useState } from "react";

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
  ConfigurationWillShow: "window:configuration_will_show",
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

function WindowUtilities({ className }: AppUtilitiesProps) {
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null);
  const [windowOptions, setWindowOptions] = useState<ComboboxData[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const selectedWindowRef = useRef(selectedWindow);
  const windowOptionsRef = useRef(windowOptions);
  const lastSelectedWindowTitleRef = useRef<string | null>(null);

  function windowsToOptions(wins: WindowInfo[]): ComboboxData[] {
    return wins.map((win) => ({
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
  }

  function getWindows() {
    listWindows().then((wins) => {
      setWindowOptions(windowsToOptions(wins));
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
    selectedWindowRef.current = selectedWindow;
    windowOptionsRef.current = windowOptions;
  }, [selectedWindow, windowOptions]);

  useEffect(() => {
    const unlistenWillHide = listen(events.ConfigurationWillHide, () => {
      setComboboxOpen(false);

      // Cache currently selected window title
      lastSelectedWindowTitleRef.current =
        windowOptionsRef.current.find(
          (w) => w.value === selectedWindowRef.current
        )?.label || null;
    });

    const unlistenWillShow = listen(events.ConfigurationWillShow, () => {
      listWindows().then((wins) => {
        setWindowOptions(windowsToOptions(wins));
      });
    });

    return () => {
      unlistenWillHide.then((f) => f());
      unlistenWillShow.then((f) => f());
    };
  }, []);

  useEffect(() => {
    const hwndMatch = windowOptions.some((w) => w.value === selectedWindow);
    if (hwndMatch) return;

    if (lastSelectedWindowTitleRef.current !== null) {
      const titleMatch = windowOptions.find(
        (w) => w.label === lastSelectedWindowTitleRef.current
      );

      if (titleMatch) {
        setSelectedWindow(titleMatch.value);
        return;
      }
    }

    setSelectedWindow(null);
  }, [windowOptions, selectedWindow]);

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

export default WindowUtilities;
