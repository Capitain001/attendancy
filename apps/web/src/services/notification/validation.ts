import * as v from 'valibot'

// Types de notification métier — spécifiques au projet attendancy
export const notificationTypeSchema = v.picklist([
  'ABSENCE',
  'COURSE_CHANGE',
  'NEW_COURSE',
  'SCHEDULE_UPDATE',
  'GENERAL',
  'MESSAGE',
  'INVITATION',
] as const)

export const createNotificationSchema = v.object({
  message:    v.pipe(v.string(), v.minLength(1), v.maxLength(500)),
  type:       v.optional(notificationTypeSchema),
  scheduleId: v.optional(v.string()),
  metadata:   v.optional(v.record(v.string(), v.unknown())),
})

export type CreateNotificationInput  = v.InferInput<typeof createNotificationSchema>
export type CreateNotificationOutput = v.InferOutput<typeof createNotificationSchema>
