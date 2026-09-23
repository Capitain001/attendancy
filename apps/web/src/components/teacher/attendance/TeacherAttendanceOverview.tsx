'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { GetTeacherAttendanceOverviewDto } from '@/services/attendance'
import { TEACHER_OVERVIEW_WINDOW_DAYS } from '@/services/attendance/constants'
import { ABSENTEEISM_MIN_SESSIONS, ABSENTEEISM_RATE_THRESHOLD } from '@/services/attendance/policy'
import { formatRate, initials, plural } from './format'

type Props = {
  overview: GetTeacherAttendanceOverviewDto
}

type Detail = 'atRisk' | 'sessions' | 'absences' | 'courses' | null

// Palette calquée sur la maquette de référence (blocs bento, verts sourcés
// à la capture) : un vert vif unique pour tout chiffre qui doit "sortir" du
// fond, du blanc quand le fond est déjà saturé, une pastille claire pour
// tous les badges quel que soit le bloc.
const ACCENT_GREEN = 'text-[#22B573]'

const STAT_TONES = {
  // pastel clair — chiffre en vert vif, libellé en vert foncé
  light: { bg: 'bg-[#C3EFC8]', label: 'text-[#0E3324]/70', value: ACCENT_GREEN, caption: 'text-[#0E3324]/60' },
  // vert saturé moyen — chiffre blanc (le vert vif n'y contrasterait plus)
  mid: { bg: 'bg-[#2C9D78]', label: 'text-white/75', value: 'text-white', caption: 'text-white/70' },
  soft: { bg: 'bg-[#1C8465]', label: 'text-white/75', value: 'text-white', caption: 'text-white/70' },
  // quasi noir-vert — chiffre en vert vif, qui "pop" sur le fond sombre
  deep: { bg: 'bg-[#0E2B22]', label: 'text-white/60', value: ACCENT_GREEN, caption: 'text-white/50' },
} as const

const BADGE_TONE = 'bg-[#DFF6E2] text-[#0E3324]'

