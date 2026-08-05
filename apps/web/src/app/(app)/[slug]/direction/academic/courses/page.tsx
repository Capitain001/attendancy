import { connection } from 'next/server'
import { getAllCoursesAction } from '@/services/course'
import { typography } from '@/styles'
import { cn } from '@/lib/utils'
import { card } from '@/styles'
import { BookOpen } from 'lucide-react'

export default async function CoursesPage() {
  await connection()
  const result = await getAllCoursesAction()

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  const courses = result.data

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Cours</h1>
        <span className={typography.small}>{courses.length} cours</span>
      </div>

      {courses.length === 0 ? (
        <div className={cn(card.soft, 'py-12 text-center')}>
          <BookOpen className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucun cours créé.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/40">
                <th className={cn(typography.label, 'px-4 py-2 text-left font-medium')}>Cours</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-text-primary">{c.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
