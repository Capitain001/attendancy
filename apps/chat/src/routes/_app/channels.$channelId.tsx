import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthUser } from "@attendancy/auth";
import { toPresenceUser } from "@attendancy/user";
import { ChatThread } from "@attendancy/ui";
import { chat } from "@attendancy/ui/styles/ui/chat";
import { useChat } from "@/hooks/chat/useChat";
import { ANONYMOUS_NAME } from "@/hooks/chat/constants";
import { useChannels } from "@/hooks/data/channels/useChannels";
import { MESSAGE_MAX_LENGTH } from "@/services/message/constants";
import { getChannelLabel } from "../../components/ChannelList";

export const Route = createFileRoute("/_app/channels/$channelId")({
  component: ChannelPage,
});

function ChannelPage() {
  const { channelId } = Route.useParams();
  const authUser = useAuthUser();
  // Même identité tant que l'utilisateur ne change pas : le hook temps réel ne se réabonne pas
  const user = useMemo(
    () => (authUser ? toPresenceUser(authUser) : undefined),
    [authUser],
  );
  const { data } = useChannels();
  const chatState = useChat({ channelId, user });

  return (
    <ChatThread
      key={channelId}
      title={getChannelLabel(data.byId[channelId])}
      maxLength={MESSAGE_MAX_LENGTH}
      anonymousName={ANONYMOUS_NAME}
      {...chatState}
      leading={
        <Link to="/channels" className={chat.backLink}>
          Canaux
        </Link>
      }
    />
  );
}
