'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, GraduationCap, Users } from 'lucide-react'

type LastSessionStatus = 'COMPLETED' | 'CANCELED' | 'MISSED' | 'PENDING'

interface CourseTeacherView {
  id: string
  isMain: boolean
  hours: number | null
  teacher: {
    id: string
    user: { firstName: string | null; lastName: string | null }
  } | null
}

interface LastSessionSummary {
  date: Date
  status: LastSessionStatus
  presentCount: number | null
  totalCount: number | null
}

interface NextSessionSummary {
  date: Date
}

export interface CourseDetailView {
  id: string
  name: string
  description: string | null
  credits: number
  durationDone: number
  durationTotal: number
  class: { id: string; name: string }
  term: { id: string; name: string } | null
  teachers: CourseTeacherView[]
  lastSession: LastSessionSummary | null
  nextSession: NextSessionSummary | null
}

interface CoursePageProps {
  course: CourseDetailView
}

function teacherName(ct: CourseTeacherView) {
  const { firstName, lastName } = ct.teacher?.user ?? {}
  const name = [firstName, lastName].filter(Boolean).join(' ')
  return name || 'Enseignant inconnu'
}

function formatSessionDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const LAST_SESSION_CONFIG: Record<LastSessionStatus, { label: string; dot: string }> = {
  COMPLETED: { label: 'Effectuée', dot: 'bg-emerald-500/70' },
  CANCELED: { label: 'Annulée', dot: 'bg-amber-500/70' },
  MISSED: { label: 'Non tenue', dot: 'bg-rose-500/70' },
  PENDING: { label: 'En attente', dot: 'bg-foreground/30' },
}

export function CoursePage({ course }: CoursePageProps) {
  const progress =
    course.durationTotal > 0
      ? Math.min(100, Math.round((course.durationDone / course.durationTotal) * 100))
      : null

  const mainTeacher = course.teachers.find((t) => t.isMain)
  const coTeachers = course.teachers.filter((t) => !t.isMain)
  const lastConfig = course.lastSession ? LAST_SESSION_CONFIG[course.lastSession.status] : null

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Retour */}
      <Link
        href={`/teacher/classes`}
        className="inline-flex w-fit items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
      >
        <ArrowLeft className="size-3" />
        {course.class.name}
      </Link>

      {/* En-tête */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{course.name}</h1>
        <p className="text-sm text-foreground/40">
          {course.class.name}
          {course.term && ` · ${course.term.name}`}
        </p>
      </div>

      {/* Infos rapides */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5 rounded-xl bg-foreground/5 p-3">
          <span className="flex items-center gap-1.5 text-xs text-foreground/40">
            <GraduationCap className="size-3.5" />
            Crédits
          </span>
          <span className="text-lg font-semibold tabular-nums text-foreground/70">
            {course.credits}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-xl bg-foreground/5 p-3">
          <span className="flex items-center gap-1.5 text-xs text-foreground/40">
            <Users className="size-3.5" />
            Enseignants
          </span>
          <span className="text-lg font-semibold tabular-nums text-foreground/70">
            {course.teachers.length}
          </span>
        </div>
      </div>

      {/* Description */}
      {course.description && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-foreground/40">Description</p>
          <p className="text-sm leading-relaxed text-foreground/70">{course.description}</p>
        </div>
      )}

      {/* Équipe pédagogique */}
      {course.teachers.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-foreground/40">Équipe pédagogique</p>
          <div className="overflow-hidden rounded-xl border border-foreground/10">
            <div className="p-1">
              {[...(mainTeacher ? [mainTeacher] : []), ...coTeachers].map((ct, index, arr) => (
                <div
                  key={ct.id}
                  className={`flex h-12 items-center gap-3 px-3 text-sm bg-foreground/[0.02] sm:h-10 sm:rounded-lg sm:bg-transparent sm:hover:bg-foreground/5 ${
                    index !== arr.length - 1 ? 'border-b border-foreground/[0.06] sm:border-b-0' : ''
                  }`}
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${
                      ct.isMain ? 'bg-foreground/60' : 'bg-transparent'
                    }`}
                    aria-label={ct.isMain ? 'Enseignant principal' : undefined}
                  />
                  <span className="truncate text-foreground/70">{teacherName(ct)}</span>
                  <span className="h-px flex-1 bg-foreground/10" />
                  {ct.hours !== null && (
                    <span className="shrink-0 font-mono text-xs tabular-nums text-foreground/30">
                      {ct.hours}h
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

{/* Séances */}
<div className="flex flex-col gap-1.5">
  <p className="text-xs text-foreground/40">Séances</p>
  <div className="overflow-hidden rounded-xl border border-foreground/10">
    <div className="p-1">
      {/* Dernière séance */}
      <div className="flex h-12 items-center gap-3 border-b border-foreground/[0.06] bg-foreground/[0.02] px-3 text-sm sm:h-10 sm:rounded-lg sm:border-b-0 sm:bg-transparent sm:hover:bg-foreground/5">
        <span
          className={`size-1.5 shrink-0 rounded-full ${lastConfig ? lastConfig.dot : 'bg-foreground/15'}`}
        />
        <span className="shrink-0 text-foreground/70">Dernière séance</span>
        <span className="h-px flex-1 bg-foreground/10" />
        <span
          className={`shrink-0 text-right text-xs tabular-nums ${
            !course.lastSession
              ? 'text-foreground/25'
              : course.lastSession.status === 'CANCELED'
                ? 'text-rose-500/60 line-through'
                : course.lastSession.status === 'MISSED'
                  ? 'text-foreground/25'
                  : 'text-foreground/50'
          }`}
        >
          {course.lastSession ? (
            <>
              {formatSessionDate(course.lastSession.date)}
              {course.lastSession.status === 'COMPLETED' &&
                course.lastSession.presentCount !== null &&
                course.lastSession.totalCount !== null &&
                ` · ${course.lastSession.presentCount}/${course.lastSession.totalCount}`}
            </>
          ) : (
            'Aucune'
          )}
        </span>
      </div>

      {/* Prochaine séance */}
      <div className="flex h-12 items-center gap-3 bg-foreground/[0.02] px-3 text-sm sm:h-10 sm:rounded-lg sm:bg-transparent sm:hover:bg-foreground/5">
        <span
          className={`size-1.5 shrink-0 rounded-full ${
            course.nextSession ? 'border border-foreground/30' : 'border border-dashed border-foreground/20'
          }`}
        />
        <span className="shrink-0 text-foreground/70">Prochaine séance</span>
        <span className="h-px flex-1 bg-foreground/10" />
        <span className="shrink-0 text-right text-xs tabular-nums text-foreground/40">
          {course.nextSession ? formatSessionDate(course.nextSession.date) : 'Aucune prévue'}
        </span>
      </div>
    </div>
  </div>
</div>

      {/* Progression */}
      {progress !== null && (
        <div className="flex flex-col gap-2 rounded-xl bg-foreground/5 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-foreground/50">
              <Clock className="size-3.5" />
              Progression
            </span>
            <span className="font-mono tabular-nums text-foreground/50">
              {course.durationDone}h / {course.durationTotal}h
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-foreground/60 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}