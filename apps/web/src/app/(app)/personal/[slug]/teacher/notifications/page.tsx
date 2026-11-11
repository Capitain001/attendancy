// src/app/(app)/personal/[slug]/teacher/notifications/page.tsx
import { connection } from "next/server";
import { TeacherNotificationsPage } from "@/components/teacher/pages/TeacherNotificationsPage";

export default async function PersonalTeacherNotificationsPage() {
  await connection();
  return <TeacherNotificationsPage />;
}