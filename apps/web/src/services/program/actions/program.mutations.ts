// src/services/program/actions/program.mutations.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'

import { ERRORS } from '@/config'
import { createProgram, updateProgram, removeProgram, toggleProgramLock, toggleProgramActive } from '../database'
import { CreateProgramSchema, UpdateProgramSchema, type CreateProgramInput, type UpdateProgramInput } from '../validation'
import { logAuditAsync } from '@/services/audit'

export async function createProgramAction(input: CreateProgramInput) {
  try {
    const auth = await authAccess({ requiredRole: 'DIRECTION' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const parsed = v.safeParse(CreateProgramSchema, input)
    if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

    const program = await createProgram({
      data: {
        ...parsed.output,
        description: parsed.output.description ?? null,
      },
      orgId,
    })
    return { data: program }
  } catch (error) {
    console.error('createProgramAction:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function updateProgramAction(programId: string, input: UpdateProgramInput) {
  try {
    const auth = await authAccess({ requiredRole: 'DIRECTION', requiredFunction: 'PRINCIPAL' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const parsed = v.safeParse(UpdateProgramSchema, input)
    if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

    const program = await updateProgram({ programId, orgId }, parsed.output)
    return { data: program }
  } catch (error) {
    console.error('updateProgramAction:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function linkProgramToClassAction({
  classId,
  programId,
}: {
  classId: string
  programId: string
}) {
  try {
    const auth = await authAccess({ requiredRole: 'DIRECTION', requiredFunction: 'PRINCIPAL' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const program = await updateProgram({ programId, orgId }, { classId })
    return { data: program }
  } catch (error) {
    console.error('linkProgramToClassAction:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function removeProgramAction(programId: string) {
  try {
    const auth = await authAccess({ requiredRole: 'ADMIN' })
    if (!auth.data) return { error: auth.error }
    const { user, orgId } = auth.data

    const result = await removeProgram({ programId, orgId })
    // Audit : suppression critique
    logAuditAsync({
      userId: user.id,
      orgId,
      action: 'DELETE',
      resource: 'PROGRAM',
      resourceId: programId,
      actor: { name: user.name, email: user.email },
    })
    return { data: result }
  } catch (error) {
    console.error('removeProgramAction:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function toggleProgramLockAction({
  programId,
  isLocked,
}: {
  programId: string
  isLocked: boolean
}) {
  try {
    const auth = await authAccess({ requiredRole: 'DIRECTION', requiredFunction: 'PRINCIPAL' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const result = await toggleProgramLock({ programId, orgId, isLocked })
    return { data: result }
  } catch (error) {
    console.error('toggleProgramLockAction:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function toggleProgramActiveAction({
  programId,
  isActive,
}: {
  programId: string
  isActive: boolean
}) {
  try {
    const auth = await authAccess({ requiredRole:'DIRECTION', requiredFunction: 'PRINCIPAL' })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data

    const result = await toggleProgramActive({ programId, orgId, isActive })
    return { data: result }
  } catch (error) {
    console.error('toggleProgramActiveAction:', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}
