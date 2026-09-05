'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { UsersRound } from 'lucide-react'
import UserIcon from '@/components/users/UserIcon'
import { ParentFilter, type SortKey } from './ParentFilter'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { GetParentsForDirectionDto } from '@/services/student'

type ParentItem = GetParentsForDirectionDto[number]

function displayParentName(row: ParentItem) {
  const { firstName, lastName } = row.parent.user
  return [firstName, lastName].filter(Boolean).join(' ') || row.parent.user.email
}

export function ParentList({ parents, slug }: { parents: GetParentsForDirectionDto; slug?: string }) {
  const [search, setSearch] = useState('')
  const [filterRelation, setFilterRelation] = useState('all')
  const [sortBy, setSortBy] = useState<SortKey>('name')

  // Grouper par parent pour combiner les étudiants rattachés
  const groupedParents = useMemo(() => {
    const byParent = new Map<string, { row: ParentItem; students: ParentItem['student'][] }>()
    for (const row of parents) {
      const existing = byParent.get(row.parent.id)
      if (existing) {
        existing.students.push(row.student)
      } else {
        byParent.set(row.parent.id, { row, students: [row.student] })
      }
    }
    return [...byParent.values()]
  }, [parents])

  // Liste des types de relation uniques pour le filtre
  const allRelations = useMemo(() => {
    return Array.from(new Set(parents.map((p) => p.relation).filter(Boolean))).sort()
  }, [parents])

  // Filtrage et tri des responsables
  const filteredParents = useMemo(() => {
    const q = search.trim().toLowerCase()

    return groupedParents
      .filter(({ row, students }) => {
        // Filtrage par type de relation
        if (filterRelation !== 'all' && row.relation !== filterRelation) {
          return false
        }

        if (!q) return true

        // Recherche par nom / email du parent
        const parentName = displayParentName(row).toLowerCase()
        const parentEmail = (row.parent.user.email ?? '').toLowerCase()
        const relation = (row.relation ?? '').toLowerCase()

        const matchParent = parentName.includes(q) || parentEmail.includes(q) || relation.includes(q)
        if (matchParent) return true

        // Recherche par nom des étudiants rattachés
        const matchStudent = students.some((s) => {
          const sName = [s.user.firstName, s.user.lastName].filter(Boolean).join(' ').toLowerCase()
          return sName.includes(q)
        })

        return matchStudent
      })
      .sort((a, b) => {
        if (sortBy === 'email') {
          return (a.row.parent.user.email ?? '').localeCompare(b.row.parent.user.email ?? '')
        }
        if (sortBy === 'relation') {
          return (a.row.relation ?? '').localeCompare(b.row.relation ?? '')
        }
        return displayParentName(a.row).localeCompare(displayParentName(b.row))
      })
  }, [groupedParents, search, filterRelation, sortBy])

  if (parents.length === 0) {
    return (
      <div className={cn(card.soft, 'py-12 text-center')}>
        <UsersRound className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>Aucun responsable légal enregistré.</p>
        <p className={typography.small}>Les responsables apparaissent ici après avoir été invités.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Composant de filtre indépendant */}
      <ParentFilter
        search={search}
        onSearchChange={setSearch}
        filterRelation={filterRelation}
        onRelationChange={setFilterRelation}
        allRelations={allRelations}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        filteredCount={filteredParents.length}
        totalCount={groupedParents.length}
      />

      {/* Tableau des résultats */}
      <div className="overflow-hidden rounded-lg border border-border/30 bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 bg-muted/40">
              <th className={cn(typography.label, 'px-4 py-2.5 text-left font-medium')}>Responsable</th>
              <th className={cn(typography.label, 'px-4 py-2.5 text-left font-medium')}>Relation</th>
              <th className={cn(typography.label, 'px-4 py-2.5 text-left font-medium')}>Étudiant(s)</th>
            </tr>
          </thead>
          <tbody>
            {filteredParents.map(({ row, students }) => {
              const name = displayParentName(row)
              return (
                <tr
                  key={row.parent.id}
                  className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors"
                >
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
                          <span
                            key={s.id}
                            className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-text-secondary"
                          >
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

        {filteredParents.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Aucun responsable ne correspond à votre recherche.
          </div>
        )}
      </div>
    </div>
  )
}
