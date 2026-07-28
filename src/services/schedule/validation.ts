// src/services/schedule/validation.ts
import { object, optional, pipe, string, nonEmpty, uuid, picklist } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const createScheduleSchema = object({
  courseId:  pipe(string(), uuid('Cours invalide')),
  teacherId: (pipe(string(), uuid('Enseignant invalide'))),
  roomId:    pipe(string(), uuid('Salle invalide')),
  classId:   pipe(string(), uuid('Classe invalide')),
  groupId:   optional(pipe(string(), uuid('Groupe invalide'))),
  startTime: pipe(string(), nonEmpty('Heure de début requise')),
  endTime:   pipe(string(), nonEmpty('Heure de fin requise')),
  notes:     optional(string()),
})

export type CreateScheduleInput  = InferInput<typeof createScheduleSchema>
export type CreateScheduleOutput = InferOutput<typeof createScheduleSchema>

export const updateScheduleSchema = object({
  status:    optional(picklist(['PENDING', 'COMPLETED', 'CANCELED', 'MISSED'])),
  roomId:    optional(pipe(string(), uuid())),
  teacherId: optional(pipe(string(), uuid())),
  startTime: optional(pipe(string(), nonEmpty())),
  endTime:   optional(pipe(string(), nonEmpty())),
  notes:     optional(string()),
  confirmed: optional(pipe(string())), // 'true' from form checkbox
})

export type UpdateScheduleInput  = InferInput<typeof updateScheduleSchema>
export type UpdateScheduleOutput = InferOutput<typeof updateScheduleSchema>
