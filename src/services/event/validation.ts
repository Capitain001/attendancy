import * as v from 'valibot'

const EventTypeEnum = v.picklist(['MEETING', 'EXAM', 'COURSE', 'GENERAL', 'ADMINISTRATIVE'])
const RoleEnum = v.picklist(['ADMIN', 'DIRECTION', 'TEACHER', 'STUDENT', 'PARENT'])

export const createEventSchema = v.object({
  title:       v.pipe(v.string(), v.trim(), v.minLength(1, 'Titre requis'), v.maxLength(200)),
  description: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(1000))),
  startTime:   v.optional(v.date()),
  endTime:     v.optional(v.date()),
  location:    v.optional(v.pipe(v.string(), v.trim(), v.maxLength(200))),
  type:        v.optional(EventTypeEnum, 'GENERAL'),
  targetRoles: v.optional(v.array(RoleEnum), []),
  color:       v.optional(v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hex requise'))),
  isPublic:    v.optional(v.boolean(), false),
})

export const updateEventSchema = v.partial(createEventSchema)

export type CreateEventInput  = v.InferInput<typeof createEventSchema>
export type UpdateEventInput  = v.InferInput<typeof updateEventSchema>
