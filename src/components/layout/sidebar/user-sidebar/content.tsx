"use client"

import DashboardNavigation from "@/components/layout/sidebar/ui/nav-main";
import { SearchSidebar } from "../ui/SearchSidebar";
import { mockSidebarData } from "../mockData";

interface UserSidebarContentProps {
  routes: any[]; // TODO: Remplace par le type correct
}


export function UserSidebarContent({ routes }: UserSidebarContentProps) {


  return (
    <div className=" gap-4  px-2 py-4">
      {/* <SearchSidebar data={mockSidebarData} /> */}
      <DashboardNavigation routes={routes} />
    </div>
  );
}