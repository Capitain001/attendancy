// src/components/promotion/PromotionCoursesSection.tsx
'use client'

// import { groupByRelation, type Relation } from '@/utils/groupByRelation'
import { CoursesTab } from '@/components/tools/CoursesTab'
import { PCourse, PCourseCard } from '../ui/PCourseCard'
import { groupByRelation, Relation } from '@/lib/filter'

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
  const grouped = groupByRelation(courses, (c) => c.term ?? NO_SEMESTER)

  const orderedGroups = [...grouped].sort((a, b) => {
    if (a.relation.id === NO_SEMESTER.id) return 1
    if (b.relation.id === NO_SEMESTER.id) return -1
    return a.relation.name.localeCompare(b.relation.name)
  })

  if (orderedGroups.length === 0) {
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

  return <CoursesTab tabs={tabs} />
}