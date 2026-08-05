export const TEACHER_UNAVAILABILITY_GRAPH = {
  TEACHER_UNAVAILABILITY_CREATED: (orgId: string) => [`teacher-unavailability:${orgId}`],
  TEACHER_UNAVAILABILITY_DELETED: (orgId: string) => [`teacher-unavailability:${orgId}`],
} as const
