import type { UserStatus } from '@/generated/prisma/browser'

// Sous-ensemble de UserStatus concerné par le toggle ACTIVE <-> SUSPENDED
// (suspendOrgUser / activateOrgUser). `Pick` ne s'applique qu'aux types
// objet ; UserStatus est un type union de littéraux généré par Prisma —
// `Extract` est l'utilitaire TS pour en prélever un sous-ensemble tout en
// restant dérivé de la source Prisma (zéro duplication manuelle des valeurs).
export type ToggleableStatus = Extract<UserStatus, 'ACTIVE' | 'SUSPENDED'>

export const TOGGLEABLE_STATUSES: readonly ToggleableStatus[] = ['ACTIVE', 'SUSPENDED']

export function isToggleableStatus(status: UserStatus): status is ToggleableStatus {
  return (TOGGLEABLE_STATUSES as readonly UserStatus[]).includes(status)
}