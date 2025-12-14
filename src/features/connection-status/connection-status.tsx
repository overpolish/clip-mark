import { events } from "@/lib/constants";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

const connectionStatus = {
  connected: "connected",
  disconnected: "disconnected",
  retrying: "retrying",
} as const;

type ConnectionStatus =
  (typeof connectionStatus)[keyof typeof connectionStatus];

function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  // TODO fetch initial status

  useEffect(() => {
    const unlisten = listen<ConnectionStatus>(
      events.ConnectionStatus,
      (event) => {
        if (event.payload !== status) {
          setStatus(event.payload);
        }
      }
    );

    return () => {
      unlisten.then((f) => f());
    };
  }, [status]);

  return <div>connection status: {status}</div>;
}

export default ConnectionStatus;
