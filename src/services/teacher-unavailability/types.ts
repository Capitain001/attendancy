import type { getTeacherUnavailabilities } from './database'

export type GetTeacherUnavailabilitiesDto = Awaited<ReturnType<typeof getTeacherUnavailabilities>>
export type TeacherUnavailabilityItem     = GetTeacherUnavailabilitiesDto[number]
