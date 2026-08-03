import { connection } from 'next/server'
import { getClassesAction } from '@/services/class'
import { getEnrolledStudentsAction } from '@/services/student'
import { StudentList } from '@/components/direction/people/StudentList'
import { ClassSelectorBar } from '@/components/direction/people/ClassSelectorBar'
import { typography } from '@/styles'

interface Props {
  searchParams: Promise<{ classId?: string }>
}

export default async function StudentsPage({ searchParams }: Props) {
  await connection()
  const { classId } = await searchParams

  const classesResult = await getClassesAction()
  const classes = ('data' in classesResult ? classesResult.data : null) ?? []

  const selectedClassId = classId ?? classes[0]?.id ?? null

  const studentsResult = selectedClassId
    ? await getEnrolledStudentsAction(selectedClassId)
    : null

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Étudiants</h1>
        {studentsResult && 'data' in studentsResult && studentsResult.data != null && (
          <span className={typography.small}>
            {studentsResult.data.length} étudiant{studentsResult.data.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <ClassSelectorBar classes={classes} selectedClassId={selectedClassId} />

      {!selectedClassId ? (
        <p className={typography.body}>Sélectionnez une classe pour voir les étudiants.</p>
      ) : studentsResult && 'error' in studentsResult ? (
        <p className={typography.body}>{studentsResult.error}</p>
      ) : studentsResult && 'data' in studentsResult ? (
        <StudentList enrollments={studentsResult.data ?? []} />
      ) : null}
    </div>
  )
}
