import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@attendancy/auth";

export const Route = createFileRoute("/_app")({
  beforeLoad: requireAuth,
  component: Outlet,
});
  