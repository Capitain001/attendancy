"use client";

import { useEffect, useState } from "react";
import type { SidebarView } from "../types";

export function useSidebarViews(availableViews: readonly SidebarView[]) {
  const [view, setView] = useState<SidebarView>(availableViews[0]);

  // Vue courante plus disponible (changement de route) -> 1ere vue
  useEffect(() => {
    if (!availableViews.includes(view)) setView(availableViews[0]);
  }, [availableViews, view]);

  return { view, setView };
}
