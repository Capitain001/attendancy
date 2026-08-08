import type { ReactNode } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import UserIcon from '@/components/users/UserIcon'

type Teacher = {
  id: string
  department: { id: string; name: string } | null
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
    avatar_url: string | null
    status: string
  }
  _count: { courses: number }
}

function displayName(t: Teacher) {
  return [t.user.firstName, t.user.lastName].filter(Boolean).join(' ') || t.user.email
}

export function TeacherList({ teachers, slug }: { teachers: Teacher[]; slug?: string }) {
  if (teachers.length === 0) {
    return (
      <div className={cn(card.soft, 'py-12 text-center')}>
        <Users className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>Aucun enseignant enregistré.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30 bg-muted/40">
            <th className={cn(typography.label, 'px-4 py-2 text-left font-medium')}>Enseignant</th>
            <th className={cn(typography.label, 'px-4 py-2 text-left font-medium hidden md:table-cell')}>Département</th>
            <th className={cn(typography.label, 'px-4 py-2 text-center font-medium')}>Cours</th>
            <th className={cn(typography.label, 'px-4 py-2 text-center font-medium hidden md:table-cell')}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => {
            const href = slug ? `/${slug}/direction/people/teachers/${t.id}` : undefined
            return (
            <tr key={t.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <ConditionalLink href={href} className="flex items-center gap-3">
                  <UserIcon name={displayName(t)} avatarUrl={t.user.avatar_url} className="size-8 text-xs" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-text-primary">{displayName(t)}</span>
                    <span className={typography.small}>{t.user.email}</span>
                  </div>
                </ConditionalLink>
              </td>
              <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                {t.department?.name ?? <span className="text-text-subtle italic">—</span>}
              </td>
              <td className="px-4 py-3 text-center text-text-secondary">{t._count.courses}</td>
              <td className="px-4 py-3 text-center hidden md:table-cell">
                <StatusBadge status={t.user.status} />
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  )
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE:   { label: 'Actif',    cls: 'bg-green-500/15 text-green-600' },
  INACTIVE: { label: 'Inactif',  cls: 'bg-muted text-text-subtle' },
  INVITED:  { label: 'Invité',   cls: 'bg-primary/10 text-primary' },
}

function ConditionalLink({
  href,
  children,
  className,
}: {
  href?: string
  children: ReactNode
  className?: string
}) {
  if (href) return <Link href={href} className={cn(className, 'hover:opacity-80 transition-opacity')}>{children}</Link>
  return <div className={className}>{children}</div>
}

function StatusBadge({ status }: { status: string }) {
  const { label, cls } = STATUS_MAP[status] ?? { label: status, cls: 'bg-muted text-text-subtle' }
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', cls)}>{label}</span>
  )
}
