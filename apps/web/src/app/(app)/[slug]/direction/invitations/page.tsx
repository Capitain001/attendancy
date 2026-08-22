import { connection } from 'next/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { DirectionInvitationsPage } from '@/components/invitation'
import { getOrgInvitationsAction, getInvitationStatsAction } from '@/modules/invitation'
import { getFunctionsAction } from '@/services/function'
import { getQueryClient } from '@/lib/react-query'
import { CACHE_KEYS } from '@/cache/client/key'

export default async function Page() {
  await connection()

  const queryClient = getQueryClient()

  const [invRes, statsRes, fnRes] = await Promise.all([
    getOrgInvitationsAction({limit:50}),
    getInvitationStatsAction(),
    getFunctionsAction(),
  ])

  if ('data' in invRes) queryClient.setQueryData(CACHE_KEYS.INVITATIONS.ALL, invRes.data)
  if (statsRes.success) queryClient.setQueryData(CACHE_KEYS.INVITATIONS.STATS, statsRes.stats)

  const functions = fnRes.data ? fnRes.data.map((f) => ({ id: f.id, name: f.name })) : []

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DirectionInvitationsPage functions={functions} />
    </HydrationBoundary>
  )
}
