// src/services/schedule/validation.ts
import * as v from 'valibot'
import type { InferInput, InferOutput } from 'valibot'
import type { CreateScheduleData, UpdateScheduleData } from './types'

export type CreateScheduleDataValidation = Omit<CreateScheduleData, 'startTime' | 'endTime' | 'groupId'> & { groupId?: string; startTime: string; endTime: string }

export const createScheduleSchema = v.object({
  courseId: v.pipe(v.string(), v.uuid('Cours invalide')),
  teacherId: v.pipe(v.string(), v.uuid('Enseignant invalide')),
  roomId: v.pipe(v.string(), v.uuid('Salle invalide')),
  classId: v.pipe(v.string(), v.uuid('Classe invalide')),
  groupId: v.optional(v.pipe(v.string(), v.uuid('Groupe invalide'))),
  startTime: v.pipe(v.string(), v.nonEmpty('Heure de début requise')),
  endTime: v.pipe(v.string(), v.nonEmpty('Heure de fin requise')),
  notes: v.nullable(v.string()),
  confirmed: v.boolean(),
} satisfies Record<keyof CreateScheduleDataValidation, unknown>)

export type CreateScheduleInput = InferInput<typeof createScheduleSchema>
export type CreateScheduleOutput = InferOutput<typeof createScheduleSchema>

import { validateWithId } from '@/utils/server/validation'

// Même principe pour update : source de vérité = UpdateScheduleData (Partial<CreateScheduleData & {status}>)
// startTime/endTime/groupId réécrits en string côté form, tout le reste hérite du Partial (donc déjà optionnel)
export type UpdateScheduleDataValidation = Omit<UpdateScheduleData, 'startTime' | 'endTime' | 'groupId'> & { groupId?: string; startTime?: string; endTime?: string }

import { SCHEDULE_STATUSES } from './constants'

export const updateScheduleDataSchema = v.object({
  courseId: v.optional(v.pipe(v.string(), v.uuid('Cours invalide'))),
  teacherId: v.optional(v.pipe(v.string(), v.uuid('Enseignant invalide'))),
  roomId: v.optional(v.pipe(v.string(), v.uuid('Salle invalide'))),
  classId: v.optional(v.pipe(v.string(), v.uuid('Classe invalide'))),
  groupId: v.optional(v.pipe(v.string(), v.uuid('Groupe invalide'))),
  startTime: v.optional(v.pipe(v.string(), v.nonEmpty('Heure de début requise'))),
  endTime: v.optional(v.pipe(v.string(), v.nonEmpty('Heure de fin requise'))),
  notes: v.optional(v.nullable(v.string())),
  confirmed: v.optional(v.boolean()),
  status: v.optional(v.picklist(SCHEDULE_STATUSES)),
} satisfies Record<keyof UpdateScheduleDataValidation, unknown>)

export const updateScheduleSchema = validateWithId('scheduleId', updateScheduleDataSchema)

export type UpdateScheduleDataInput = InferInput<typeof updateScheduleDataSchema>
export type UpdateScheduleDataOutput = InferOutput<typeof updateScheduleDataSchema>

export type UpdateScheduleInput = InferInput<typeof updateScheduleSchema>
export type UpdateScheduleOutput = InferOutput<typeof updateScheduleSchema>
