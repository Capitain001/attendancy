"use client";

import { motion } from "motion/react";
import type { SidebarView } from "../types";
import { SIDEBAR_VIEWS } from "../views/registry";
import { cn } from "@/lib/utils";

interface Props {
  view: SidebarView;
  availableViews: readonly SidebarView[];
  onChange: (v: SidebarView) => void;
}

export function SidebarSwitcher({ view, availableViews, onChange }: Props) {
  if (availableViews.length <= 1) return null; // une seule vue -> pas de switch

  return (
    <div
      role="tablist"
      aria-label="Vue de la barre latérale"
      className={cn(
        "relative flex items-center gap-0.5 rounded-lg p-0.5",
        "bg-sidebar-accent/40 ring-1 ring-sidebar-border/60",
        // masqué quand la sidebar est réduite en mode icône
        "group-data-[collapsible=icon]:hidden"
      )}
    >
      {availableViews.map((v) => {
        const { label, icon: Icon } = SIDEBAR_VIEWS[v];
        const isActive = view === v;

        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(v)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5",
              "rounded-md px-2.5 py-1.5 text-xs font-medium tracking-tight",
              "transition-colors duration-200 outline-none",
              "focus-visible:ring-2 focus-visible:ring-sidebar-ring/70",
              isActive
                ? "text-sidebar-accent-foreground"
                : "text-muted-foreground hover:text-sidebar-accent-foreground/80"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-switcher-active"
                className={cn(
                  "absolute inset-0 z-0 rounded-md",
                  "bg-sidebar shadow-sm ring-1 ring-sidebar-border"
                )}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon
              className={cn(
                "relative z-10 size-3.5 shrink-0 transition-transform duration-200",
                isActive ? "scale-100" : "scale-95"
              )}
            />
            <span className="relative z-10 truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
