// services/channel-member/validation.ts
import * as v from 'valibot'
import { validateWithId } from '@/utils/server/validation'

export const getChannelMuteByUserSchema = v.object({
  channelId: v.pipe(v.string(), v.uuid('ID de canal invalide')),
})

export type GetChannelMuteByUserInput = v.InferInput<typeof getChannelMuteByUserSchema>
export type GetChannelMuteByUserOutput = v.InferOutput<typeof getChannelMuteByUserSchema>

// Payload seul. `muted` est une valeur explicite plutôt qu'une bascule : un retry reste idempotent.
// Pas de `satisfies` Prisma : `muted` n'est pas une colonne, la colonne est `mutedAt`.
export const updateChannelMuteDataSchema = v.object({ muted: v.boolean() })

export type UpdateChannelMuteDataInput = v.InferInput<typeof updateChannelMuteDataSchema>
export type UpdateChannelMuteDataOutput = v.InferOutput<typeof updateChannelMuteDataSchema>

export const updateChannelMuteSchema = validateWithId('channelId', updateChannelMuteDataSchema)

export type UpdateChannelMuteInput = v.InferInput<typeof updateChannelMuteSchema> // { channelId, data }
export type UpdateChannelMuteOutput = v.InferOutput<typeof updateChannelMuteSchema>
