export const WEEKLY_TEMPLATE_GRAPH = {
  WEEKLY_TEMPLATE_CREATED: (orgId: string) => [`weekly-template:${orgId}`],
  WEEKLY_TEMPLATE_UPDATED: (orgId: string) => [`weekly-template:${orgId}`],
  WEEKLY_TEMPLATE_DELETED: (orgId: string) => [`weekly-template:${orgId}`],
} as const
