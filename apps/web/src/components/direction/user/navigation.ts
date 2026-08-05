import { Route } from "@/components/layout/sidebar/types";

export const directionRoutes: Route[] = [
  {
    id: "dashboard",
    title: "Tableau de bord",
    icon: "LayoutDashboard",
    link: "/direction",
  },
  {
    id: "academic",
    title: "Ressources",
    icon: "FolderOpen",
    link: "/direction/academic/classes",
    subs: [
      {
        title: "Années",
        icon: "CalendarRange",
        link: "/direction/academic/years",
      },
      {
        title: "Départements",
        icon: "Building2",
        link: "/direction/academic/departments",
      },
      {
        title: "Filières",
        icon: "School",
        link: "/direction/academic/program-tracks",
      },
      {
        title: "Programmes",
        icon: "BookMarked",
        link: "/direction/academic/programs",
      },
      {
        title: "Classes",
        icon: "BookOpen",
        link: "/direction/academic/classes",
      },
      {
        title: "UEs",
        icon: "LibraryBig",
        link: "/direction/academic/courses",
      },
    ],
  },
  {
    id: "people",
    title: "Personnel",
    icon: "Users",
    link: "/direction/people/teachers",
    subs: [
      {
        title: "Enseignants",
        icon: "UserSearch",
        link: "/direction/people/teachers",
      },
      {
        title: "Étudiants",
        icon: "GraduationCap",
        link: "/direction/people/students",
      },
      {
        title: "Parents",
        icon: "UsersRound",
        link: "/direction/people/parents",
      },
    ],
  },
  {
    id: "attendance",
    title: "Présences",
    icon: "ClipboardCheck",
    link: "/direction/attendance/sessions",
    subs: [
      {
        title: "Sessions",
        icon: "Radio",
        link: "/direction/attendance/sessions",
      },
      {
        title: "Rapports",
        icon: "BarChart3",
        link: "/direction/attendance/reports",
      },
    ],
  },
  {
    id: "schedule",
    title: "Planning",
    icon: "CalendarDays",
    link: "/direction/schedule/calendar",
    subs: [
      {
        title: "Calendrier",
        icon: "CalendarDays",
        link: "/direction/schedule/calendar",
      },
      {
        title: "Salles",
        icon: "Container",
        link: "/direction/schedule/rooms",
      },
      {
        title: "Événements",
        icon: "CalendarCheck2",
        link: "/direction/schedule/events",
      },
    ],
  },
  {
    id: "evaluation",
    title: "Évaluations",
    icon: "ClipboardList",
    link: "/direction/evaluation",
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
    ],
  },
  {
    id: "administration",
    title: "Paramètres",
    icon: "Settings",
    link: "/direction/administration/settings",
    subs: [
      {
        title: "Général",
        icon: "Settings",
        link: "/direction/administration/settings",
      },
      {
        title: "Fonctions",
        icon: "FunctionSquare",
        link: "/direction/functions",
      },
      {
        title: "Journal d'audit",
        icon: "ScrollText",
        link: "/direction/administration/audit",
      },
    ],
  },
];
