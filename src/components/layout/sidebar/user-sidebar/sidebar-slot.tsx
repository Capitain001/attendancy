"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { UserSidebar } from "./index";
import {
  DEFAULT_SIDEBAR_VIEWS,
  PLANNING_SIDEBAR_VIEWS,
} from "../views/registry";
import type { UserInfo } from "@/types";
import type { Route, SidebarView } from "../types";

// Une seule source pour le mapping segment -> vues.
// `planning` et `schedule` partagent les filtres planning (date via nuqs ?date).
function viewsForSegment(segment: string | null): SidebarView[] {
  return segment === "planning" || segment === "schedule"
    ? PLANNING_SIDEBAR_VIEWS
    : DEFAULT_SIDEBAR_VIEWS;
}

interface Props {
  user?: UserInfo;
  slug: string;
  routes: Route[];
}

export function UserSidebarSlot(props: Props) {
  const segment = useSelectedLayoutSegment(); // segment enfant actif
  return <UserSidebar {...props} availableViews={viewsForSegment(segment)} />;
}
