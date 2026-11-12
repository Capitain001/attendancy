// src/app/(app)/personal/[slug]/teacher/classes/[classId]/students/page.tsx
import type { Metadata } from "next";
import { connection } from "next/server";
import { getStudentsEnrollmentsAction } from "@/services/student-enrollment";
import { TClassStudentsScreen } from "@/components/teacher/screens/TClassStudentsScreen";


export const metadata: Metadata = {
  title: "Étudiants de la classe | Attendancy",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ slug: string; classId: string }>;
}

export default async function ClassStudentsPage({ params }: PageProps) {
  await connection();
  const { classId } = await params;

  const res = await getStudentsEnrollmentsAction({ classId });
  const enrollments = "data" in res && res.data ? res.data : [];

  return <TClassStudentsScreen enrollments={enrollments} />;
}