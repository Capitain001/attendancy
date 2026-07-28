import { getOrgInvitesAction } from './actions'
import type { InvitationListItem } from './types'

export function orgInvitationsQuery({ limit = 50 }: { limit?: number } = {}) {
  return {
    queryKey: ['invitations', 'org', { limit }] as const,
    queryFn: async (): Promise<InvitationListItem[]> => {
      const result = await getOrgInvitesAction()
      if ('error' in result) throw new Error(result.error)
      return (result.data ?? []) as InvitationListItem[]
    },
  }
}
