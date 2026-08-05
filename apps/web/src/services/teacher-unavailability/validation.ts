import * as v from 'valibot'

const timeString = v.pipe(v.string(), v.regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'))
const uuidField  = v.pipe(v.string(), v.uuid('UUID requis'))

export const createWeeklyUnavailabilitySchema = v.object({
  teacherId: uuidField,
  dayOfWeek: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(7)),
  startTime: timeString,
  endTime:   timeString,
  reason:    v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200))),
})

export const createDateRangeUnavailabilitySchema = v.object({
  teacherId: uuidField,
  startDate: v.date(),
  endDate:   v.date(),
  reason:    v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200))),
})

export type CreateWeeklyUnavailabilityInput    = v.InferInput<typeof createWeeklyUnavailabilitySchema>
export type CreateDateRangeUnavailabilityInput = v.InferInput<typeof createDateRangeUnavailabilitySchema>
