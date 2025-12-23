import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/system-tray-menu")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/system-tray-menu"!</div>;
}
