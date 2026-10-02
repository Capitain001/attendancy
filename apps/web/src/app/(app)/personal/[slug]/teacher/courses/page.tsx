import { connection } from "next/server";
import { getCurrentTeacherId } from "@/services/teacher";
import { getTeacherCoursesAction } from "@/services/course-teacher";
import { TeacherCourses } from "@/components/teacher/courses/TeacherCoursesPage";

export default async function PersonalTeacherCoursesPage() {
  await connection();

  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return <div />;

  const result = await getTeacherCoursesAction(teacherId);
  const courses = "data" in result ? result.data ?? [] : [];

  return <TeacherCourses courses={courses} />;
}