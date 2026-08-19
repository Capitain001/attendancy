import { connection } from 'next/server'
import { getClassesAction } from '@/services/class'
import { getEnrolledStudentsAction } from '@/services/student'
import { getGroupsByClassAction } from '@/services/group'
import { inviteStudent } from '@/modules/invitation/student/actions'
import { StudentList } from '@/components/direction/people/StudentList'
import { ClassSelectorBar } from '@/components/direction/people/ClassSelectorBar'
import { InviteStudentDialog } from '@/components/invitation/InviteStudentDialog'
import { typography } from '@/styles'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ classId?: string }>
}

export default async function StudentsPage({ params, searchParams }: Props) {
  await connection()
  const [{ slug }, { classId }] = await Promise.all([params, searchParams])

  const classesResult = await getClassesAction({})
  const classes = ('data' in classesResult ? classesResult.data : null) ?? []

  const selectedClassId = classId ?? classes[0]?.id ?? null

  const studentsResult = selectedClassId
    ? await getEnrolledStudentsAction(selectedClassId)
    : null

  const groupsResult = selectedClassId
    ? await getGroupsByClassAction(selectedClassId)
    : null
  
  const groups = groupsResult && 'data' in groupsResult ? groupsResult.data ?? [] : []

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null

  async function handleInvite(input: {
    email: string
    firstName?: string
    lastName?: string
    groupIds?: string[]
    parentEmail?: string
  }) {
    'use server'
    if (!selectedClassId) return { success: false, error: "Aucune classe sélectionnée" }
    
    const res = await inviteStudent({
      ...input,
      classId: selectedClassId
    })
    
    return { success: res.success, error: res.error }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Étudiants</h1>
        <div className="flex items-center gap-4">
          {studentsResult && 'data' in studentsResult && studentsResult.data != null && (
            <span className={typography.small}>
              {studentsResult.data.length} étudiant{studentsResult.data.length !== 1 ? 's' : ''}
            </span>
          )}
          {selectedClassId && (
            <InviteStudentDialog 
              groups={groups.map((g) => ({ id: g.id, name: g.name }))} 
              onSubmit={handleInvite} 
            />
          )}
        </div>
      </div>

      <ClassSelectorBar classes={classes} selectedClassId={selectedClassId} />

      {!selectedClassId ? (
        <p className={typography.body}>Sélectionnez une classe pour voir les étudiants.</p>
      ) : studentsResult && 'error' in studentsResult ? (
        <p className={typography.body}>{studentsResult.error}</p>
      ) : studentsResult && 'data' in studentsResult ? (
        <StudentList enrollments={studentsResult.data ?? []} slug={slug} />
      ) : null}
    </div>
  )
}
