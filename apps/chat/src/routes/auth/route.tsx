import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireGuest } from "@attendancy/auth";

export const Route = createFileRoute("/auth")({
  beforeLoad: requireGuest,
  component: Outlet,
});
