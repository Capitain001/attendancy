import { createRootRouteWithContext } from "@tanstack/react-router";
import { RootLayout, type RouterContext } from "@attendancy/app";
import { useCurrentUser, useAuth } from "@attendancy/auth";
import { ChatSyncProvider } from "@/modules/chat";
import type { PresenceUser } from "@/types";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: ChatRootLayout,
});

function ChatRootLayout() {
  const { data: user } = useCurrentUser();
  const auth = useAuth();
  const userId =
    user?.id ?? (auth?.status === "signed-in" ? auth.session.user.id : null);

  const content = (
    <div className="min-h-screen bg-background text-foreground">
      <RootLayout />
    </div>
  );

  if (!userId) return content;

  const presenceUser: PresenceUser = {
    id: userId,
    name: user?.name,
    email: user?.email,
    avatar_url: user?.avatar_url,
    role: user?.role,
    function: user?.function,
    status: user?.status,
    organization: user?.organization,
  };

  return (
    <ChatSyncProvider user={presenceUser} channelIds={[]}>
      {content}
    </ChatSyncProvider>
  );
}
