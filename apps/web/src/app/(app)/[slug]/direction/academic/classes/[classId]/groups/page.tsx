import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

import { DirectionClassGroupsPage } from '@/components/classes/direction'
import { getClassGroupsAction } from '@/services/group'
import { getQueryClient } from '@/lib/react-query'
import { CACHE_KEYS } from '@/config/client_cache'
import { validateUUID } from '@/utils/server/validation'

interface PageProps {
  params: Promise<{ classId: string; slug: string }>
}

export default async function Page({ params }: PageProps) {
  await connection()

  const { classId, slug } = await params

  validateUUID(classId)

  const res = await getClassGroupsAction({ classId })

  if ('error' in res || !res.data) notFound()

  const queryClient = getQueryClient()
  queryClient.setQueryData(CACHE_KEYS.GROUPS.BY_CLASS(classId), res)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DirectionClassGroupsPage
        slug={slug}
        classId={classId}
        className={res.data.class?.name ?? ''}
      />
    </HydrationBoundary>
  )
}
