// src/components/promotion/PromotionCoursesSection.tsx
'use client'

import { useState, useMemo } from 'react'
import { CoursesTab } from '@/components/tools/CoursesTab'
import { PCourse, PCourseCard } from '../ui/PCourseCard'
import { groupByRelation, Relation } from '@/lib/filter'
import { CourseFilter } from './CourseFilter'

// ─────────────────────────────────────────────────────────────────────────────
// Forme brute attendue en entrée — le minimum nécessaire pour dériver un
// PCourse + le grouper par semestre. Correspond aux relations Prisma
// disponibles sur Course (term, ueCourse, teachers → CourseTeacher → Teacher
// → User) ; à faire matcher avec le `select` réel de la query owner
// (SERVICE_CONTEXT.md : cette fonction ne fetch rien, elle reçoit et transforme).
// ─────────────────────────────────────────────────────────────────────────────

type RawCourseTeacher = {
  isMain: boolean
  teacher: {
    user: {
      firstName: string | null
      lastName: string | null
    } | null
  } | null
}

export type RawCourse = {
  id: string
  name: string
  credits: number
  durationDone: number
  durationTotal: number
  ueCourse?: { code: string | null } | null
  term?: { id: string; name: string } | null
  teachers: RawCourseTeacher[]
}

// Groupe de repli pour les cours hors maquette (term nullable en DB).
const NO_SEMESTER: Relation = { id: 'none', name: 'Sans semestre' }

// ─────────────────────────────────────────────────────────────────────────────
// Mapper — RawCourse (forme requête) → PCourse (forme attendue par la card)
// ─────────────────────────────────────────────────────────────────────────────

function toPCourse(course: RawCourse): PCourse {
  const mainTeacherUser = course.teachers.find((t) => t.isMain)?.teacher?.user ?? null

  return {
    id: course.id,
    name: course.name,
    credits: course.credits,
    ueCode: course.ueCourse?.code ?? null,
    semesterName: course.term?.name ?? null,
    durationDone: course.durationDone,
    durationTotal: course.durationTotal,
    teacher: mainTeacherUser,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section — groupe par semestre (groupByRelation) puis construit les tabs
// attendus par CoursesTab, chaque contenu étant une grille de PCourseCard.
// "Sans semestre" est toujours poussé en dernier onglet.
// ─────────────────────────────────────────────────────────────────────────────

export function PromotionCoursesSection({ courses }: { courses: RawCourse[] }) {
  const [query, setQuery] = useState('')
  const [selectedUeCode, setSelectedUeCode] = useState('')

  // Extrait la liste unique des codes UE pour le sélecteur
  const ueCodes = useMemo(() => {
    const set = new Set<string>()
    courses.forEach((c) => {
      if (c.ueCourse?.code) set.add(c.ueCourse.code)
    })
    return Array.from(set).sort()
  }, [courses])

  // Filtre les cours en fonction de la recherche (nom, UE, enseignant) et du code UE
  const filteredCourses = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter((c) => {
      const teachersStr = c.teachers
        .map((t) => `${t.teacher?.user?.firstName ?? ''} ${t.teacher?.user?.lastName ?? ''}`)
        .join(' ')
        .toLowerCase()

      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.ueCourse?.code && c.ueCourse.code.toLowerCase().includes(q)) ||
        teachersStr.includes(q)

      const matchesUe = !selectedUeCode || c.ueCourse?.code === selectedUeCode

      return matchesQuery && matchesUe
    })
  }, [courses, query, selectedUeCode])

  const grouped = useMemo(() => {
    return groupByRelation(filteredCourses, (c) => c.term ?? NO_SEMESTER)
  }, [filteredCourses])

  const orderedGroups = useMemo(() => {
    return [...grouped].sort((a, b) => {
      if (a.relation.id === NO_SEMESTER.id) return 1
      if (b.relation.id === NO_SEMESTER.id) return -1
      return a.relation.name.localeCompare(b.relation.name)
    })
  }, [grouped])

  if (courses.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        Aucun cours pour cette promotion.
      </p>
    )
  }

  const tabs = orderedGroups.map((group) => ({
    label: group.relation.name,
    value: group.relation.id,
    count: group.items.length,
    content: (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {group.items.map((course) => (
          <PCourseCard key={course.id} course={toPCourse(course)} />
        ))}
      </div>
    ),
  }))

  const hasActiveFilters = Boolean(query || selectedUeCode)

  return (
    <div className="space-y-3">
      <CourseFilter
        query={query}
        setQuery={setQuery}
        selectedUeCode={selectedUeCode}
        setSelectedUeCode={setSelectedUeCode}
        ueCodes={ueCodes}
      />

      {filteredCourses.length === 0 ? (
        <div className="py-12 text-center bg-card rounded-xl border border-dashed border-foreground/20 p-6">
          <p className="text-sm text-muted-foreground mb-3">
            Aucun cours ne correspond à vos critères de recherche.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSelectedUeCode('')
              }}
              className="text-xs text-primary underline underline-offset-4 hover:opacity-80 font-medium"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <CoursesTab tabs={tabs} />
      )}
    </div>
  )
}