import { connection } from "next/server";
import type { ReactNode } from "react";
import MobileNavMenu from "@/components/layout/to-implemente/mobile-navbar";
import { teacherRoutes } from "@/components/teacher/user/navigation";
import { personal } from "@/modules/personal/paths";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function PersonalTeacherLayout({ children, params }: LayoutProps) {
  await connection();
  const { slug } = await params;
  const teacherHome = personal.home(slug);
  const navItems = [
    { heading: "Dashboard", href: teacherHome },
    { heading: "Mes classes", href: personal.classes(slug) },
    ...teacherRoutes
      .filter((route) => route.id !== "dashboard")
      .map((route) => ({
        heading: route.title,
        href: `${teacherHome}${route.link.replace("/teacher", "")}`,
      })),
  ];

  return (
    <>
      <MobileNavMenu navItems={navItems} />
      {children}
    </>
  );
}