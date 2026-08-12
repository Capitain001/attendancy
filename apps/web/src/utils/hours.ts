export interface HoursDetails {
  CM?: number
  TD?: number
  TP?: number
  PROJET?: number
  STAGE?: number
  AUTRE?: number
}

export function getHoursFromSettings(settings: any): {
  details: HoursDetails
  total: number
  display: string
} {
  const hours: HoursDetails = settings?.hours || {}
  const total = Object.values(hours).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)
  
  const parts: string[] = []
  if (hours.CM) parts.push(`CM: ${hours.CM}h`)
  if (hours.TD) parts.push(`TD: ${hours.TD}h`)
  if (hours.TP) parts.push(`TP: ${hours.TP}h`)
  if (hours.PROJET) parts.push(`Projet: ${hours.PROJET}h`)
  if (hours.STAGE) parts.push(`Stage: ${hours.STAGE}h`)
  if (hours.AUTRE) parts.push(`Autre: ${hours.AUTRE}h`)
  
  return {
    details: hours,
    total,
    display: parts.join(' | ') || 'Non défini'
  }
}
