import { commands, events } from "@/lib/constants";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

const connectionStatus = {
  connected: "connected",
  disconnected: "disconnected",
  retrying: "retrying",
} as const;

type ConnectionStatus =
  (typeof connectionStatus)[keyof typeof connectionStatus];

const getConnectionStatus = async (): Promise<ConnectionStatus> =>
  await invoke<ConnectionStatus>(commands.GetServerConnectionStatus);

const ConnectionStatus = () => {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    getConnectionStatus().then((initialStatus) => {
      setStatus(initialStatus);
    });
  }, []);

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
};

export default ConnectionStatus;
