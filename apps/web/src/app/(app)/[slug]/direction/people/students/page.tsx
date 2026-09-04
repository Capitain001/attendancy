import { connection } from 'next/server'
import { getClassesAction } from '@/services/class'
import { getEnrolledStudentsAction } from '@/services/student'
import { getGroupsByClassAction } from '@/services/group'
import { inviteStudent } from '@/modules/invitation/student/actions'
import { DirectionStudentsSection } from '@/components/direction/people/DirectionStudentsSection'

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

  async function handleInvite(input: {
    email: string
    firstName?: string
    lastName?: string
    groupIds?: string[]
    parentEmail?: string
  }) {
    'use server'
    if (!selectedClassId) return { success: false, error: 'Aucune classe sélectionnée' }

    const res = await inviteStudent({
      ...input,
      classId: selectedClassId,
    })

    return { success: res.success, error: res.error }
  }

  const students = (studentsResult && 'data' in studentsResult ? studentsResult.data : null) ?? null
  const studentsError = studentsResult && 'error' in studentsResult ? studentsResult.error : null

  return (
    <DirectionStudentsSection
      classes={classes}
      selectedClassId={selectedClassId}
      students={students}
      studentsError={studentsError}
      groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      slug={slug}
      onInvite={handleInvite}
    />
  )
}

