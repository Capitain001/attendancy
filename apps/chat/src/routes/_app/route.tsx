import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@attendancy/auth";

export const Route = createFileRoute("/_app")({
  beforeLoad: requireAuth,
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
