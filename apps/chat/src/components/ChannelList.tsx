import { Link } from "@tanstack/react-router";
import { typography } from "@attendancy/ui/styles";
import { cn } from "@/lib/utils";

export type ChannelSummary = {
  id: string;
  name: string | null;
  type?: string;
};

const CHANNEL_TYPE_FALLBACK: Record<string, string> = {
  ORG: "Général",
  CLASS: "Classe",
  GROUP: "Groupe",
  DM: "Message direct",
};

export function getChannelLabel(channel?: Pick<ChannelSummary, "name" | "type"> | null) {
  const name = channel?.name?.trim();
  if (name) return name;
  return (channel?.type && CHANNEL_TYPE_FALLBACK[channel.type]) ?? "Canal";
}

export function ChannelList({
  channels,
  loading,
}: {
  channels: ChannelSummary[];
  loading: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2 className={cn(typography.h6, "border-b border-border px-4 py-3")}>
        Canaux
      </h2>

      {loading && channels.length === 0 ? (
        <p role="status" className={cn(typography.small, "p-4 text-foreground/70")}>
          Chargement des canaux…
        </p>
      ) : channels.length === 0 ? (
        <p className={cn(typography.small, "p-4 text-foreground/70")}>
          Vous n&apos;avez accès à aucun canal pour l&apos;instant.
        </p>
      ) : (
        <nav aria-label="Canaux" className="min-h-0 flex-1 overflow-y-auto p-2">
          <ul className="flex flex-col gap-0.5">
            {channels.map((channel) => (
              <li key={channel.id}>
                {/* Le Link pose aria-current="page" et data-status="active" sur le canal ouvert */}
                <Link
                  to="/channels/$channelId"
                  params={{ channelId: channel.id }}
                  className={cn(
                    typography.small,
                    "block truncate rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-secondary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "data-[status=active]:bg-secondary data-[status=active]:font-medium data-[status=active]:text-foreground",
                  )}
                >
                  {getChannelLabel(channel)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
