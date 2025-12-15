import { Button } from "@/components/ui/button";
import ConnectionStatus from "@/features/connection-status/connection-status";
import ObsWebsocketConfiguration from "@/features/obs-websocket-configuration/obs-websocket-configuration";
import { createFileRoute } from "@tanstack/react-router";
import { exit } from "@tauri-apps/plugin-process";
import "./styles.css";

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

      <ConnectionStatus />
      <ObsWebsocketConfiguration />
    </div>
  );
}
