//apps\chat\src\routes\_app\route.tsx
import { useMemo } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth, useAuthUser } from "@attendancy/auth";
import { toPresenceUser } from "@attendancy/user";
import { ChatSyncProvider } from "@/modules/chat";

export const Route = createFileRoute("/_app")({
  beforeLoad: requireAuth,
  component: AppLayout,
});

function AppLayout() {
  const user = useAuthUser();
  // Même identité tant que l'utilisateur ne change pas : ChatSyncProvider ne relance rien
  const presenceUser = useMemo(
    () => (user ? toPresenceUser(user) : null),
    [user],
  );

  // Local et immédiat : seulement le temps que la session se résolve, jamais le réseau
  if (!presenceUser) return null;

  return (
    <ChatSyncProvider user={presenceUser} channelIds={[]}>
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </ChatSyncProvider>
  );
}
