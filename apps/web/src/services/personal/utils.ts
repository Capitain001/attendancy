 
export type PersonalClassEligibility =
  | { canCreate: true }
  | { canCreate: false; reason: 'ALREADY_STARTED' | 'QUOTA' }
 
export function checkPersonalClassEligibility(params: {
  activeClassCount: number
  maxClasses: number | null // null = illimité
}) {
  const { activeClassCount, maxClasses } = params
 
  if (maxClasses !== null && maxClasses <= 0) return { canCreate: false, reason: 'QUOTA' }
  if (activeClassCount > 0) return { canCreate: false, reason: 'ALREADY_STARTED' }
  return { canCreate: true }
}
 