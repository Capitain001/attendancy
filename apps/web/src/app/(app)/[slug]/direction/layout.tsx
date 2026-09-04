//src/app/(attendancy)/[slug]/direction/layout.tsx
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"



import { BreadcrumbLayout } from "@/components/layout/sidebar/ui/BreadcrumbLayout"
import { routes, getSerializableRoutes } from "@/components/layout/sidebar/nav"

import { getUserInfo } from '@/modules/user';
import type { ReactNode } from "react";
import React from 'react';
import { UserSidebarSlot } from "@/components/layout/sidebar";
import { directionRoutes } from "@/components/direction/user/navigation";
import { RoleLiveBar } from "@/components/RealTime/RoleLiveBar";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{
    slug: string; // test
  }>;
}

const Layout = async ({ children, params }: LayoutProps) => {
  const [user, { slug }] = await Promise.all([getUserInfo(), params]);

  return (
    <SidebarProvider className="h-full overflow-hidden">
      <UserSidebarSlot routes={directionRoutes} user={user ?? undefined} slug={slug} />
      <SidebarInset className="min-w-0 overflow-hidden flex flex-col">
        <header className="flex h-12 shrink-0 items-center  transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 justify-between w-full bg-transparent md:bg-inherit">
            <div className="flex items-center gap-2 ">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <BreadcrumbLayout
                routes={getSerializableRoutes(directionRoutes)}
                homeLabel="Direction"
                homeHref={`/${slug}/direction`}
              />
            </div>

            <div className="flex items-center gap-2">
              <RoleLiveBar role={"DIRECTION"} />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col  overflow-y-auto scrollbar-hidden gap-4 p-2 md:p-4 md:pt-0 min-w-0 !pb-16">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


export default Layout;