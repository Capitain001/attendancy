// Mise en page : liste des canaux + fil ouvert. Sur mobile, un seul volet à la fois.
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useChannels } from "@/hooks/data/channels/useChannels";
import { ChannelList } from "../../components/ChannelList";
import { api } from "@rpc-api";

export const Route = createFileRoute("/_app/channels")({
  component: ChannelsLayout,
});

function ChannelsLayout() {
  const { channelId } = useParams({ strict: false });
  const { data, loading } = useChannels();
  return (
    <div className="flex min-h-0 flex-1">
      <div
        className={cn(
          "w-80 shrink-0 border-r border-border max-md:w-full",
          channelId && "max-md:hidden",
        )}
      >

        <ChannelList channels={data.items} loading={loading} />
      </div>
      <main className={cn("min-w-0 flex-1", !channelId && "max-md:hidden")}>
        <Outlet />
      </main>
    </div>
  );
}
