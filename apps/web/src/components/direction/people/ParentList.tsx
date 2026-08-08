import Link from 'next/link'
import { UsersRound } from 'lucide-react'
import UserIcon from '@/components/users/UserIcon'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { getParentsForDirectionAction } from '@/services/student'

type ParentRow = Extract<Awaited<ReturnType<typeof getParentsForDirectionAction>>, { data: unknown }>['data'][number]

function displayParentName(row: ParentRow) {
  const { firstName, lastName } = row.parent.user
  return [firstName, lastName].filter(Boolean).join(' ') || row.parent.user.email
}

export function ParentList({ parents, slug }: { parents: ParentRow[]; slug?: string }) {
  if (parents.length === 0) {
    return (
      <div className={cn(card.soft, 'py-12 text-center')}>
        <UsersRound className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>Aucun responsable légal enregistré.</p>
        <p className={typography.small}>Les responsables apparaissent ici après avoir été invités.</p>
      </div>
    )
  }

  // Grouper par parent pour éviter les doublons de ligne
  const byParent = new Map<string, { row: ParentRow; students: ParentRow['student'][] }>()
  for (const row of parents) {
    const existing = byParent.get(row.parent.id)
    if (existing) {
      existing.students.push(row.student)
    } else {
      byParent.set(row.parent.id, { row, students: [row.student] })
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30 bg-muted/40">
            <th className={cn(typography.label, 'px-4 py-2.5 text-left font-medium')}>Responsable</th>
            <th className={cn(typography.label, 'px-4 py-2.5 text-left font-medium')}>Relation</th>
            <th className={cn(typography.label, 'px-4 py-2.5 text-left font-medium')}>Étudiant(s)</th>
          </tr>
        </thead>
        <tbody>
          {[...byParent.values()].map(({ row, students }) => {
            const name = displayParentName(row)
            return (
              <tr key={row.parent.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserIcon name={name} avatarUrl={row.parent.user.avatar_url} className="size-8 text-xs" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-text-primary">{name}</span>
                      <span className={typography.small}>{row.parent.user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary capitalize">{row.relation}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {students.map((s) => {
                      const sName = [s.user.firstName, s.user.lastName].filter(Boolean).join(' ') || '—'
                      return slug ? (
                        <Link
                          key={s.id}
                          href={`/${slug}/direction/people/students/${s.id}`}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
                        >
                          {sName}
                        </Link>
                      ) : (
                        <span key={s.id} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-text-secondary">
                          {sName}
                        </span>
                      )
                    })}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
