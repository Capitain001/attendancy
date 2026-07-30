"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
// import Logo from "@/components/organization/ux/Logo";
import { NotificationsPopover } from "../ui/NotificationsPopover";
import { Role } from "@/services/user";
// import { Role } from "@/types";

interface UserSidebarHeaderProps {
  isCollapsed: boolean;
  role?: Role ; 
  notifications: any[]; // Remplace par le type correct
}

export function UserSidebarHeader({ isCollapsed, role, notifications }: UserSidebarHeaderProps) {
  return (
    <div className={cn(
      "flex items-center",
      isCollapsed ? "flex-col gap-2" : "flex-row justify-between"
    )}>
      <div className="flex justify-center w-full items-center gap-2">
        {/* <Logo className="h-8 w-8" /> */}
        
        <div className={cn(
          'transition-all duration-1000 flex items-center justify-between w-full font-semibold', 
          isCollapsed ? 'hidden' : ''
        )}>
          <p className="text-lg font-semibold">{role}</p>
          
        </div>
      </div>

      {/* <motion.div
        key={isCollapsed ? "header-collapsed" : "header-expanded"}
        className={cn(
          "flex items-center flex-row transition-all",
          isCollapsed ? "" : "hidden"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
 
      </motion.div> */}
    </div>
  );
}