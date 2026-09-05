'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { GridDeco } from '../../../../design/GridDeco'

// ─────────────────────────────────────────────────────────────────────────────
// Types — libres, pensés pour la vue "cours d'une promotion" (curriculum d'une
// classe, organisé par semestre). Pas de dépendance à un type généré ailleurs :
// on affiche ce qui est utile, avec fallback si un champ manque.
// ─────────────────────────────────────────────────────────────────────────────

type PromotionTeacher = {
  id: string
  firstName: string | null
  lastName: string | null
  isMain: boolean
}

export type PromotionCourse = {
  id: string
  name: string
  credits: number
  ueCode?: string | null
  durationDone: number
  durationTotal: number
  semester: {
    id: string
    name: string
  } | null
  teachers: PromotionTeacher[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers d'affichage
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(first?: string | null, last?: string | null) {
  const a = first?.[0] ?? ''
  const b = last?.[0] ?? ''
  return (a + b).toUpperCase() || '—'
}

function mainTeacherOf(course: PromotionCourse) {
  return course.teachers.find((t) => t.isMain) ?? course.teachers[0] ?? null
}

type SemesterTab = {
  id: string
  label: string
  count: number
}

function buildSemesterTabs(courses: PromotionCourse[]): SemesterTab[] {
  const map = new Map<string, SemesterTab>()
  for (const course of courses) {
    const key = course.semester?.id ?? 'none'
    const label = course.semester?.name ?? 'Sans semestre'
    const existing = map.get(key)
    if (existing) existing.count += 1
    else map.set(key, { id: key, label, count: 1 })
  }
  // "Sans semestre" toujours en dernier si présent
  return Array.from(map.values()).sort((a, b) =>
    a.id === 'none' ? 1 : b.id === 'none' ? -1 : a.label.localeCompare(b.label),
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Carte cours
// ─────────────────────────────────────────────────────────────────────────────

function PromotionCourseCard({ course }: { course: PromotionCourse }) {
  const teacher = mainTeacherOf(course)
  const coTeachersCount = Math.max(course.teachers.length - 1, 0)
  const pct =
    course.durationTotal > 0
      ? Math.min(100, Math.round((course.durationDone / course.durationTotal) * 100))
      : 0

  return (
    <div className="relative p-4 border border-dashed dark:border-border rounded-2xl bg-card overflow-hidden">
      <GridDeco />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{course.name}</p>
            {course.ueCode && (
              <span className="text-[10px] font-mono text-muted-foreground">{course.ueCode}</span>
            )}
          </div>
          <span className="text-[10px] font-mono dark:opacity-80 shrink-0">
            {course.credits} CR
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="size-7 shrink-0 rounded-full bg-foreground/10 flex items-center justify-center border border-dashed border-foreground/20">
            <span className="text-[9px] font-medium">
              {getInitials(teacher?.firstName, teacher?.lastName)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {teacher ? `${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`.trim() : 'Sans enseignant'}
            {coTeachersCount > 0 && (
              <span className="opacity-70"> +{coTeachersCount}</span>
            )}
          </span>
        </div>

        <div>
          <div className="h-1 bg-foreground/10 rounded-full overflow-hidden mb-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-foreground/60"
            />
          </div>
          <div className="flex justify-between text-[9px] opacity-80">
            <span>Progression</span>
            <span>{course.durationDone}h / {course.durationTotal}h</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabs "dossier" — l'onglet actif se détache et se fond dans le panneau ;
// les inactifs reculent légèrement, comme des intercalaires derrière.
// ─────────────────────────────────────────────────────────────────────────────

function FolderTabs({
  tabs,
  activeId,
  onSelect,
}: {
  tabs: SemesterTab[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex items-end gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`relative z-10 shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl border border-dashed transition-all ${
              active
                ? 'bg-card border-foreground/20 border-b-0 -mb-px text-foreground'
                : 'bg-foreground/[0.04] border-transparent text-muted-foreground translate-y-0.5 hover:text-foreground hover:bg-foreground/[0.07]'
            }`}
          >
            {active ? (
              <FolderOpen className="size-3.5" strokeWidth={1.75} />
            ) : (
              <Folder className="size-3.5" strokeWidth={1.75} />
            )}
            <span className="text-[10px] font-mono uppercase tracking-wide">{tab.label}</span>
            <span className="text-[10px] font-mono opacity-60">{tab.count}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section principale
// ─────────────────────────────────────────────────────────────────────────────

export function PromotionCoursesSection({ courses }: { courses: PromotionCourse[] }) {
  const tabs = useMemo(() => buildSemesterTabs(courses), [courses])
  const [activeId, setActiveId] = useState<string>(tabs[0]?.id ?? 'none')

  const activeCourses = useMemo(
    () => courses.filter((c) => (c.semester?.id ?? 'none') === activeId),
    [courses, activeId],
  )

  if (tabs.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground py-6">
        Aucun cours pour cette promotion.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <FolderTabs tabs={tabs} activeId={activeId} onSelect={setActiveId} />

      <div className="relative rounded-b-2xl rounded-tr-2xl border border-dashed dark:border-border bg-card p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {activeCourses.map((c) => (
              <PromotionCourseCard key={c.id} course={c} />
            ))}
            {activeCourses.length === 0 && (
              <p className="col-span-full text-center text-xs text-muted-foreground py-6">
                Aucun cours dans ce semestre.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
{/* 
      <Link
        href="#"
        className="flex justify-center w-full text-sm font-semibold text-muted-foreground tracking-wide underline"
      >
        voir plus ...
      </Link> */}
    </div>
  )
}
