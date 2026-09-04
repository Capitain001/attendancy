'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ClassEnrollmentRow, ClassEnrollmentRows } from '@/services/student'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AttendanceTableBar } from '@/components/attendance/AttendanceBar'
import {
  initials,
  sexLabel,
} from '@/components/direction/students/utils'
import { StudentDetailModal } from './StudentDetailModal'

type SortKey = 'name' | 'email'

const GRID = 'grid grid-cols-[36px_1fr_80px_60px_104px] gap-3 items-center'

function matchesFilters(
  row: ClassEnrollmentRow,
  search: string,
  filterSex: string,
  filterGroup: string,
): boolean {
  const u = row.student.user
  const q = search.toLowerCase()
  const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase()
  const matchSearch = name.includes(q) || u.email.toLowerCase().includes(q)
  const matchSex = filterSex === 'all' || u.sex === filterSex
  const matchGroup =
    filterGroup === 'all' ||
    row.studentGroups.some((sg) => sg.group.name === filterGroup)
  return matchSearch && matchSex && matchGroup
}

function compareRows(a: ClassEnrollmentRow, b: ClassEnrollmentRow, sortBy: SortKey): number {
  if (sortBy === 'email') return a.student.user.email.localeCompare(b.student.user.email)
  return `${a.student.user.lastName ?? ''}`.localeCompare(`${b.student.user.lastName ?? ''}`)
}

export function StudentsSection({
  enrollments,
  attendanceRates = {},
  slug,
}: {
  enrollments: ClassEnrollmentRows
  attendanceRates?: Record<string, number>
  slug: string
}) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [filterSex, setFilterSex] = useState('all')
  const [filterGroup, setFilterGroup] = useState('all')
  const [selected, setSelected] = useState<ClassEnrollmentRow | null>(null)

  const allGroups = useMemo(
    () =>
      Array.from(
        new Set(enrollments.flatMap((r) => r.studentGroups.map((sg) => sg.group.name))),
      ).sort(),
    [enrollments],
  )

  const filtered = useMemo(
    () =>
      enrollments
        .filter((row) => matchesFilters(row, search, filterSex, filterGroup))
        .sort((a, b) => compareRows(a, b, sortBy)),
    [enrollments, search, filterSex, filterGroup, sortBy],
  )

  const selectClass =
    'h-9 px-2 text-[12px] bg-card border border-dashed border-foreground/30 rounded-md outline-none text-muted-foreground cursor-pointer'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/70"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un étudiant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-3 text-[12px] bg-card border border-dashed border-foreground/30 rounded-md outline-none focus:border-foreground/60 placeholder:text-muted-foreground/60"
          />
        </div>
        <select value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)} className={selectClass}>
          <option value="all">Tous les groupes</option>
          {allGroups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterSex} onChange={(e) => setFilterSex(e.target.value)} className={selectClass}>
          <option value="all">Tous les genres</option>
          <option value="MALE">Masculin</option>
          <option value="FEMALE">Féminin</option>
          <option value="OTHER">Autre</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className={selectClass}>
          <option value="name">Trier : Nom</option>
          <option value="email">Trier : Email</option>
        </select>
      </div>

      <div className="border border-dashed border-foreground/30 rounded-lg overflow-hidden bg-card">
        <div className={`${GRID} px-3 py-2 border-b border-dashed border-foreground/20 bg-card`}>
          <div />
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Étudiant</span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground text-center">Genre</span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground text-center">Groupes</span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground text-center">Présence</span>
        </div>

        <AnimatePresence mode="popLayout">
          {filtered.map((row, idx) => (
            <StudentRowItem
              key={row.id}
              row={row}
              index={idx}
              attendanceRate={attendanceRates[row.student.id] ?? 0}
              onSelect={() => setSelected(row)}
            />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <p className="text-center text-[12px] text-muted-foreground/70 py-6">
            Aucun étudiant ne correspond à la recherche.
          </p>
        )}
      </div>

      <StudentDetailModal
        row={selected}
        attendanceRate={selected ? (attendanceRates[selected.student.id] ?? 0) : 0}
        href={selected ? `/${slug}/direction/students/${selected.student.id}` : '#'}
        onOpenChange={(open) => { if (!open) setSelected(null) }}
      />
    </div>
  )
}

function StudentRowItem({
  row,
  index,
  attendanceRate,
  onSelect,
}: {
  row: ClassEnrollmentRow
  index: number
  attendanceRate: number
  onSelect: () => void
}) {
  const u = row.student.user
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Étudiant'
  const groupCount = row.studentGroups.length

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.25 }}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
      className={`${GRID} px-3 py-2.5 border-b border-dashed border-foreground/15 last:border-b-0 hover:bg-foreground/[0.03] transition-colors cursor-pointer outline-none focus-visible:bg-foreground/[0.05]`}
    >
      <Avatar className="size-9">
        {u.avatar_url && <AvatarImage src={u.avatar_url} alt={name} />}
        <AvatarFallback className="bg-foreground/15 text-[10px] font-medium text-foreground/70">
          {initials(u)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <p className="text-[13px] font-semibold truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground truncate font-mono">{u.email}</p>
      </div>

      <p className="text-[12px] text-muted-foreground text-center">{sexLabel(u.sex)}</p>

      <p className={`text-[13px] font-mono font-medium text-center ${groupCount > 0 ? 'text-foreground' : 'text-muted-foreground/50'}`}>
        {groupCount}
      </p>

      <AttendanceTableBar attendanceRate={attendanceRate} className="h-[12px]" />
    </motion.div>
  )
}
