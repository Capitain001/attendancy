'use server'
import * as v from 'valibot'
import { authAccess } from '@/modules/auth'
import { ERRORS } from '@/config'
import { createAcademicYearSchema, setCurrentYearSchema } from '../validation'
import type { CreateAcademicYearInput, SetCurrentYearInput } from '../validation'
import { createAcademicYear, setCurrentYear, removeAcademicYear, updateAcademicYear } from '../database'
import type { UpdateAcademicYearData } from '../database'

export async function createAcademicYearAction(input: CreateAcademicYearInput) {
  const parsed = v.safeParse(createAcademicYearSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  if (parsed.output.startDate >= parsed.output.endDate) {
    return { error: 'La date de début doit être antérieure à la date de fin' }
  }

  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await createAcademicYear({ ...parsed.output, orgId }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function setCurrentYearAction(input: SetCurrentYearInput) {
  const parsed = v.safeParse(setCurrentYearSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await setCurrentYear(parsed.output.academicYearId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function updateAcademicYearAction(academicYearId: string, data: UpdateAcademicYearData) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await updateAcademicYear(academicYearId, orgId, data) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function removeAcademicYearAction(academicYearId: string) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' , requiredFunction: 'PRINCIPAL'})
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await removeAcademicYear(academicYearId, orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}