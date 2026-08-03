import { BookOpen } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

type ClassRow = {
  id: string
  name: string
  level: string
  programTrack: { id: string; name: string }
  academicYear:  { id: string; name: string }
  _count: { studentEnrollments: number; courses: number }
}

const LEVEL_LABEL: Record<string, string> = {
  L1: 'Licence 1', L2: 'Licence 2', L3: 'Licence 3',
  M1: 'Master 1',  M2: 'Master 2',
  D1: 'Doctorat 1', D2: 'Doctorat 2', D3: 'Doctorat 3',
}

export function ClassList({ classes }: { classes: ClassRow[] }) {
  if (classes.length === 0) {
    return (
      <div className={cn(card.soft, 'py-12 text-center')}>
        <BookOpen className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>Aucune classe pour cette période.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30 bg-muted/40">
            <th className={cn(typography.label, 'px-4 py-2 text-left font-medium')}>Classe</th>
            <th className={cn(typography.label, 'px-4 py-2 text-left font-medium hidden md:table-cell')}>Filière</th>
            <th className={cn(typography.label, 'px-4 py-2 text-left font-medium hidden md:table-cell')}>Niveau</th>
            <th className={cn(typography.label, 'px-4 py-2 text-center font-medium')}>Étudiants</th>
            <th className={cn(typography.label, 'px-4 py-2 text-center font-medium hidden md:table-cell')}>Cours</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls) => (
            <tr key={cls.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-medium text-text-primary">{cls.name}</td>
              <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{cls.programTrack.name}</td>
              <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                {LEVEL_LABEL[cls.level] ?? cls.level}
              </td>
              <td className="px-4 py-3 text-center text-text-secondary">{cls._count.studentEnrollments}</td>
              <td className="px-4 py-3 text-center text-text-secondary hidden md:table-cell">{cls._count.courses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