// Vue essentielle inspirée d'un bento clean : le taux en typographie nue,
// puis quatre blocs colorés résumés. Chaque bloc est cliquable et ouvre le
// détail dans une modale — la vue principale ne porte que l'essentiel.
export function TeacherAttendanceOverview({ overview: { totals, byCourse, absentees } }: Props) {
  const [detail, setDetail] = useState<Detail>(null)

  if (totals.sessions === 0) return <EmptyState />

  const worstCourse = byCourse[0]
  const coursesAtRisk = byCourse.filter(
    ({ rate, denominator }) => rate !== null && rate < ABSENTEEISM_RATE_THRESHOLD && denominator >= ABSENTEEISM_MIN_SESSIONS,
  )

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className={cn('text-7xl font-semibold tracking-tight tabular-nums', ACCENT_GREEN)}>{formatRate(totals.rate)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Taux de présence</p>
        </div>
        <span className="pt-2 text-sm text-muted-foreground">{TEACHER_OVERVIEW_WINDOW_DAYS} jours</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatBlock
          label="À surveiller"
          value={String(absentees.length)}
          caption={
            absentees.length === 0
              ? 'Personne sous le seuil'
              : `étudiant${absentees.length > 1 ? 's' : ''} sous ${ABSENTEEISM_RATE_THRESHOLD}%`
          }
          badge={absentees.length > 0 ? 'à risque' : undefined}
          tone="light"
          className="col-span-2"
          onClick={() => setDetail('atRisk')}
        />

        <StatBlock
          label="Séances"
          value={String(totals.sessions)}
          caption="clôturées"
          tone="deep"
          className="row-span-2"
          onClick={() => setDetail('sessions')}
        />

        <StatBlock label="Absences" value={String(totals.absent)} caption="sur la période" tone="mid" onClick={() => setDetail('absences')} />

        <StatBlock
          label="Cours"
          value={String(byCourse.length)}
          caption={worstCourse ? `${worstCourse.courseName} : ${formatRate(worstCourse.rate)}` : 'suivis'}
          badge={coursesAtRisk.length > 0 ? 'à risque' : undefined}
          tone="soft"
          onClick={() => setDetail('courses')}
        />
      </div>

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          {detail === 'atRisk' && <AtRiskDetail students={absentees} />}
          {detail === 'sessions' && <SessionsDetail totals={totals} />}
          {detail === 'absences' && <AbsencesDetail totals={totals} />}
          {detail === 'courses' && <CoursesDetail courses={byCourse} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Bloc résumé ────────────────────────────────────────────────────────────

type StatBlockProps = {
  label: string
  value: string
  caption: string
  badge?: string
  tone: keyof typeof STAT_TONES
  className?: string
  onClick: () => void
}

function StatBlock({ label, value, caption, badge, tone, className, onClick }: StatBlockProps) {
  const t = STAT_TONES[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex flex-col justify-between gap-6 rounded-[28px] p-5 text-left transition-transform active:scale-[0.98]', t.bg, className)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn('text-sm', t.label)}>{label}</p>
        {badge && <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium', BADGE_TONE)}>{badge}</span>}
      </div>
      <div>
        <p className={cn('text-4xl font-semibold tabular-nums', t.value)}>{value}</p>
        <p className={cn('mt-1 truncate text-xs', t.caption)}>{caption}</p>
      </div>
    </button>
  )
}

// ─── Détails (modale) ───────────────────────────────────────────────────────

function AtRiskDetail({ students }: { students: GetTeacherAttendanceOverviewDto['absentees'] }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>À surveiller</DialogTitle>
        <DialogDescription>
          Taux sous {ABSENTEEISM_RATE_THRESHOLD}%, {plural(ABSENTEEISM_MIN_SESSIONS, 'séance')} minimum décomptées.
        </DialogDescription>
      </DialogHeader>
      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground">Personne sous le seuil.</p>
      ) : (
        <ul className="space-y-3">
          {students.map(({ studentId, firstName, lastName, rate, absent }) => (
            <li key={studentId} className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#DFF6E2] text-xs font-medium text-[#0E3324]">
                {initials(firstName, lastName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{[firstName, lastName].filter(Boolean).join(' ') || 'Étudiant'}</p>
                <p className="text-xs text-muted-foreground">{plural(absent, 'absence')}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{formatRate(rate)}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function SessionsDetail({ totals }: { totals: GetTeacherAttendanceOverviewDto['totals'] }) {
  const rows = [
    { label: 'Présents', value: totals.present },
    { label: 'Retards', value: totals.late },
    { label: 'Absents', value: totals.absent },
    { label: 'Justifiés', value: totals.excused },
  ]
  return (
    <>
      <DialogHeader>
        <DialogTitle>Séances</DialogTitle>
        <DialogDescription>
          {plural(totals.sessions, 'séance')} clôturées sur {TEACHER_OVERVIEW_WINDOW_DAYS} jours, {plural(totals.denominator, 'pointage')} au total.
        </DialogDescription>
      </DialogHeader>
      <ul className="space-y-2">
        {rows.map(({ label, value }) => (
          <li key={label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold tabular-nums">{value}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

function AbsencesDetail({ totals }: { totals: GetTeacherAttendanceOverviewDto['totals'] }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Absences</DialogTitle>
        <DialogDescription>Sur {TEACHER_OVERVIEW_WINDOW_DAYS} jours.</DialogDescription>
      </DialogHeader>
      <ul className="space-y-2">
        <li className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Absences</span>
          <span className="font-semibold tabular-nums">{totals.absent}</span>
        </li>
        <li className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">dont justifiées</span>
          <span className="font-semibold tabular-nums">{totals.excused}</span>
        </li>
      </ul>
    </>
  )
}

function CoursesDetail({ courses }: { courses: GetTeacherAttendanceOverviewDto['byCourse'] }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Par cours</DialogTitle>
        <DialogDescription>Triés du taux le plus bas au plus haut.</DialogDescription>
      </DialogHeader>
      <ul className="space-y-3">
        {courses.map(({ courseId, classId, courseName, className, rate, sessions }) => (
          <li key={`${courseId}:${classId}`} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{courseName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {className} · {plural(sessions, 'séance')}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{formatRate(rate)}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-dashed p-12 text-center text-sm text-muted-foreground">
      Aucune séance clôturée sur les {TEACHER_OVERVIEW_WINDOW_DAYS} derniers jours.
    </div>
  )
}