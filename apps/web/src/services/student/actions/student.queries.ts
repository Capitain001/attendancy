'use server'
import { getUserInfo } from '@/modules/user'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  getEnrolledStudents, getStudentActiveSession, getStudentProfile,
  getStudentSchedules, getStudentStats, getStudentSessionDetail,
  getStudentByIdForDirection, getParentsForDirection,
} from '../database'

export async function getCurrentStudentId(): Promise<string | null> {
  const user = await getUserInfo()
  return user?.organization?.studentId ?? null
}

import { prisma } from '@/lib/prisma'

async function tempEnrollStudentIfNeeded(studentId: string, userId: string, orgId: string) {
  try {
    const invitation = await prisma.invitation.findFirst({
      where: {
        userId,
        orgId,
        usedAt: { not: null },
      },
    })

    if (!invitation) {
      console.log("[Enrollment Check] No accepted invitation found in DB for user:", userId)
      return
    }

    const details = (invitation.details as any) || {}
    let classId = details.enrollment?.classId
    let groupIds = details.enrollment?.groupIds || []

    // Fallback : si l'objet enrollment n'est pas dans details (cas des anciennes invitations),
    // on utilise le resourceId (qui contient le classId) et resourceType === "CLASS"
    if (!classId && invitation.resourceType === "CLASS" && invitation.resourceId) {
      classId = invitation.resourceId
      console.log("[Enrollment Check] Fallback to invitation resourceId as classId:", classId)
    }

    if (classId) {
      const existingEnrollment = await prisma.studentEnrollment.findFirst({
        where: {
          studentId,
          classId,
        },
      })

      if (!existingEnrollment) {
        console.log("[Enrollment Check] Student not enrolled yet. Registering enrollment in class:", classId)
        await prisma.$transaction(async (tx) => {
          const studentEnrollment = await tx.studentEnrollment.create({
            data: {
              studentId,
              classId,
            },
          })

          if (Array.isArray(groupIds) && groupIds.length > 0) {
            await tx.studentGroup.createMany({
              data: groupIds.map((groupId: string) => ({
                enrollmentId: studentEnrollment.id,
                groupId,
              })),
            })
          }
        })
        console.log("[Enrollment Check] Enrollment and student groups successfully created.")
      } else {
        console.log("[Enrollment Check] Student is already enrolled in class:", classId)
      }
    } else {
      console.log("[Enrollment Check] Invitation found, but no enrollment classId inside details.")
    }
  } catch (err) {
    console.error("Erreur lors de l'enrôlement temporaire de l'étudiant:", err)
  }
}

export async function getStudentProfileAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  const studentId = user.organization?.studentId
  if (!studentId) return { error: 'Profil étudiant introuvable' }

  // Temporaire : s'assurer que l'étudiant est inscrit s'il a déjà accepté l'invitation
  await tempEnrollStudentIfNeeded(studentId, user.id, orgId)

  try {
    const profile = await getStudentProfile(studentId, orgId)
    if (!profile) return { error: 'Profil étudiant introuvable' }
    return { data: profile }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getStudentScheduleAction(params: {
  classId: string
  groupIds: string[]
  rangeStart: Date
  rangeEnd: Date
}) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getStudentSchedules(params.groupIds, { orgId, ...params }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getStudentStatsAction(params: { classId: string; groupIds: string[] }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  const studentId = user.organization?.studentId
  if (!studentId) return { error: 'Profil étudiant introuvable' }

  try {
    return { data: await getStudentStats({ studentId, orgId, ...params }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getStudentSessionDetailAction(params: { scheduleId: string }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  const studentId = user.organization?.studentId
  if (!studentId) return { error: 'Profil étudiant introuvable' }

  try {
    const profile = await getStudentProfile(studentId, orgId)
    if (!profile?.classId) return { error: 'Aucune classe associée' }
    const data = await getStudentSessionDetail({
      studentId,
      scheduleId: params.scheduleId,
      orgId,
      classId: profile.classId,
      groupIds: profile.groupIds,
    })
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getStudentActiveSessionAction(params: { classId: string; groupIds: string[] }) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId, user } = auth.data

  const studentId = user.organization?.studentId
  if (!studentId) return { error: 'Profil étudiant introuvable' }

  try {
    return { data: await getStudentActiveSession({ studentId, orgId, ...params }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getEnrolledStudentsAction(classId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getEnrolledStudents(classId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getStudentByIdForDirectionAction(studentId: string) {
  const auth = await authAccess({ requiredRole: ['DIRECTION', 'ADMIN'] })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data
  try {
    const data = await getStudentByIdForDirection(studentId, orgId)
    if (!data) return { error: 'Étudiant introuvable' }
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getParentsForDirectionAction() {
  const auth = await authAccess({ requiredRole: ['DIRECTION', 'ADMIN'] })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data
  try {
    return { data: await getParentsForDirection(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
