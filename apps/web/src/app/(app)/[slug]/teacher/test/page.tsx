import TeacherSessionPage from '@/components/session/TeacherSessionPage'
import { getCurrentTeacherId } from '@/services/teacher'


export default async function Page() {
  const teacherId = await getCurrentTeacherId()

  if (!teacherId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Profil enseignant introuvable</p>
      </div>
    )
  }
  return (
    <div>
      <TeacherSessionPage teacherId={teacherId} />
    </div>
  )
}
