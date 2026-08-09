import { connection } from 'next/server'
import { getUEsAction } from '@/services/ue'
import { getDepartmentsAction } from '@/services/department'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { UEList } from '@/components/direction/academic/UEList'
import { UECreateButton } from '@/components/direction/academic/UEForm'
import { typography } from '@/styles'
import { UECard } from '@/components/direction/academic/ue/UeCard'
import { div } from 'motion/react-client'

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

      {/* affiche le template de l org pour les UEs */}
      <div className="p-0.5 w-full bg-muted rounded " >
        <span className=" w-1/2 mx-auto bg-primary rounded block text-center text-sm font-medium text-primary-foreground" >
          MESRS-Togo · 2022-04
        </span>
      </div>
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

      <span className="text-sm text-muted-foreground">
        Les unités d'enseignement sont des éléments de formation qui composent les programmes d'études. Elles peuvent être rattachées à un département ou non.
      </span>

      {/* composant de liste des UEs */}

      {/* manque: bar de recherche + filtres*/}
      {ues.length === 0 ? (
        <div className="py-8 text-center">
          <p className={typography.body}>Aucune UE créée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 justify-items-center gap-x-3 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {ues.map((ue) => (
            <UECard key={ue.id} ue={ue} />
          ))}
        </div>

      )}


      <span className="text-sm text-muted-foreground">
        {/* {JSON.stringify(ues, null, 2)} */}
        {/* {JSON.stringify(ues.map((u) => ({ id: u.id, name: u.name, department: u.department?.name ?? null })), null, 2)} */}
      </span>

      {/* <UEList initialUEs={ues} /> */}
    </div>
  )
}
