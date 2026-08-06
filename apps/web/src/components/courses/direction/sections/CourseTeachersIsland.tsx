'use client'

import { useMemo } from 'react'
import { useCourseTeachers } from '@/hooks/data/courses/useCourseTeachers'
import { useTeachers } from '@/hooks/data/teachers/useTeachers'
import { useSyncCourseTeachers } from '@/hooks/data/courses/useSyncCourseTeachers'
import { TeacherSection } from '../components/TeacherSection'
import type { Teacher, CourseTeacherRelation } from '../types'

export function CourseTeachersIsland({ courseId }: { courseId: string }) {
  // Lectures via hooks/data (invariant : un client ne touche jamais une action
  // serveur en direct) — React Query gère cache, états et annulation.
  const courseTeachersEntity = useCourseTeachers({ courseId })
  const teachersEntity = useTeachers({})
  const { sync } = useSyncCourseTeachers(courseId)

  const courseTeachers = useMemo<CourseTeacherRelation[]>(
    () =>
      courseTeachersEntity.data.items.map((ct) => ({
        id: ct.id,
        teacherId: ct.teacher?.id ?? null,
        isMain: ct.isMain,
        hours: ct.hours,
      })),
    [courseTeachersEntity.data.items],
  )

  const allTeachers = useMemo<Teacher[]>(
    () =>
      teachersEntity.data.items.map((t) => ({
        id: t.id,
        firstName: t.user.firstName,
        lastName: t.user.lastName,
        avatar_url: t.user.avatar_url,
      })),
    [teachersEntity.data.items],
  )

  async function handleSave({
    principalId,
    assistantIds,
  }: {
    principalId: string
    assistantIds: string[]
  }) {
    await sync({ principalId, assistantIds })
  }

  return <TeacherSection courseTeachers={courseTeachers} allTeachers={allTeachers} onSave={handleSave} />
}
