import { Route } from "@/components/layout/sidebar/types";

export const directionRoutes: Route[] = [
  {
    id: "dashboard",
    title: "Tableau de bord",
    icon: "LayoutDashboard",
    link: "/direction",
  },
  // Chat hors-MVP : masqué de la navigation jusqu'au pilote (code conservé).
  // {
  //   id: "chat",
  //   title: "Chat",
  //   icon: "MessagesSquare",
  //   link: "/chat",
  // },
  {
    id: "ressources",
    title: "Ressources",
    icon: "FolderOpen",
    link: "/direction/program-track",
    subs: [
      {
        title: "Années",
        icon: "School",
        link: "/direction/years",
      },
      {
        title: "Filières",
        icon: "School",
        link: "/direction/program-track",
      },
      {
        title: "Programmes",
        icon: "LibraryBig",
        link: "/direction/program",
      },
      // {
      //   title: "Cours",
      //   icon: "LibraryBig",
      //   link: "/direction/courses",
      // },
      // {
      //   title: "Classes",
      //   icon: "BookOpen",
      //   link: "/direction/classes",
      // },
      {
        title: "Salles",
        icon: "Container",
        link: "/direction/rooms",
      },
    ],
  },
  {
    id: "functions",
    title: "Fonctions",
    icon: "FunctionSquare",
    link: "/direction/functions",
  },
  {
    id: "personnel",
    title: "Personnel",
    icon: "Users",
    // Page agrégée `/direction/personnel` = stub → le parent pointe vers Enseignants
    // (sous-pages réelles). Masquage du non-prêt, cohérent avec Chat.
    link: "/direction/teachers",
    subs: [
      {
        title: "Enseignants",
        icon: "UserSearch",
        link: "/direction/teachers",
      },
      {
        title: "Étudiants",
        icon: "GraduationCap",
        link: "/direction/students",
      },
    ],
  },
  {
    id: "planning",
    title: "Planning",
    icon: "CalendarDays",
    link: "/direction/planning",
    subs: [
      {
        title: "Vue calendrier",
        icon: "CalendarDays",
        link: "/direction/planning",
      },
      {
        title: "Séances du jour",
        icon: "ClipboardCheck",
        link: "/direction/schedule",
      },
    ],
  },
  {
    id: "sessions",
    title: "Sessions",
    icon: "Radio",
    link: "/direction/sessions",
  },
  {
    id: "invitations",
    title: "Invitations",
    icon: "UserCheck",
    link: "/direction/invitations",
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: "Bell",
    link: "/direction/notifications",
    subs: [
      {
        title: "Mes notifications",
        link: "/direction/notifications",
      },
      {
        title: "Planning",
        link: "/direction/notifications/schedules",
      },
      // Paramètres de notifications = stub → masqué de la nav jusqu'à implémentation
      // (cohérent avec Chat). Route + page conservées.
    ],
  },
  {
    id: "settings",
    title: "Paramètres",
    icon: "Settings",
    link: "/direction/settings",
    subs: [
      {
        title: "Général",
        link: "/direction/settings",
      },
      {
        title: "Informations",
        link: "/direction/settings/info",
      },
    ],
  },
];
