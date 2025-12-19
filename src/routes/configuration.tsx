import { useEffect } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { exit } from "@tauri-apps/plugin-process";

import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Kbd } from "@/components/ui/kbd";
import ConnectionStatus from "@/features/connection-status/connection-status";
import ObsWebsocketConfiguration from "@/features/obs-websocket-configuration/obs-websocket-configuration";
import WindowUtilities from "@/features/window-utilities/window-utilities";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/configuration")({
  component: Configuration,
});

function Configuration() {
  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  return (
    <div className="relative grid grid-cols-2 gap-3 p-4">
      <Button
        className="absolute top-1 left-1"
        onClick={() => exit(0)}
        size="sm"
        variant="ghost"
      >
        Quit
      </Button>
      <div className="flex h-full w-full flex-col items-center justify-center">
        <ConnectionStatus />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground italic">
            New note:
          </span>
          <Kbd>Ctrl + Shift + N</Kbd>
        </div>
      </div>
      <ObsWebsocketConfiguration />
      <DotPattern
        cr={1}
        cx={1}
        cy={1}
        height={20}
        width={20}
        className={cn(
          "-z-1",
          "mask-[linear-gradient(to_top_right,white,transparent,transparent)]"
        )}
      />
      <WindowUtilities className="col-span-2" />
    </div>
  );
}
