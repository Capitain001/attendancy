import type { getWeeklyTemplates, getWeeklyTemplate } from './database'

export type GetWeeklyTemplatesDto = Awaited<ReturnType<typeof getWeeklyTemplates>>
export type GetWeeklyTemplateDto  = Awaited<ReturnType<typeof getWeeklyTemplate>>

export type WeeklyTemplateListItem = GetWeeklyTemplatesDto[number]
export type WeeklyTemplateDetail   = NonNullable<GetWeeklyTemplateDto>
export type WeeklySlotDetail       = WeeklyTemplateDetail['slots'][number]
