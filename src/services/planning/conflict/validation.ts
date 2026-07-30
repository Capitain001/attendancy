// src/services/planning/conflict/validation.ts
import * as v from 'valibot'

export const uidSchema = v.pipe(v.string(), v.uuid())

export const coercedDate = v.pipe(
  v.union([v.string(), v.date()]),
  v.transform((val) => (val instanceof Date ? val : new Date(val))),
)

export const checkConflictsParamsSchema = v.object({
  weekRecurrenceId:  v.optional(uidSchema),
  excludeScheduleId: v.optional(uidSchema),
  occurrences: v.array(
    v.object({
      startTime:        coercedDate,
      endTime:          coercedDate,
      courseId:         uidSchema,
      teacherId:        uidSchema,
      roomId:           uidSchema,
      classId:          uidSchema,
      groupId:          v.optional(uidSchema),
      weekRecurrenceId: v.optional(uidSchema),
    }),
  ),
})

export type CheckConflictsParams = v.InferOutput<typeof checkConflictsParamsSchema>
