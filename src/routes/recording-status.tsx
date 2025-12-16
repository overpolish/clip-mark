import { useEffect, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import z from "zod";

export const Route = createFileRoute("/recording-status")({
  component: RouteComponent,
});

const recordingEvents = {
  Status: "recording:status",
} as const;

const _recordingStatusSchema = z.object({
  active: z.boolean(),
  paused: z.boolean(),
});

type RecordingStatus = z.infer<typeof _recordingStatusSchema>;

const commands = {
  GetRecordingStatus: "get_recording_status",
};

async function getRecordingStatus(): Promise<RecordingStatus> {
  return await invoke<RecordingStatus>(commands.GetRecordingStatus);
}

function RouteComponent() {
  const [status, setStatus] = useState<RecordingStatus>();

  useEffect(() => {
    getRecordingStatus().then((initialStatus) => {
      setStatus(initialStatus);
    });

    const unlisten = listen<RecordingStatus>(
      recordingEvents.Status,
      (event) => {
        setStatus(event.payload);
      }
    );

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    document.body.classList.add("bg-red-500");

    return () => {
      document.body.classList.remove("bg-red-500");
    };
  }, []);

  return (
    <div>
      Recording Status:{" "}
      {status
        ? `${status.active ? "Active" : "Inactive"}${
            status.paused ? " (Paused)" : ""
          }`
        : "Unknown"}
    </div>
  );
}
