import { Card, CardContent } from '@/components/ui/card'
import { getTeacherAttendanceFicheAction } from '@/services/attendance'
import TeacherAttendanceFiche from '@/components/teacher/attendance/teacher-attendance/teacher-attendance-fiche'

export default async function TeacherAttendancePage() {
  const result = await getTeacherAttendanceFicheAction()

  if ('error' in result) {
    return <TeacherAttendanceLoadError message={result.error} />
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className=" text-center mx-auto w-fit px-2 bg-muted  tracking-tight">Présences</h1>
      </header>
      <TeacherAttendanceFiche
        period={result.data.period}
        home={result.data.home}
        sessions={result.data.sessions}
        classes={result.data.classes}
        classDetail={result.data.classDetail}
        ownAttendance={result.data.ownAttendance}
        justifications={result.data.justifications}
      />
    </div>
  )
}

function TeacherAttendanceLoadError({ message }: { message?: string }) {
  return (
    <Card className="rounded-3xl">
      <CardContent className="py-12 text-center text-sm text-destructive">
        {message ?? 'Impossible de charger les présences.'}
      </CardContent>
    </Card>
  )
}
