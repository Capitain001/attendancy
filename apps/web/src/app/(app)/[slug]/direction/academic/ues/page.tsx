import { connection } from 'next/server'
import { getUEsAction } from '@/services/ue'
import { getDepartmentsAction } from '@/services/department'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { UECreateButton } from '@/components/direction/academic/UEForm'
import { typography } from '@/styles'
import { UEList } from '@/components/direction/academic/ue/UEList'

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
        action={<UECreateButton departments={departments ?? []} />}
      />
      <div className="p-0.5 w-full bg-muted rounded">
        <span className="w-1/2 mx-auto bg-primary rounded block text-center text-sm font-medium text-primary-foreground">
          LISTE DES UNITÉS D'ENSEIGNEMENT
          {/* a remplacer par autre info */}
        </span>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard
          label="UE actives"
          value={String(ues.length)}
          sub={`dont ${ues.filter((u) => u.isOptional).length} optionnelle${ues.filter((u) => u.isOptional).length !== 1 ? "s" : ""}`}
        />
        <MetricCard
          label="Rattachées à un département"
          value={String(withDept)}
          sub={`sur ${ues.length} au total`}
        />
        <MetricCard
          label="Éléments constitutifs"
          value={String(ues.reduce((s, u) => s + u.ueCourses.length, 0))}
          sub={`répartis dans ${ues.length} UE`}
        />
      </section>

      <span className="text-sm text-muted-foreground">
        Les unités d'enseignement sont des éléments de formation qui composent les programmes d'études. Elles peuvent être rattachées à un département ou non.
      </span>

      <UEList ues={ues} />
    </div>
  )
}

