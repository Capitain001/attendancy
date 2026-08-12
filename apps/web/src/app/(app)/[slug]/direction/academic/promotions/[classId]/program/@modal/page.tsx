import { getClassProgramAction } from '@/services/program'
import { ProgramModalRoute } from '@/components/programs/modal/ProgramModalRoute'

interface ProgramModalPageProps {
  params: Promise<{ slug: string; classId: string }> | { slug: string; classId: string }
  searchParams?: Promise<{ program_modal?: string }> | { program_modal?: string }
}

export default async function ProgramModalPage(props: ProgramModalPageProps) {
  const params = await props.params
  const searchParams = props.searchParams ? await props.searchParams : {}

  const classId = params?.classId
  const programModal = searchParams?.program_modal

  if (!classId || programModal !== 'create') {
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

  if (!programTrackId) {
    return (
      <div className="p-6">
        Erreur : impossible de créer un programme sans filière définie.
      </div>
    )
  }

  return <ProgramModalRoute classId={classId} programTrackId={programTrackId} />
}
