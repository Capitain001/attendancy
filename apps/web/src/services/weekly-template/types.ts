import type { getWeeklyTemplates, getWeeklyTemplate } from './database'
import { GetWeeklyTemplateDto, GetWeeklyTemplatesDto } from './generated.types'


export type WeeklyTemplateListItem = GetWeeklyTemplatesDto[number]
export type WeeklyTemplateDetail   = NonNullable<GetWeeklyTemplateDto>
export type WeeklySlotDetail       = WeeklyTemplateDetail['slots'][number]
export * from './generated.types'
