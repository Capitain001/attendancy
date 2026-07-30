"use client";

import type { UserInfo } from "@/services/user/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Bell, LogOut, User } from "lucide-react";
import Image from "next/image";

interface FooterMenuProps {
  user?: Pick<
    UserInfo,
    "name" | "email" | "avatar_url" | "function"
  >;
}


export function FooterMenu({ user }: FooterMenuProps) {
    if (!user) return null;
    const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.name ?? "User"}
                    width={32}
                    height={32}
                    className="size-full object-cover"
                  />
                ) : (
                  <User className="size-4" />
                )}
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user.name ?? "Utilisateur"}
                </span>

                <span className="truncate text-xs text-muted-foreground">
                  {user.function ?? user.email}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg mb-4"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <User className="size-4 mr-2" />
              Mon profil
            </DropdownMenuItem>

            <DropdownMenuItem>
              <Bell className="size-4 mr-2" />
              Notifications
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <LogOut className="size-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}