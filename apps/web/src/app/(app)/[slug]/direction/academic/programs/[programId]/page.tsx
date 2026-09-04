import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { getProgramByIdAction } from '@/services/program'
import { getUEsAction } from '@/services/ue'
import { getOrgDetailsAction } from '@/services/organization'
import { DirectionProgramPage } from '@/components/programs/program/DirectionProgramPage'
import { typography } from '@/styles'
import { validateUUID } from '@/utils/server/validation'

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string; programId: string }>
}) {
  await connection()
  const { slug, programId } = await params
  
  validateUUID(programId)

  const [
    programResult,
    uesResult,
    orgResult,
  ] = await Promise.all([
    getProgramByIdAction({ programId }),
    getUEsAction(),
    getOrgDetailsAction(),
  ])

  if ('error' in programResult) {
    return <p className={typography.body}>{programResult.error}</p>
  }

  const program = programResult.data
  if (!program) {
    notFound()
  }

  const allUes = ('data' in uesResult && uesResult.data) ? uesResult.data : []
  const org = ('data' in orgResult && orgResult.data) ? orgResult.data : undefined

  const classInfo = {
    name: program.classes.length === 1 ? `Program - ${program.classes[0].name}` : '—',
    level: program.classes[0]?.level ?? '—',
    programTrack: program.programTrack?.name ?? 'Filière non définie',
    program: program.name,
    academicYear: program.classes[0]?.academicYear?.name ?? '—',
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div>
        <Link
          href={`/${slug}/direction/academic/programs`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux programmes
        </Link>
      </div>

      <DirectionProgramPage
        programId={programId}
        allUes={allUes}
        organization={org}
        classInfo={classInfo}
        programDetails={{
          isActive: program.isActive,
          isLocked: program.isLocked,
          programTrackId: program.programTrack.id,
        }}
        programClasses={program.classes}
      />
    </div>
  )
}
