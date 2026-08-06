// src/services/group/validation.ts
import { array, nullable, object, optional, pipe, string, trim, minLength, maxLength, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'

export const createGroupSchema = object({
  name:        pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
  description: optional(pipe(string(), trim(), maxLength(500))),
  classId:     pipe(string(), uuid('ID classe invalide')),
})

export type CreateGroupInput  = InferInput<typeof createGroupSchema>
export type CreateGroupOutput = InferOutput<typeof createGroupSchema>

export const updateGroupSchema = object({
  groupId:     pipe(string(), uuid('ID groupe invalide')),
  classId:     pipe(string(), uuid('ID classe invalide')),
  name:        optional(pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100))),
  description: optional(nullable(pipe(string(), trim(), maxLength(500)))),
})

export type UpdateGroupInput  = InferInput<typeof updateGroupSchema>
export type UpdateGroupOutput = InferOutput<typeof updateGroupSchema>

export const setGroupStudentsSchema = object({
  groupId:       pipe(string(), uuid('ID groupe invalide')),
  classId:       pipe(string(), uuid('ID classe invalide')),
  enrollmentIds: array(pipe(string(), uuid('ID inscription invalide'))),
})

export type SetGroupStudentsInput  = InferInput<typeof setGroupStudentsSchema>
export type SetGroupStudentsOutput = InferOutput<typeof setGroupStudentsSchema>
