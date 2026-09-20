// page.tsx (server component — même logique de fetch, aucune nouvelle action)
import { connection } from 'next/server'
import { getCurrentTeacherId } from '@/services/teacher'
import { getEnrolledStudentsAction } from '@/services/student'
import { getTeacherCoursesAction } from '@/services/course-teacher'
import { TeacherStudents } from './TeacherStudents'

export default async function Page() {
  await connection()

  const teacherId = await getCurrentTeacherId()
  if (!teacherId) return <div />

  const coursesRes = await getTeacherCoursesAction(teacherId)
  const courses = 'data' in coursesRes ? (coursesRes.data ?? []) : []

  const classMap = new Map<string, string>()
  for (const c of courses) {
    if (c.class) classMap.set(c.class.id, c.class.name)
  }

  const classIds = Array.from(classMap.keys())
  const results = await Promise.all(classIds.map((classId) => getEnrolledStudentsAction(classId)))

  const groups = classIds.map((classId, i) => ({
    classId,
    className: classMap.get(classId) ?? classId,
    students: 'data' in results[i] ? (results[i].data ?? []) : [],
  }))

  return <TeacherStudents groups={groups} />
}