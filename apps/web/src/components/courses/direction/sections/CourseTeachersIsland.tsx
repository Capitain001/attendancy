'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCourseTeachersAction, syncCourseTeachersAction } from '@/services/course-teacher'
import { getTeachersAction } from '@/services/teacher'
import { TeacherSection } from '../components/TeacherSection'
import type { Teacher, CourseTeacherRelation } from '../components/TeacherSection'

export function CourseTeachersIsland({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [teachers, setTeachers] = useState<CourseTeacherRelation[]>([])
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([])

  useEffect(() => {
    getCourseTeachersAction(courseId).then((res) => {
      if (!('error' in res) && res.data) {
        setTeachers(
          res.data.map((ct) => ({
            id: ct.id,
            teacherId: ct.teacher?.id ?? null,
            isMain: ct.isMain,
            hours: ct.hours,
          })),
        )
      }
    })
    getTeachersAction().then((res) => {
      if (!('error' in res) && res.data) {
        setAllTeachers(
          res.data.map((t) => ({
            id: t.id,
            firstName: t.user.firstName,
            lastName: t.user.lastName,
            avatar_url: t.user.avatar_url,
          })),
        )
      }
    })
  }, [courseId])

  async function handleSave({
    principalId,
    assistantIds,
  }: {
    principalId: string
    assistantIds: string[]
  }) {
    const res = await syncCourseTeachersAction({ courseId, principalId, assistantIds })
    if ('error' in res) {
      console.error(res.error)
      return
    }
    router.refresh()
  }

  return <TeacherSection courseTeachers={teachers} allTeachers={allTeachers} onSave={handleSave} />
}
