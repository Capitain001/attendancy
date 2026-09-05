// src/components/promotion/PromotionCoursesSection.tsx
'use client'

import { useState, useMemo } from 'react'
import { CoursesTab } from '@/components/tools/CoursesTab'
import { CoursesETab } from '@/components/tools/CoursesETab'
import { PCourse, PCourseCard } from '../ui/PCourseCard'
import { SortableCourseGrid } from '../../dnd/SortableCourseGrid'
import { useCourseOrder } from '../../dnd/useCourseOrder'
import { groupByRelation, Relation } from '@/lib/filter'
import { CourseFilter } from './CourseFilter'
import { Button } from '@/components/ui/button'
import { Edit3 } from 'lucide-react'
import { useEffect } from 'react'

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

const NO_SEMESTER: Relation = { id: 'none', name: 'Sans semestre' }

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

export interface PromotionCoursesSectionProps {
  courses: RawCourse[]
  classTerms?: { id: string; name: string }[]
  selectedTermId?: string | null
  isEditing?: boolean
  setIsEditing?: (val: boolean) => void
  pendingChanges?: Map<string, string | null>
  isSubmitting?: boolean
  onToggleCourse?: (courseId: string, originalTermId: string | null, targetTermId: string | null) => void
  onSave?: () => Promise<void>
  onReset?: () => void
}

export function PromotionCoursesSection({
  courses,
  classTerms,
  selectedTermId,
  isEditing = false,
  setIsEditing,
  pendingChanges = new Map(),
  isSubmitting = false,
  onToggleCourse,
  onSave,
  onReset,
}: PromotionCoursesSectionProps) {
  const [query, setQuery] = useState('')
  const [selectedUeCode, setSelectedUeCode] = useState('')

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

  const ueCodes = useMemo(() => {
    const set = new Set<string>()
    courses.forEach((c) => {
      if (c.ueCourse?.code) set.add(c.ueCourse.code)
    })
    return Array.from(set).sort()
  }, [courses])

  const terms = useMemo(() => {
    const map = new Map<string, string>()

    if (classTerms && classTerms.length > 0) {
      classTerms.forEach((t) => map.set(t.id, t.name))
    }

    courses.forEach((c) => {
      if (c.term) map.set(c.term.id, c.term.name)
    })

    const list = Array.from(map.entries()).map(([id, name]) => ({ id, name }))
    list.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }))

    if (list.length === 0 || courses.some((c) => !c.term)) {
      if (!map.has(NO_SEMESTER.id)) {
        list.push({ id: NO_SEMESTER.id, name: NO_SEMESTER.name })
      }
    }

    return list
  }, [courses, classTerms])

  // Active term object based on selectedTermId or fallback to first term
  const activeTerm = useMemo(() => {
    if (selectedTermId) {
      const found = terms.find((t) => t.id === selectedTermId)
      if (found) return found
    }
    return terms[0] ?? null
  }, [selectedTermId, terms])

  const mappedPCourses = useMemo(() => {
    return filteredCourses.map((c) => ({
      ...toPCourse(c),
      termId: c.term?.id ?? null,
    }))
  }, [filteredCourses])

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

  const tabs = useMemo(() => {
    return orderedGroups.map((group) => {
      const pCourses = group.items.map(toPCourse)
      return {
        label: group.relation.name,
        value: group.relation.id,
        count: group.items.length,
        content: <SortableGroup items={pCourses} />,
      }
    })
  }, [orderedGroups])

  return (
    <div className="space-y-3">
      {/* Header avec CourseFilter permanent + Bouton Mode Édition */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CourseFilter
          query={query}
          setQuery={setQuery}
          selectedUeCode={selectedUeCode}
          setSelectedUeCode={setSelectedUeCode}
          ueCodes={ueCodes}
        />

        {setIsEditing && !isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-9 gap-1.5 text-xs font-medium shrink-0 mb-4"
          >
            <Edit3 className="size-3.5" />
            Éditer les semestres
          </Button>
        )}
      </div>

      {/* Mode Édition ou Mode Lecture */}
      {isEditing ? (
        <CoursesETab
          activeTerm={activeTerm}
          courses={mappedPCourses}
          pendingChanges={pendingChanges}
          isSubmitting={isSubmitting}
          onToggleCourse={onToggleCourse ?? (() => {})}
          onSave={onSave}
          onReset={onReset}
          onCancel={() => setIsEditing?.(false)}
        />
      ) : (
        <CoursesTab tabs={tabs} defaultValue={selectedTermId ?? undefined} />
      )}
    </div>
  )
}

function SortableGroup({ items }: { items: PCourse[] }) {
  const { courses, reorder } = useCourseOrder(items)

  useEffect(() => {
    reorder(items)
  }, [items, reorder])

  return <SortableCourseGrid courses={courses} onReorder={reorder} />
}
