import { createRootRouteWithContext } from "@tanstack/react-router";
import { RootLayout, type RouterContext } from "@attendancy/app";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
