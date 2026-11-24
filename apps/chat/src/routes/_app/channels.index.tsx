import { createFileRoute } from "@tanstack/react-router";
import { typography } from "@attendancy/ui/styles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/channels/")({
  component: NoChannelSelected,
});

function NoChannelSelected() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <p className={cn(typography.medium, "text-foreground/70")}>
        Choisissez un canal pour voir la conversation.
      </p>
    </div>
  );
}
