import { connection } from 'next/server'
import { BookOpen, Star } from 'lucide-react'
import { getCurrentTeacherId, getTeacherCoursesAction } from '@/services/teacher'

export default async function Page() {
  await connection()

  const teacherId = await getCurrentTeacherId()
  if (!teacherId) return <div />

  const res = await getTeacherCoursesAction(teacherId)
  const courses = 'data' in res ? (res.data ?? []) : []

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Enseignant
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Mes cours</h1>
        <p className="text-sm text-muted-foreground">
          {courses.length === 0
            ? 'Aucun cours assigné.'
            : `${courses.length} cours assigné${courses.length > 1 ? 's' : ''}.`}
        </p>
      </div>

      {/* Liste des cours */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
          <BookOpen className="mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aucun cours pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col gap-2 rounded-2xl border border-dashed bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="size-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm font-semibold truncate">{course.name}</p>
                </div>
                {course.isMain && (
                  <span className="flex items-center gap-1 shrink-0 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium">
                    <Star className="size-2.5" />
                    Principal
                  </span>
                )}
              </div>
              {course.class && (
                <p className="text-xs text-muted-foreground ml-6">
                  Promotion : {course.class.name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
