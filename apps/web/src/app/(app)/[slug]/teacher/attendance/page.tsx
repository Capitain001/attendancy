// ⚠ Chemin à adapter à ton arborescence de routes (route group, préfixe rôle…).
import { TeacherAttendanceOverview } from '@/components/teacher/attendance/TeacherAttendanceOverview'
import { Card, CardContent } from '@/components/ui/card'
import { getTeacherAttendanceOverviewAction } from '@/services/attendance'

export default async function TeacherAttendancePage() {
  const result = await getTeacherAttendanceOverviewAction()

  return (
    <div className="space-y-4">
      <header>
        <h1 className=" text-center mx-auto w-fit px-2 bg-muted  tracking-tight">Présences</h1>
      </header>
      {result.data ? <TeacherAttendanceOverview overview={result.data} /> : <TeacherAttendanceLoadError message={result.error} />}
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