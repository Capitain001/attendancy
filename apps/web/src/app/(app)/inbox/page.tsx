import type { Metadata } from 'next'
import { Suspense } from 'react'
import { InboxLayout } from '@/components/inbox/InboxLayout'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Boîte de réception | Attendancy',
  description: 'Consultez vos notifications et vos invitations d’organisations.',
}

function InboxSkeleton() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full p-4 gap-4">
      <Skeleton className="w-56 h-full hidden md:block rounded-lg" />
      <Skeleton className="w-96 h-full rounded-lg" />
      <Skeleton className="flex-1 h-full hidden md:block rounded-lg" />
    </div>
  )
}

export default function InboxPage() {
  return (
    <Suspense fallback={<InboxSkeleton />}>
      <InboxLayout />
    </Suspense>
  )
}
