import { connection } from 'next/server'
import { GraduationCap } from 'lucide-react'
import { getCurrentTeacherId, getTeacherCoursesAction } from '@/services/teacher'
import { getEnrolledStudentsAction } from '@/services/student'
import { getInitials } from '@/lib/utils'


export default async function Page() {
  await connection()

  const teacherId = await getCurrentTeacherId()
  if (!teacherId) return <div />

  // 1 — cours du prof → classIds uniques
  const coursesRes = await getTeacherCoursesAction(teacherId)
  const courses = 'data' in coursesRes ? (coursesRes.data ?? []) : []

  const classMap = new Map<string, string>() // classId → className
  for (const c of courses) {
    if (c.class) classMap.set(c.class.id, c.class.name)
  }

  if (classMap.size === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Enseignant
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Mes étudiants</h1>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center">
          <GraduationCap className="mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Aucune classe assignée.</p>
        </div>
      </div>
    )
  }

  // 2 — étudiants de chaque classe en parallèle
  const classIds = Array.from(classMap.keys())
  const results = await Promise.all(
    classIds.map((classId) => getEnrolledStudentsAction(classId))
  )

  const groups = classIds.map((classId, i) => ({
    classId,
    className: classMap.get(classId) ?? classId,
    students: 'data' in results[i] ? (results[i].data ?? []) : [],
  }))

  const totalStudents = groups.reduce(
    (acc, g) => acc + new Set(g.students.map((s) => s.studentId)).size,
    0,
  )

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Enseignant
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Mes étudiants</h1>
        <p className="text-sm text-muted-foreground">
          {totalStudents === 0
            ? 'Aucun étudiant inscrit.'
            : `${totalStudents} étudiant${totalStudents > 1 ? 's' : ''} dans ${groups.length} classe${groups.length > 1 ? 's' : ''}.`}
        </p>
      </div>

      {/* Groupes par classe */}
      <div className="flex flex-col gap-6">
        {groups.map(({ classId, className, students }) => (
          <div key={classId} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {className}
              </p>
              <span className="text-[10px] font-mono text-muted-foreground/60">
                {students.length} étudiant{students.length > 1 ? 's' : ''}
              </span>
            </div>

            {students.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Aucun étudiant inscrit.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {students.map((enrollment) => {
                  const user = enrollment.student.user
                  return (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-3 rounded-xl border border-dashed bg-card px-3 py-2.5"
                    >
                      {/* Avatar initiales */}
                      <div className="size-8 shrink-0 rounded-full bg-foreground/10 flex items-center justify-center border border-dashed border-foreground/20">
                        <span className="text-[10px] font-medium">
                          {getInitials(user.firstName, user.lastName)}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
                        </p>
                        {user.email && (
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        )}
                      </div>

                      {/* Groupes */}
                      {enrollment.studentGroups.length > 0 && (
                        <div className="ml-auto flex gap-1 shrink-0">
                          {enrollment.studentGroups.map((sg) => (
                            <span
                              key={sg.id}
                              className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] font-mono"
                            >
                              {sg.group.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
