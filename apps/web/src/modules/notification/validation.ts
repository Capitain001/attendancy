import * as v from 'valibot'

// Schema générique Web Push spec — réutilisable sans couplage métier
export const subscribeSchema = v.object({
  endpoint: v.pipe(v.string(), v.url()),
  keys: v.object({
    p256dh: v.pipe(v.string(), v.minLength(1)),
    auth:   v.pipe(v.string(), v.minLength(1)),
  }),
  expirationTime: v.optional(v.nullable(v.number())),
})

export type SubscribeInput  = v.InferInput<typeof subscribeSchema>
export type SubscribeOutput = v.InferOutput<typeof subscribeSchema>
