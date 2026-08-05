import * as v from 'valibot'

export const createWeeklyTemplateSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Nom requis'), v.maxLength(100)),
})

export const updateWeeklyTemplateSchema = v.object({
  name:     v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  isActive: v.optional(v.boolean()),
})

export const createWeeklySlotSchema = v.object({
  dayOfWeek: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(6)),
  startTime: v.pipe(v.string(), v.regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis')),
  endTime:   v.pipe(v.string(), v.regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis')),
  courseId:  v.pipe(v.string(), v.uuid()),
  teacherId: v.pipe(v.string(), v.uuid()),
  roomId:    v.pipe(v.string(), v.uuid()),
})

export const applyTemplateSchema = v.object({
  templateId:    v.pipe(v.string(), v.uuid()),
  classId:       v.pipe(v.string(), v.uuid()),
  startDate:     v.date(),
  endDate:       v.date(),
  interval:      v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
  excludedDates: v.optional(v.array(v.date()), []),
})

export type CreateWeeklyTemplateInput = v.InferInput<typeof createWeeklyTemplateSchema>
export type UpdateWeeklyTemplateInput = v.InferInput<typeof updateWeeklyTemplateSchema>
export type CreateWeeklySlotInput     = v.InferInput<typeof createWeeklySlotSchema>
export type ApplyTemplateInput        = v.InferInput<typeof applyTemplateSchema>
