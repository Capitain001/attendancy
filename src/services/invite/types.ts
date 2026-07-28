import type { SendInviteInput, AcceptInviteInput, InvitableRole } from './validation'
import type { getInviteByToken, getOrgInvites } from './database'

export type { SendInviteInput, AcceptInviteInput, InvitableRole }

export type InviteDetails = { role: InvitableRole }

export type GetInviteByTokenDto = Awaited<ReturnType<typeof getInviteByToken>>
export type GetOrgInvitesDto    = Awaited<ReturnType<typeof getOrgInvites>>
export type InvitationListItem  = GetOrgInvitesDto[number]

export type AcceptInviteResult = { data: { redirectPath: string } } | { error: string }

export type InvitationStats = {
  total: number
  pending: number
  expired: number
  accepted: number
}

export function resolveInvitationStatus(item: InvitationListItem): 'accepted' | 'expired' | 'pending' {
  if (item.usedAt) return 'accepted'
  if (item.expiresAt && item.expiresAt < new Date()) return 'expired'
  return 'pending'
}

export function calculateInvitationStats(items: InvitationListItem[]): InvitationStats {
  return items.reduce(
    (acc, item) => {
      acc.total++
      const status = resolveInvitationStatus(item)
      if (status === 'accepted') acc.accepted++
      else if (status === 'expired') acc.expired++
      else acc.pending++
      return acc
    },
    { total: 0, pending: 0, expired: 0, accepted: 0 }
  )
}
