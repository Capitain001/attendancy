import { Route } from "@/components/layout/sidebar/types";

export const teacherRoutes: Route[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "LayoutDashboard",
    link: "/teacher",
  },
  {
    id: "courses",
    title: "Mes cours",
    icon: "LibraryBig",
    link: "/teacher/courses",
  },
  {
    id: "planning",
    title: "Planning",
    icon: "CalendarDays",
    link: "/teacher/planning",
  },
  {
    id: "presences",
    title: "Présences",
    icon: "ClipboardCheck",
    link: "/teacher/attendance",
  },
  {
    id: "evaluations",
    title: "Évaluations",
    icon: "Award",
    link: "/teacher/evaluations",
  },
  {
    id: "students",
    title: "Mes étudiants",
    icon: "GraduationCap",
    link: "/teacher/students",
  },
  {
    id: "sessions",
    title: "Mes sessions",
    icon: "Activity",
    link: "/teacher/sessions",
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: "Bell",
    link: "/teacher/notifications",
  },
];
