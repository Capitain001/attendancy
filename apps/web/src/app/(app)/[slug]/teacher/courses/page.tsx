import { connection } from 'next/server'
import { getCurrentTeacherId } from '@/services/teacher'
import { getTeacherCoursesAction } from '@/services/course-teacher'
import { TeacherCourses } from '@/components/teacher/courses/TeacherCoursesPage'


export default async function Page() {
  await connection()

  const teacherId = await getCurrentTeacherId()
  if (!teacherId) return <div />

  const res = await getTeacherCoursesAction(teacherId)
  const courses = 'data' in res ? (res.data ?? []) : []

  return <TeacherCourses courses={courses} />
}