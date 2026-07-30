import { getOrgPlanningResources } from './database'

export type OrgPlanningResources = Awaited<ReturnType<typeof getOrgPlanningResources>>
