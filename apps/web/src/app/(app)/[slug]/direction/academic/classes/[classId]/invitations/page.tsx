import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { ClassInvitationsPage } from '@/components/invitation'
import { getClassGroupsAction } from '@/services/group'
import { getClassInvitationsAction } from '@/modules/invitation'
import { getQueryClient } from '@/lib/react-query'
import { CACHE_KEYS } from '@/cache/client/key'
import { validateUUID } from '@/utils/server/validation'

interface PageProps {
  params: Promise<{ classId: string; slug: string }>
}

export default async function Page({ params }: PageProps) {
  await connection()

  const { classId } = await params
  validateUUID(classId)

  const [groupsRes, invRes] = await Promise.all([
    getClassGroupsAction({ classId }),
    getClassInvitationsAction({ classId }),
  ])

  if ('error' in groupsRes || !groupsRes.data) notFound()

  const queryClient = getQueryClient()
  if ('data' in invRes) {
    queryClient.setQueryData(CACHE_KEYS.INVITATIONS.BY_CLASS(classId), invRes.data)
  }

  const groups = groupsRes.data.groups.map((g) => ({ id: g.id, name: g.name }))
  const className = groupsRes.data.class?.name ?? ''

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClassInvitationsPage classId={classId} className={className} groups={groups} />
    </HydrationBoundary>
  )
}
