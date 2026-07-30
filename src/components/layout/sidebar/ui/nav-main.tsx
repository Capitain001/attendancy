"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuItem as SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as icons from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { Route, SubRoute, IconName } from "../types";

// Composant récursif pour gérer les sous-routes à tous les niveaux
function SubRouteItem({
  subRoute,
  parentId,
  level = 0,
  isCollapsed,
  openCollapsibles,
  setOpenCollapsibles,
}: {
  subRoute: SubRoute;
  parentId: string;
  level?: number;
  isCollapsed: boolean;
  openCollapsibles: Set<string>;
  setOpenCollapsibles: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
  const hasSubRoutes = !!subRoute.subs?.length;
  const itemId = `${parentId}-${subRoute.title}-${level}`;
  const isOpen = !isCollapsed && openCollapsibles.has(itemId);
  const SubIcon = subRoute.icon ? (icons[subRoute.icon as IconName] as React.ComponentType<{ className?: string }>) : undefined;

  if (hasSubRoutes) {
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={(open) => {
          setOpenCollapsibles((prev) => {
            const next = new Set(prev);
            if (open) {
              next.add(itemId);
            } else {
              next.delete(itemId);
            }
            return next;
          });
        }}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton
            className={cn(
              "flex w-full items-center rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              isOpen
                ? "bg-sidebar-muted text-foreground"
                : "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground"
            )}
          >
            {SubIcon && <SubIcon className="h-4 w-4 mr-2" />}
            <span className="flex-1 text-left">{subRoute.title}</span>
            <span className="ml-auto">
              {isOpen ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </span>
          </SidebarMenuSubButton>
        </CollapsibleTrigger>

        {!isCollapsed && (
          <CollapsibleContent>
            <SidebarMenuSub className="my-1 ml-3.5">
              {subRoute.subs?.map((nestedSub) => (
                <SidebarMenuSubItem
                  key={`${itemId}-${nestedSub.title}`}
                  className="h-auto"
                >
                  <SubRouteItem
                    subRoute={nestedSub}
                    parentId={itemId}
                    level={level + 1}
                    isCollapsed={isCollapsed}
                    openCollapsibles={openCollapsibles}
                    setOpenCollapsibles={setOpenCollapsibles}
                  />
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  }

  return (
    <SidebarMenuSubButton asChild>
      <Link
        href={subRoute.link}
        prefetch={true}
        className={cn(
          "flex items-center rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
          SubIcon && "gap-2"
        )}
      >
        {SubIcon && <SubIcon className="h-4 w-4" />}
        {subRoute.title}
      </Link>
    </SidebarMenuSubButton>
  );
}

export default function DashboardNavigation({ routes }: { routes: Route[] }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [openCollapsibles, setOpenCollapsibles] = useState<Set<string>>(
    new Set()
  );

  return (
    <SidebarMenu>
      {routes.map((route) => {
        const isOpen = !isCollapsed && openCollapsibles.has(route.id);
        const hasSubRoutes = !!route.subs?.length;
        const Icon = route.icon ? (icons[route.icon as IconName] as React.ComponentType<{ className?: string }>) : undefined;
        return (
          <SidebarMenuItem key={route.id} className="">
            {hasSubRoutes ? (
              <Collapsible
                open={isOpen}
                onOpenChange={(open) => {
                  setOpenCollapsibles((prev) => {
                    const next = new Set(prev);
                    if (open) {
                      next.add(route.id);
                    } else {
                      next.delete(route.id);
                    }
                    return next;
                  });
                }}
                className="w-full "
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className={cn(
                      "flex w-full items-center rounded-lg px-2 transition-colors",
                      isOpen
                        ? "bg-sidebar-muted text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                      isCollapsed && "justify-center"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {!isCollapsed && (
                      <span className="ml-2 flex-1 text-sm font-medium">
                        {route.title}
                      </span>
                    )}
                    {!isCollapsed && hasSubRoutes && (
                      <span className="ml-auto">
                        {isOpen ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </span>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                {!isCollapsed && (
                  <CollapsibleContent>
                    <SidebarMenuSub className="my-1 ml-3.5 ">
                      {route.subs?.map((subRoute) => (
                        <SidebarMenuSubItem
                          key={`${route.id}-${subRoute.title}`}
                          className="h-auto"
                        >
                          <SubRouteItem
                            subRoute={subRoute}
                            parentId={route.id}
                            level={0}
                            isCollapsed={isCollapsed}
                            openCollapsibles={openCollapsibles}
                            setOpenCollapsibles={setOpenCollapsibles}
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </Collapsible>
            ) : (
              <SidebarMenuButton tooltip={route.title} asChild>
                <Link
                  href={route.link}
                  prefetch={true}
                  className={cn(
                    "flex items-center rounded-lg px-2 transition-colors text-muted-foreground hover:bg-sidebar-muted hover:text-foreground",
                    isCollapsed && "justify-center"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {!isCollapsed && (
                    <span className="ml-2 text-sm font-medium">
                      {route.title}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
