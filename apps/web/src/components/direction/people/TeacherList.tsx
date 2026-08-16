"use client"

import type { ReactNode } from 'react'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import UserIcon from '@/components/users/UserIcon'
import { GetTeachersDto } from '@/services/teacher'
import { TeacherFilter, STATUS_MAP } from './TeacherFilter'

function displayName(t: GetTeachersDto[number]) {
  return [t.user.firstName, t.user.lastName].filter(Boolean).join(' ') || t.user.email
}

export function TeacherList({ teachers, slug }: { teachers: GetTeachersDto; slug?: string }) {
  const [query, setQuery] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [status, setStatus] = useState('')

  const departments = useMemo(() => {
    const map = new Map<string, string>()
    teachers.forEach(t => {
      if (t.department) map.set(t.department.id, t.department.name)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [teachers])

  const filteredTeachers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teachers.filter((t) => {
      const name = displayName(t).toLowerCase()
      const matchesQuery = !q || name.includes(q) || t.user.email.toLowerCase().includes(q)
      const matchesDepartment = !departmentId || t.department?.id === departmentId
      const matchesStatus = !status || t.user.status === status
      return matchesQuery && matchesDepartment && matchesStatus
    })
  }, [teachers, query, departmentId, status])

  if (teachers.length === 0) {
    return (
      <div className={cn(card.soft, 'py-12 text-center')}>
        <Users className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>Aucun enseignant enregistré.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <TeacherFilter
        query={query}
        setQuery={setQuery}
        departmentId={departmentId}
        setDepartmentId={setDepartmentId}
        status={status}
        setStatus={setStatus}
        departments={departments}
      />
      
      {filteredTeachers.length === 0 ? (
        <div className={cn(card.soft, 'py-12 text-center')}>
          <p className={typography.body}>Aucun enseignant ne correspond à ces critères.</p>
        </div>
      ) : (
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
              {filteredTeachers.map((t) => {
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
      )}
    </div>
  )
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
