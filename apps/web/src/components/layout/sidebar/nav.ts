

import { Route } from "./types";
import type { SerializableRoute } from "./ui/BreadcrumbLayout";

export const routes: Route[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "LayoutDashboard",
    link: "/admin",
  },
  {
    id: "chat",
    title: "Chat", 
    icon: "MessagesSquare",
    link: "/chat",
  },
  {
    id: "ressources",
    title: "Ressources",
    icon: "FolderOpen",
    link: "/admin/ressources",
    subs: [
      {
        title: "Années académiques",
        icon: "School",
        link: "/admin/years",
      },
      {
        title: "Courses",
        icon: "LibraryBig",
        link: "/admin/courses",
      },
      {
        title: "Classes",
        icon: "BookOpen",
        link: "/admin/classes",
        subs: [
          {
            title: "Liste des classes", 
            link: "/admin/classes", 
          },
          {
            icon: "Plus",
            title: "Ajouter une sous classe", 
            link: "/admin/classes/sub", 
          },
        ],
      },
      {
        title: "Salles",
        icon: "Container",
        link: "/admin/rooms",
      },
    ],
  },
  {
    id: "teachers",
    title: "Enseignants",
    icon: "UserSearch",
    link: "/admin/teachers",
  },
  {
    id: "invitations",
    title: "Invitations",
    icon: "User2",
    link: "/admin/invitations",
  },
  {
    id: "fonctions",
    title: "Fonctions",
    icon: "UserSearch",
    link: "/admin/fonctions",
  },
  {
    id: "direction",
    title: "Direction",
    icon: "Users",
    link: "/admin/direction",
  },
  {
    id: "program-track",
    title: "Filliere", 
    icon: "Bell",
    link: "/admin/program-track",
  },
  {
    id: "departments",
    title: "Departments", 
    icon: "GraduationCap",
    link: "/admin/departments",
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: "Bell", 
    link: "/admin/notifications",
    subs: [
      {
        title: "utilisateur", 
        link: "/admin/notifications", 
      },
      {
        title: "Paramètres",
        link: "/admin/notifications/setting",
      },
    ]

  },
  {
    id: "review",
    title: "Document Review",
    icon: "FileClock",
    link: "/review",
  },
];

/**
 * Convertit une sous-route en route sérialisable (fonction récursive)
 */
function convertSubRoute(sub: import("./types").SubRoute): SerializableRoute {
  return {
    title: sub.title,
    link: sub.link,
    subs: sub.subs?.map(convertSubRoute),
  };
}

/**
 * Convertit les routes avec icônes en routes sérialisables pour les composants client
 * (supprime les icônes et autres propriétés non sérialisables)
 * Gère l'imbrication récursive des sous-routes à tous les niveaux
 */
export function getSerializableRoutes(routes: Route[]): SerializableRoute[] {
  return routes.map((route) => ({
    title: route.title,
    link: route.link,
    subs: route.subs?.map(convertSubRoute),
  }));
}


export const sampleNotifications = [
    {
      id: "1",
      avatar: "/avatars/01.png",
      fallback: "OM",
      text: "New order received.",
      time: "10m ago",
    },
    {
      id: "2",
      avatar: "/avatars/02.png",
      fallback: "JL",
      text: "Server upgrade completed.",
      time: "1h ago",
    },
    {
      id: "3",
      avatar: "/avatars/03.png",
      fallback: "HH",
      text: "New user signed up.",
      time: "2h ago",
    },
  ];
  

  
import {
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
} from "lucide-react";

export const teams = [
  {
    name: "Attendancy",
    logo: GalleryVerticalEnd,
    plan: "Enterprise",
  },
  {
    name: "Université de Lomé",
    logo: AudioWaveform,
    plan: "Pro",
  },
  {
    name: "Demo Workspace",
    logo: Command,
    plan: "Free",
  },
];
