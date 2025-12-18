import { useState } from "react";

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import z from "zod";

import Combobox, { ComboboxData } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

const commands = {
  ListWindows: "list_windows",
} as const;

async function listWindows(): Promise<WindowInfo[]> {
  return await invoke<WindowInfo[]>(commands.ListWindows);
}

function AppUtilities({ className }: AppUtilitiesProps) {
  const [windowOptions, setWindowOptions] = useState<ComboboxData[]>([]);

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

  // TODO close combobox when window is hidden

  return (
    <div className={cn("", className)}>
      <div>
        <div className="relative flex items-center">
          <span className="absolute left-3 -translate-y-[50%] bg-background px-1 text-xs text-muted-foreground">
            Window Utilities
          </span>
          <Separator className="mb-3" />
        </div>
      </div>
      <Combobox
        data={windowOptions}
        emptyMessage="No Windows found."
        onOpen={getWindows}
        placeholder="Select a Window"
        searchPlaceholder="Search Windows..."
      />
    </div>
  );
}

export default AppUtilities;
