import ConnectionStatus from "@/features/connection-status/connection-status";
import ObsWebsocketConfiguration from "@/features/obs-websocket-configuration/obs-websocket-configuration";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/configuration/")({
  component: Configuration,
});

function Configuration() {
  return (
    <div>
      <ConnectionStatus />
      <ObsWebsocketConfiguration />
    </div>
  );
}
