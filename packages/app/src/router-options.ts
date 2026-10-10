import { createHashHistory } from "@tanstack/react-router";

export const baseRouterOptions = {
  history: createHashHistory(), // obligatoire avec Tauri
  defaultPreload: "intent" as const,
  context: { auth: undefined! }, // rempli à l'exécution par AppRouter
};
