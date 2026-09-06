import { BookOpen } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { GetTeacherCoursesDto } from '@/services/teacher'

export function TeacherCoursesSection({ courses }: { courses: GetTeacherCoursesDto }) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <BookOpen className="size-4 text-text-subtle" strokeWidth={1.5} />
        <h2 className={cn(typography.label, 'font-semibold')}>Cours affectés</h2>
      </div>
      {courses.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {courses.map((c) => (
            <div key={c.id} className={cn(card.soft, 'flex items-center justify-between gap-2 py-2.5')}>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                <p className={typography.small}>{c.class.name}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(card.soft, 'flex flex-col items-center justify-center p-6 text-center text-muted-foreground')}>
          <BookOpen className="size-8 mb-2 opacity-20" />
          <p className="text-sm font-medium text-text-primary">Aucun cours affecté</p>
          <p className="text-xs">Cet enseignant n&apos;a pas encore de cours assignés.</p>
        </div>
      )}
    </section>
  )
}
