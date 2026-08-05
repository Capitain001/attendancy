import { connection } from 'next/server'
import { getUEsAction } from '@/services/ue'
import { getDepartmentsAction } from '@/services/department'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { UEList } from '@/components/direction/academic/UEList'
import { UECreateButton } from '@/components/direction/academic/UEForm'
import { typography } from '@/styles'

export default async function CoursesPage() {
  await connection()

  const [uesResult, deptsResult] = await Promise.all([
    getUEsAction(),
    getDepartmentsAction(),
  ])

  if ('error' in uesResult) {
    return <p className={typography.body}>{uesResult.error}</p>
  }

  const ues = uesResult.data
  const departments = 'data' in deptsResult ? deptsResult.data : []

  const withDept = ues.filter((u) => u.department != null).length

  return (
    <div className="flex flex-col gap-y-4">
      <SectionHeader
        title="Unités d'enseignement"
        action={<UECreateButton departments={departments} />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard
          label="UE actives"
          value={String(ues.length)}
          sub="dans cet établissement"
        />
        <MetricCard
          label="Rattachées à un département"
          value={String(withDept)}
          sub={`sur ${ues.length} au total`}
        />
      </section>

      <UEList initialUEs={ues} />
    </div>
  )
}
