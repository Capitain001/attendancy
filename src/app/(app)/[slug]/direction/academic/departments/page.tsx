import { connection } from 'next/server'
import { getDepartmentsAction } from '@/services/department'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { DepartmentList } from '@/components/direction/academic/DepartmentList'
import { DepartmentCreateButton } from '@/components/direction/academic/DepartmentForm'

export default async function DepartmentsPage() {
  await connection()
  const result = await getDepartmentsAction()
  const departments = 'data' in result ? result.data : []

  const totalProgramTracks = departments.reduce((s, d) => s + d._count.programTracks, 0)
  const totalUes           = departments.reduce((s, d) => s + d._count.ues, 0)

  return (
    <div className="flex flex-col gap-y-4">
      <SectionHeader
        title="Départements"
        action={<DepartmentCreateButton />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard
          label="Départements"
          value={String(departments.length)}
          sub="dans cet établissement"
        />
        <MetricCard
          label="Filières"
          value={String(totalProgramTracks)}
          sub="réparties dans les départements"
        />
        <MetricCard
          label="UEs"
          value={String(totalUes)}
          sub="unités d'enseignement"
        />
      </section>

      <DepartmentList initialDepartments={departments} />
    </div>
  )
}
