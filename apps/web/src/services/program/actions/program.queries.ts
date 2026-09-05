// src/services/program/actions/program.queries.ts
'use server'

import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getPrograms, getProgramById, getProgramList, getClassProgram } from '../database'
import { groupProgramsByTrack } from '../utils'

export async function getProgramsAction({
  classId,
  programTrackId,
}: {
  classId?: string
  programTrackId?: string
}) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const data = await getPrograms({ orgId, classId, programTrackId })
    return { data }
  } catch (error) {
    console.error('getProgramsAction:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function getProgramsByTrackAction({
  classId,
  programTrackId,
}: {
  classId?: string
  programTrackId?: string
}) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const programs = await getProgramList({ orgId, classId, programTrackId })
    // groupProgramsByTrack est une fonction utilitaire (à déplacer dans le service)
    return { data: groupProgramsByTrack(programs) }
  } catch (error) {
    console.error('getProgramsByTrackAction:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

// ⚠️ Comportement changé : authAccess exige un orgId, l'original ne le faisait pas.
// À confirmer avant merge.
export async function getClassProgramAction(classId: string) {
  try {
    const auth = await authAccess()
    if (!auth.data) return { error: auth.error }

    const data = await getClassProgram({ classId })
    return { data }
  } catch (error) {
    console.error('getClassProgramAction:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function getProgramByIdAction({ programId }: { programId: string }) {
  try {
    const auth = await authAccess({ requiredRole: 'DIRECTION' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const data = await getProgramById({ orgId, programId })
    return { data }
  } catch (error) {
    console.error('getProgramByIdAction:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}
