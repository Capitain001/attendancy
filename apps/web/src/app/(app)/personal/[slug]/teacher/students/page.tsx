import { connection } from "next/server";
import { getCurrentTeacherId } from "@/services/teacher";
import { getEnrolledStudentsAction } from "@/services/student";
import { getTeacherCoursesAction } from "@/services/course-teacher";
import { TeacherStudents } from "@/app/(app)/[slug]/teacher/students/TeacherStudents";

export default async function PersonalTeacherStudentsPage() {
  await connection();

  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return <div />;

  const coursesResult = await getTeacherCoursesAction(teacherId);
  const courses = "data" in coursesResult ? coursesResult.data ?? [] : [];
  const classMap = new Map<string, string>();

  for (const course of courses) {
    if (course.class) classMap.set(course.class.id, course.class.name);
  }

  const classIds = Array.from(classMap.keys());
  const results = await Promise.all(classIds.map((classId) => getEnrolledStudentsAction(classId)));
  const groups = classIds.map((classId, index) => ({
    classId,
    className: classMap.get(classId) ?? classId,
    students: "data" in results[index] ? results[index].data ?? [] : [],
  }));

  return <TeacherStudents groups={groups} />;
}