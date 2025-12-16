import { useEffect, useState } from "react";

import { createFileRoute } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Circle, Pause } from "lucide-react";
import { AnimatePresence } from "motion/react";
import z from "zod";

import Breathe from "@/components/motion/breathe";
import Flip from "@/components/motion/flip";
import ShadowPulse from "@/components/motion/shadow-pulse";

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
    document.body.classList.add("bg-transparent");

    return () => {
      document.body.classList.remove("bg-transparent");
    };
  }, []);

  return (
    <div className="flex h-dvh items-center justify-center">
      <AnimatePresence mode="popLayout">
        {status?.active && !status?.paused && (
          <Flip key="recording">
            <Breathe>
              <Circle className="fill-red-500 stroke-red-500 text-6xl drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            </Breathe>
          </Flip>
        )}

        {status?.paused && (
          <Flip key="paused">
            <ShadowPulse>
              <Pause className="fill-amber-400 stroke-amber-400 text-6xl" />
            </ShadowPulse>
          </Flip>
        )}
      </AnimatePresence>
    </div>
  );
}
