import { createFileRoute } from "@tanstack/react-router";

import "./styles.css";

export const Route = createFileRoute("/recording-status/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/recording-status/"!</div>;
}
