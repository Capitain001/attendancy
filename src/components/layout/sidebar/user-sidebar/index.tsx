"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { sampleNotifications } from "../nav";
import { UserSidebarHeader } from "./header";
import { UserSidebarContent } from "./content";
import { SidebarSwitcher } from "../ui/sidebar-switcher";
import { SIDEBAR_VIEWS, DEFAULT_SIDEBAR_VIEWS } from "../views/registry";
import { useSidebarViews } from "../hooks/use-sidebar-views";
import { useMemo } from "react";
import { UserInfo } from "@/types";
import { SubRoute, Route, SidebarView } from "../types";
import { FooterMenu } from "../ui/footer-menu";

export { UserSidebarSlot } from "./sidebar-slot";

// Fonction récursive pour ajouter le slug à tous les niveaux de sous-routes
function addSlugToSubRoutes(subs: SubRoute[] | undefined, slug: string): SubRoute[] | undefined {
  if (!subs) return undefined;

  return subs.map((sub) => ({
    ...sub,
    link: `/${slug}${sub.link}`,
    subs: addSlugToSubRoutes(sub.subs, slug),
  }));
}

interface UserSidebarProps {
  user?: UserInfo;
  slug: string;
  routes: Route[];
  availableViews?: readonly SidebarView[];
}

export function UserSidebar({
  user,
  slug,
  routes,
  availableViews = DEFAULT_SIDEBAR_VIEWS,
}: UserSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { view, setView } = useSidebarViews(availableViews);

  const orgLinks = useMemo(() => {
    return routes?.map((route) => ({
      ...route,
      link: `/${slug}${route.link}`,
      subs: addSlugToSubRoutes(route?.subs, slug),
    }));
  }, [routes, slug]);

  // Vue annexe (planning...) : Component du registry. navigation = pas de Component.
  const ActiveView = SIDEBAR_VIEWS[view].Component;

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <UserSidebarHeader
          role={user?.role ?? "GUEST"}
          isCollapsed={isCollapsed}
          notifications={sampleNotifications}
        />
        <SidebarSwitcher
          view={view}
          availableViews={availableViews}
          onChange={setView}
        />
      </SidebarHeader>

      <SidebarContent>
        {view === "navigation" || !ActiveView ? (
          <UserSidebarContent routes={orgLinks} />
        ) : (
          <ActiveView />
        )}
      </SidebarContent>

      <SidebarFooter>
        <FooterMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
