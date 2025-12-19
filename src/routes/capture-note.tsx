import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/capture-note")({
  component: CaptureNote,
});

function CaptureNote() {
  return <div>Capture Note Page</div>;
}
