import { createFileRoute } from "@tanstack/react-router";
import { exit } from "@tauri-apps/plugin-process";

import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Kbd } from "@/components/ui/kbd";

import "./styles.css";
import ConnectionStatus from "@/features/connection-status/connection-status";
import ObsWebsocketConfiguration from "@/features/obs-websocket-configuration/obs-websocket-configuration";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/configuration/")({
  component: Configuration,
});

function Configuration() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 relative">
      <Button
        className="absolute left-1 top-1"
        onClick={() => exit(0)}
        size="sm"
        variant="ghost"
      >
        Quit
      </Button>
      <div className="flex flex-col h-full items-center justify-center w-full">
        <ConnectionStatus />
        <div className="flex gap-2 items-center">
          <span className="text-muted-foreground italic text-sm">
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
    </div>
  );
}
