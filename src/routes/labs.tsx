import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/labs")({
  component: LabsLayout,
});

function LabsLayout() {
  return <Outlet />;
}
