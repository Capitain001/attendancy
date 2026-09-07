"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  User as UserIcon,
  Palette,
  SunMedium,
  Bell,
  Hand,
  CircleDollarSign,
  Plug,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserInfo } from "@/types/user";

export function SettingsSidebar({
  user,
  slug,
}: {
  user: Partial<UserInfo>;
  slug: string;
}) {
  const pathname = usePathname();
  const fullName = user.name?.trim() || "ByeWind";
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = [
    { id: "profile", label: fullName, href: `/${slug}/settings/profile`, icon: UserIcon },
    { id: "theme", label: "Theme", href: `/${slug}/settings/theme`, icon: Palette },
    { id: "time", label: "Time and language", href: `/${slug}/settings/time`, icon: SunMedium },
    { id: "notifications", label: "Notifications", href: `/${slug}/settings/notifications`, icon: Bell },
    { id: "privacy", label: "Privacy", href: `/${slug}/settings/privacy`, icon: Hand },
    { id: "payment", label: "Payment", href: `/${slug}/settings/payment`, icon: CircleDollarSign },
    { id: "devices", label: "Appareils", href: `/${slug}/settings/devices`, icon: Smartphone },
    { id: "plugins", label: "Plugins", href: `/${slug}/settings/plugins`, icon: Plug },
  ];

  return (
    <aside
      className={cn(
        "relative bg-muted/40 p-2.5 sm:p-4 border-b md:border-b-0 md:border-r border-border/60 shrink-0 transition-all duration-300",
        isCollapsed ? "md:w-16" : "md:w-64",
        "w-full"
      )}
    >
      {/* Bouton de collapse (visible uniquement sur desktop) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 size-6 items-center justify-center rounded-full bg-background border border-border/60 shadow-sm hover:bg-accent transition-colors"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="size-3.5" />
        ) : (
          <ChevronLeft className="size-3.5" />
        )}
      </button>

      <nav className="flex md:flex-col gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all text-left shrink-0 whitespace-nowrap",
                isActive
                  ? "bg-background md:bg-accent/80 text-foreground font-semibold shadow-xs border border-border/40 md:border-transparent"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                isCollapsed && "md:justify-center md:px-2"
              )}
              title={isCollapsed ? tab.label : undefined}
            >
              {tab.id === "profile" ? (
                <div
                  className={cn(
                    "flex size-5 md:size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px] md:text-xs transition-all",
                    isCollapsed && "md:size-7 md:text-sm"
                  )}
                >
                  {fullName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <Icon className="size-3.5 md:size-4 shrink-0" />
              )}
              <span
                className={cn(
                  "transition-opacity duration-200",
                  isCollapsed && "md:hidden"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}