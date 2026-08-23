import { connection } from 'next/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { getQueryClient } from '@/lib/react-query'
import { CACHE_KEYS } from '@/cache/client/key'
import { getOrgInvitationsAction } from '@/modules/invitation'
import { TeacherInvitationsClient } from '@/components/direction/people/TeacherInvitationsClient'

export default async function Page() {
  await connection()

  const queryClient = getQueryClient()

  // On pré-charge les 50 dernières invitations de l'organisation
  await queryClient.prefetchQuery({
    queryKey: CACHE_KEYS.INVITATIONS.ALL,
    queryFn: async () => {
      const r = await getOrgInvitationsAction({limit:50})
      if ('error' in r) throw new Error(r.error)
      return r.data
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeacherInvitationsClient />
    </HydrationBoundary>
  )
}
