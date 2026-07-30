import * as v from 'valibot'

export const createNotificationSchema = v.object({
  message: v.pipe(v.string(), v.minLength(1), v.maxLength(500)),
  type: v.optional(v.picklist([
    'ABSENCE',
    'COURSE_CHANGE',
    'NEW_COURSE',
    'SCHEDULE_UPDATE',
    'GENERAL',
    'MESSAGE',
    'INVITATION',
  ] as const)),
  scheduleId: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.unknown())),
})

export type CreateNotificationInput = v.InferInput<typeof createNotificationSchema>
export type CreateNotificationOutput = v.InferOutput<typeof createNotificationSchema>

export const subscribeSchema = v.object({
  endpoint: v.pipe(v.string(), v.url()),
  keys: v.object({
    p256dh: v.pipe(v.string(), v.minLength(1)),
    auth: v.pipe(v.string(), v.minLength(1)),
  }),
  expirationTime: v.optional(v.nullable(v.number())),
})

export type SubscribeInput = v.InferInput<typeof subscribeSchema>
