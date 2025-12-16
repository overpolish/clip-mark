import { Button } from "@/components/ui/button";
import ConnectionStatus from "@/features/connection-status/connection-status";
import ObsWebsocketConfiguration from "@/features/obs-websocket-configuration/obs-websocket-configuration";
import { createFileRoute } from "@tanstack/react-router";
import { exit } from "@tauri-apps/plugin-process";
import "./styles.css";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

export const Route = createFileRoute("/configuration/")({
  component: Configuration,
});

function Configuration() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 relative">
      <Button
        className="absolute left-1 top-1"
        variant="ghost"
        onClick={() => exit(0)}
        size="sm"
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
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "-z-1",
          "mask-[linear-gradient(to_top_right,white,transparent,transparent)]"
        )}
      />
    </div>
  );
}
