import type { getEvents, getEvent } from './database'

export type GetEventsDto   = Awaited<ReturnType<typeof getEvents>>
export type GetEventDto    = Awaited<ReturnType<typeof getEvent>>
export type EventListItem  = GetEventsDto[number]
export type EventDetail    = NonNullable<GetEventDto>
