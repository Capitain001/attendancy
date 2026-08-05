import { getOrgPlanningResources, getPlanningResources } from './database'

export type OrgPlanningResources = Awaited<ReturnType<typeof getOrgPlanningResources>>
export type PlanningResources = Awaited<ReturnType<typeof getPlanningResources>>
