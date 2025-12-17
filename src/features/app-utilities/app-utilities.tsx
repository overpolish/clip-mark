import { useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import z from "zod";

import Combobox from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

const _windowInfoSchema = z.object({
  app_name: z.string(),
  hwnd: z.number(),
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
  const [windowOptions, setWindowOptions] = useState<
    { label: string; value: string }[]
  >([]);

  function getWindows() {
    listWindows().then((wins) => {
      const options = wins.map((win) => ({
        label: win.title,
        value: win.hwnd.toString(),
      }));

      setWindowOptions(options);
    });
  }

  return (
    <div className={cn("grid grid-cols-2", className)}>
      <div>
        <Combobox
          data={windowOptions}
          emptyMessage="No Windows found."
          onOpen={getWindows}
          placeholder="Select a Window"
          searchPlaceholder="Search Windows..."
        />
      </div>
    </div>
  );
}

export default AppUtilities;
