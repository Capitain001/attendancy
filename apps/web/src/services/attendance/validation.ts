// src/services/attendance/validation.ts

import * as v from 'valibot'
import { DEFAULT_TEACHER_OVERVIEW_PERIOD, TEACHER_OVERVIEW_PERIODS } from './constants'

// ─── Vue d'ensemble enseignant ───────────────────────────────────────────────

export const getTeacherAttendanceOverviewSchema = v.object({
  period: v.optional(v.picklist(TEACHER_OVERVIEW_PERIODS, 'Période invalide'), DEFAULT_TEACHER_OVERVIEW_PERIOD),
})

export type GetTeacherAttendanceOverviewInput = v.InferInput<typeof getTeacherAttendanceOverviewSchema>
export type GetTeacherAttendanceOverviewOutput = v.InferOutput<typeof getTeacherAttendanceOverviewSchema>