import { Route } from "@/components/layout/sidebar/types";

/** Navigation latérale de l'espace étudiant (portée de la V1). */
export const studentRoutes: Route[] = [
  {
    id: "dashboard",
    title: "Accueil",
    icon: "Home",
    link: "/student",
  },
  {
    id: "planning",
    title: "Planning",
    icon: "CalendarDays",
    link: "/student/planning",
  },
  {
    id: "session",
    title: "Session",
    icon: "Clock",
    link: "/student/session",
  },
  {
    id: "class",
    title: "Ma classe",
    icon: "BookOpen",
    link: "/student/class",
  },
  {
    id: "courses",
    title: "Cours",
    icon: "LibraryBig",
    link: "/student/courses",
  },
  {
    id: "attendance",
    title: "Présences",
    icon: "ClipboardCheck",
    link: "/student/attendance",
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: "Bell",
    link: "/student/notifications",
  },
  {
    id: "chat",
    title: "Messages",
    icon: "MessagesSquare",
    link: "/chat",
  },
];