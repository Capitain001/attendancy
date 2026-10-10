import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/home")({
  component: () => <div className="p-6">Connecté</div>,
});
