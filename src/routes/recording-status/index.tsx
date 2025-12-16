import { useEffect, useState } from "react";

import "./styles.css";
import { createFileRoute } from "@tanstack/react-router";
import { listen } from "@tauri-apps/api/event";

export const Route = createFileRoute("/recording-status/")({
  component: RouteComponent,
});

const recordingEvents = {
  Status: "recording:status",
} as const;

function RouteComponent() {
  const [status, setStatus] = useState<string>();

  useEffect(() => {
    const unlisten = listen<string>(recordingEvents.Status, (event) => {
      setStatus(event.payload);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return <div>Recording Status: {status}</div>;
}
