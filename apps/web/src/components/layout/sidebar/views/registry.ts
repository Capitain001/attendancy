import dynamic from "next/dynamic";
import { List, CalendarDays, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { SidebarView } from "../types";

interface ViewEntry {
  label: string;
  icon: LucideIcon;
  Component?: ComponentType; // absent => vue de base rendue directement
}

// Listes de vues partagées (références stables -> deps useEffect saines).
export const DEFAULT_SIDEBAR_VIEWS = ["navigation"] satisfies SidebarView[];
export const PLANNING_SIDEBAR_VIEWS = ["navigation", "planning"] satisfies SidebarView[];

export const SIDEBAR_VIEWS: Record<SidebarView, ViewEntry> = {
  navigation: {
    label: "Navigation",
    icon: List,
    // pas de Component : portée par le ternaire (a besoin de orgLinks)
  },
  planning: {
    label: "Planning",
    icon: CalendarDays,
    Component: dynamic(
      () => import("./planning-filters").then((m) => m.PlanningFilters),
      { ssr: false }
    ),
  },
};
