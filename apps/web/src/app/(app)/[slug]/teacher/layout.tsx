import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { BreadcrumbLayout } from "@/components/layout/sidebar/ui/BreadcrumbLayout";
import { getSerializableRoutes } from "@/components/layout/sidebar/nav";
import { getUserInfo } from "@/modules/user";
import type { ReactNode } from "react";
import { UserSidebarSlot } from "@/components/layout/sidebar";
import { teacherRoutes } from "@/components/teacher/user/navigation";

import MobileNavMenu from "@/components/layout/to-implemente/mobile-navbar";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

const Layout = async ({ children, params }: LayoutProps) => {
  const [user, { slug }] = await Promise.all([getUserInfo(), params]);

  const navItems = teacherRoutes.map((route) => ({
    heading: route.title,
    href: `/${slug}${route.link}`,
  }));

  return (
    <SidebarProvider className="h-full overflow-hidden teacher-theme">
      <UserSidebarSlot routes={teacherRoutes} user={user ?? undefined} slug={slug} />
      <SidebarInset className="min-w-0 overflow-hidden flex flex-col">
        <header className="hidden md:flex h-12 shrink-0 items-center transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 justify-between w-full bg-transparent md:bg-inherit">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <BreadcrumbLayout
                routes={getSerializableRoutes(teacherRoutes)}
                homeLabel="Teacher"
                homeHref={`/${slug}/teacher`}
              />
            </div>
          </div>
        </header>
            <MobileNavMenu navItems={navItems} />
        <div className="flex flex-1 flex-col overflow-y-auto scrollbar-hidden gap-4 p-2 md:p-4 pt-0 min-w-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
