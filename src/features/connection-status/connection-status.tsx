import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

const commands = {
  GetServerConnectionStatus: "get_server_connection_status",
} as const;

const connectionEvents = {
  Status: "connection:status",
} as const;

const _connectionStatus = {
  connected: "connected",
  disconnected: "disconnected",
  retrying: "retrying",
} as const;

type ConnectionStatus =
  (typeof _connectionStatus)[keyof typeof _connectionStatus];

async function getConnectionStatus(): Promise<ConnectionStatus> {
  return await invoke<ConnectionStatus>(commands.GetServerConnectionStatus);
}

function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    getConnectionStatus().then((initialStatus) => {
      setStatus(initialStatus);
    });
  }, []);

  useEffect(() => {
    const unlisten = listen<ConnectionStatus>(
      connectionEvents.Status,
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
