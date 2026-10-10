import { createRouter } from "@tanstack/react-router";
import { baseRouterOptions } from "@attendancy/app";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({ routeTree, ...baseRouterOptions });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
