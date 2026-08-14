// src/services/ue-course/validation.ts

import * as v from 'valibot'
import type { InferInput, InferOutput } from 'valibot'
import type { Prisma } from '@/generated/prisma/client'
import { CreateUECourseData, UpdateUECourseData } from './types'


// Aucun schéma imposé sur le contenu du JSON.
const jsonValue = v.custom<Prisma.InputJsonValue>(() => true)

// --- CREATE ---
export const createUECourseSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100)),
  code: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(20)))),
  description: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(500)))),
  credits: v.pipe(v.number(), v.minValue(1), v.maxValue(10)),
  duration: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(200)),
  ueId: v.pipe(v.string(), v.uuid('ID UE invalide')),
  order: v.optional(v.nullable(v.number())),
  settings: v.optional(jsonValue),
} satisfies Record<keyof CreateUECourseData, unknown>)

export type CreateUECourseInput = InferInput<typeof createUECourseSchema>
export type CreateUECourseOutput = InferOutput<typeof createUECourseSchema>

// --- UPDATE ---
export const updateUECourseSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100))),
  code: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(20)))),
  description: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(500)))),
  credits: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(10))),
  duration: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(200))),
  ueId: v.optional(v.pipe(v.string(), v.uuid('ID UE invalide'))),
  order: v.optional(v.nullable(v.number())),
  settings: v.optional(jsonValue),
}satisfies Record<keyof UpdateUECourseData, unknown>)

export type UpdateUECourseInput = InferInput<typeof updateUECourseSchema>
export type UpdateUECourseOutput = InferOutput<typeof updateUECourseSchema>