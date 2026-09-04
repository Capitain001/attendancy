import { getClassProgramAction, getProgramsAction } from '@/services/program'
import { ProgramModalRoute } from '@/components/programs/modal/ProgramModalRoute'
import { LinkProgramModalRoute } from '@/components/programs/modal/LinkProgramModalRoute'

interface ProgramModalPageProps {
  params: Promise<{ slug: string; classId: string }> | { slug: string; classId: string }
  searchParams?: Promise<{ program_modal?: string }> | { program_modal?: string }
}

export default async function ProgramModalPage(props: ProgramModalPageProps) {
  const params = await props.params
  const searchParams = props.searchParams ? await props.searchParams : {}

  const classId = params?.classId
  const programModal = searchParams?.program_modal

  if (!classId || (programModal !== 'create' && programModal !== 'link')) {
    return null
  }

  const { data: classprogram, error } = await getClassProgramAction(classId)

  if (error || !classprogram) {
    return (
      <div className="p-6">
        Erreur : {error ?? 'Impossible de récupérer les informations de la promotion.'}
      </div>
    )
  }

  const programTrackId = classprogram.programTrack?.id

  if (programModal === 'create') {
    if (!programTrackId) {
      return (
        <div className="p-6">
          Erreur : impossible de créer un programme sans filière définie.
        </div>
      )
    }
    return <ProgramModalRoute classId={classId} programTrackId={programTrackId} />
  }

  if (programModal === 'link') {
    const { data: programs, error: programsError } = await getProgramsAction({
      programTrackId,
    })

    if (programsError || !programs) {
      return (
        <div className="p-6">
          Erreur : {programsError ?? 'Impossible de récupérer la liste des programmes.'}
        </div>
      )
    }

    return <LinkProgramModalRoute classId={classId} programs={programs} />
  }

  return null
}

