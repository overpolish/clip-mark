import { useEffect, useState } from "react";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { ConnectionGraph } from "./connection-graph";
import { StatusText } from "./status-text";

const commands = {
  GetServerConnectionStatus: "get_server_connection_status",
} as const;

const connectionEvents = {
  Status: "connection:status",
} as const;

export const connectionStatus = {
  connected: "connected",
  disconnected: "disconnected",
  retrying: "retrying",
} as const;

export type ConnectionStatus =
  (typeof connectionStatus)[keyof typeof connectionStatus];

async function getConnectionStatus(): Promise<ConnectionStatus> {
  return await invoke<ConnectionStatus>(commands.GetServerConnectionStatus);
}

export function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>();

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
  }, []);

  return (
    <div className="flex w-full flex-col items-center justify-center">
      {status && (
        <>
          <ConnectionGraph status={status} />
          <StatusText>{status}</StatusText>
        </>
      )}
    </div>
  );
}
