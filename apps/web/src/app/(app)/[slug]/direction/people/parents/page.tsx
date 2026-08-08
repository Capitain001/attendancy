import { Suspense } from 'react'
import { connection } from 'next/server'
import { getParentsForDirectionAction } from '@/services/student'
import { ParentList } from '@/components/direction/people/ParentList'
import { Loader } from '@/components/loaders/AppLoaders'

interface Props {
  params: Promise<{ slug: string }>
}

async function ParentsContent({ slug }: { slug: string }) {
  const result  = await getParentsForDirectionAction()
  const parents = 'error' in result ? [] : result.data

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Responsables légaux</h1>
        <span className="text-xs text-text-subtle">{parents.length} responsable{parents.length !== 1 ? 's' : ''}</span>
      </div>
      <ParentList parents={parents} slug={slug} />
    </div>
  )
}

export default async function ParentsPage({ params }: Props) {
  await connection()
  const { slug } = await params

  return (
    <Suspense fallback={<Loader />}>
      <ParentsContent slug={slug} />
    </Suspense>
  )
}
