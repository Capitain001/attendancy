import { connection } from 'next/server'
import { getReferentialsAction } from '@/services/ue-template'
import { getProgramsAction } from '@/services/program'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { UETemplateList } from '@/components/direction/academic/UETemplateList'
import { typography } from '@/styles'

export default async function UETemplatesPage() {
  await connection()

  const [referentialsResult, programsResult] = await Promise.all([
    getReferentialsAction(),
    getProgramsAction({}),
  ])

  if ('error' in referentialsResult) {
    return <p className={typography.body}>{referentialsResult.error}</p>
  }

  const referentials = referentialsResult.data
  const programs     = 'data' in programsResult ? (programsResult.data ?? []) : []

  return (
    <div className="flex flex-col gap-y-4">
      <SectionHeader title="Référentiel national d'UE" />
      <p className={typography.small}>
        Importez des UE depuis les curricula harmonisés MESRS dans vos programmes.
      </p>

      <UETemplateList
        initialReferentials={referentials}
        programs={programs}
      />
    </div>
  )
}
