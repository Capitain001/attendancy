export const ABSENTEEISM_THRESHOLD = 0.7

export function isAbsenteeism(rate: number): boolean {
  return rate < ABSENTEEISM_THRESHOLD * 100
}

export function getAbsenteeismLevel(rate: number): 'none' | 'warning' | 'critical' {
  if (rate >= 80) return 'none'
  if (rate >= 65) return 'warning'
  return 'critical'
}
