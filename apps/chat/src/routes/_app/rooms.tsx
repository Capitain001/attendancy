import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/rooms")({
  component: RoomsStubPage,
});

function RoomsStubPage() {
  return (
    <div className="p-6 text-sm text-muted-foreground">
      Stub rooms — prêt pour l&apos;implémentation des fonctionnalités chat.
    </div>
  );
}
