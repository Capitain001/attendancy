import { createRootRouteWithContext } from "@tanstack/react-router";
import { RootLayout, type RouterContext } from "@attendancy/app";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: ChatRootLayout,
});

function ChatRootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <RootLayout />
    </div>
  );
}
