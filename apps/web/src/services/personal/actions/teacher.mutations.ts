// src/services/personal/actions/teacher.mutations.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { createPersonalCourseSchema } from '@/services/course/validation'
import type { CreatePersonalCourseInput } from '@/services/course/validation'
import { createUEAction } from '@/services/ue/actions/ue.mutations'
import { createUECourseAction } from '@/services/ue-course/actions/ue-course.mutations'
import { createCourseAction } from '@/services/course/actions/course.mutations'
import { assignTeacherAction } from '@/services/course-teacher/actions/course-teacher.mutations'

// Création d'un cours par le professeur de son espace personnel.
// Orchestration UE → UECourse → Course → CourseTeacher(self, isMain) :
// les services propriétaires exposent chacun une action publique
// (toutes opt-in `allowPersonalOrg: true`) — ce service ne touche aucun Prisma.
export async function createPersonalCourseAction(input: CreatePersonalCourseInput) {
  const auth = await authAccess({ requiredRole: 'TEACHER', requiredOrgType: 'PERSONAL' })
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  const teacherId = user.organization?.teacherId
  if (!teacherId) return { error: ERRORS.AUTH.FORBIDDEN }

  const parsed = v.safeParse(createPersonalCourseSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  const { name, classId } = parsed.output

  const ueResult = await createUEAction({ data: { name } })
  if ('error' in ueResult || !ueResult.data) return { error: ueResult.error ?? ERRORS.SERVER }

  const ueCourseResult = await createUECourseAction({
    name,
    ueId: ueResult.data.id,
    credits: 1,
    duration: 1,
  })
  if ('error' in ueCourseResult || !ueCourseResult.data) return { error: ueCourseResult.error ?? ERRORS.SERVER }

  const courseResult = await createCourseAction({
    ueCourseId: ueCourseResult.data.id,
    classId,
    name,
  })
  if ('error' in courseResult || !courseResult.data) return { error: courseResult.error ?? ERRORS.SERVER }

  const assignResult = await assignTeacherAction({
    courseId: courseResult.data.id,
    teacherId,
    isMain: true,
  })
  if ('error' in assignResult) return { error: assignResult.error }

  return { data: courseResult.data }
}
