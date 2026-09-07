import type { ReactNode } from 'react'
import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import UserIcon from '@/components/users/UserIcon'

type Enrollment = {
  id: string
  studentId: string
  student: {
    id: string
    user: {
      firstName: string | null
      lastName: string | null
      email: string
      avatar_url: string | null
    }
  }
  studentGroups: {
    id: string
    group: { id: string; name: string }
  }[]
}

function displayName(e: Enrollment) {
  const { firstName, lastName } = e.student.user
  return [firstName, lastName].filter(Boolean).join(' ') || e.student.user.email
}

function ConditionalLink({ href, children, className }: { href?: string; children: ReactNode; className?: string }) {
  if (href) return <Link href={href} className={cn(className, 'hover:opacity-80 transition-opacity')}>{children}</Link>
  return <div className={className}>{children}</div>
}

export function StudentList({ enrollments, slug }: { enrollments: Enrollment[]; slug?: string }) {
  if (enrollments.length === 0) {
    return (
      <div className={cn(card.soft, 'py-12 text-center')}>
        <GraduationCap className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>Aucun étudiant inscrit dans cette classe.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30 bg-muted/40">
            <th className={cn(typography.label, 'px-4 py-2 text-left font-medium')}>Étudiant</th>
            <th className={cn(typography.label, 'px-4 py-2 text-left font-medium hidden md:table-cell')}>Groupes</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.map((e) => {
            const href = slug ? `/${slug}/direction/people/students/${e.studentId}` : undefined
            return (
            <tr key={e.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <ConditionalLink href={href} className="flex items-center gap-3">
                  <UserIcon name={displayName(e)} avatarUrl={e.student.user.avatar_url} className="size-8 text-xs" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-text-primary">{displayName(e)}</span>
                    <span className={typography.small}>{e.student.user.email}</span>
                  </div>
                </ConditionalLink>
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                {e.studentGroups.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {e.studentGroups.map((g) => (
                      <span key={g.id} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                        {g.group.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-text-subtle italic text-xs">—</span>
                )}
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  )
}
