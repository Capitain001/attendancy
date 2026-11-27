// apps/chat/src/routes/_app/route.tsx
import { useMemo } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth, useAuthUser } from "@attendancy/auth";
import { toPresenceUser } from "@attendancy/user";
import { isTauri } from "@tauri-apps/api/core";
import WebSocket from "@tauri-apps/plugin-websocket";
import { createTauriWebSocketCtor } from "@attendancy/chat";
import { ChatSyncProvider } from "@/modules/chat";
import { useChannels } from "@/hooks/data/channels/useChannels";

export const Route = createFileRoute("/_app")({
  beforeLoad: requireAuth,
  component: AppLayout,
});

// Dans l'app Tauri, le LAN passe par le plugin natif. Hors Tauri (vite seul, en développement),
// on garde le WebSocket du navigateur.
const webSocketImpl = isTauri() ? createTauriWebSocketCtor(WebSocket) : undefined;

function AppLayout() {
  const user = useAuthUser();
  // Même identité tant que l'utilisateur ne change pas : ChatSyncProvider ne relance rien
  const presenceUser = useMemo(
    () => (user ? toPresenceUser(user) : null),
    [user],
  );
  const { data } = useChannels({ enabled: !!presenceUser });
  const channelIds = useMemo(
    () => data.items.map((c) => c.id),
    [data.items],
  );

  // Local et immédiat : seulement le temps que la session se résolve, jamais le réseau
  if (!presenceUser) return null;

  return (
    <ChatSyncProvider user={presenceUser} channelIds={channelIds} webSocketImpl={webSocketImpl}>
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
    </ChatSyncProvider>
  );
}
