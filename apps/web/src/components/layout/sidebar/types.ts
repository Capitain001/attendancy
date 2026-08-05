import { LucideIcon } from "lucide-react";
import type { ElementType } from "react";

import * as icons from "lucide-react";


export type IconName = keyof typeof icons;

export type SidebarView = "navigation" | "planning";
// futur: | "stats" | "team" ...

export type SubRoute = {
  title: string;
  link: string;
  icon?: IconName;
  subs?: SubRoute[];
};

export type Route = {
  id: string;
  title: string;
  icon?: IconName;
  link: string;
  subs?: SubRoute[];
};

  export interface NavItem {
    id: string;
    title: string;
    icon: ElementType;
    url?: string;
    isActive?: boolean;
  }
  
  export interface User {
    name: string;
    email: string;
    avatar: string;
  }
  
  export interface FavoriteItem {
    id: string;
    title: string;
    href: string;
    color: string;
  }
  
  export interface TeamItem {
    id: string;
    title: string;
    icon: ElementType;
  }
  
  export interface TopicItem {
    id: string;
    title: string;
    icon: ElementType;
  }
  
  export interface SidebarData {
    user: User;
    navMain: NavItem[];
    navCollapsible: {
      favorites: FavoriteItem[];
      teams: TeamItem[];
      topics: TopicItem[];
    };
  }
  