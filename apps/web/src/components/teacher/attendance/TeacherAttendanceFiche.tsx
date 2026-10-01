"use client"

import { useState, type ReactNode } from "react"
import type { GetTeacherAttendanceOverviewDto } from "@/services/attendance"
import { TEACHER_OVERVIEW_WINDOW_DAYS } from "@/services/attendance/constants"
import { ABSENTEEISM_MIN_SESSIONS, ABSENTEEISM_RATE_THRESHOLD } from "@/services/attendance/policy"
import { formatRate, plural } from "./format"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Overview = GetTeacherAttendanceOverviewDto
type View = "home" | "cours" | "surveiller" | "pointages"
type Tone = "neutral" | "warn" | "ok"

/* -------------------------------------------------------------------------- */
/*  Hook : la navigation vit ici, les composants restent des rendus purs       */
/* -------------------------------------------------------------------------- */

function useFicheNavigation() {
  const [view, setView] = useState<View>("home")

  const go = (next: View) => {
    setView(next)
    if (typeof window !== "undefined") window.scrollTo({ top: 0 })
  }

  return { view, go }
}

/* -------------------------------------------------------------------------- */
/*  Briques de la fiche                                                        */
/* -------------------------------------------------------------------------- */

const TONES: Record<Tone, string> = {
  neutral: "border-slate-300 text-slate-600",
  warn: "border-red-700 text-red-700",
  ok: "border-emerald-700 text-emerald-700",
}

function Em({ children }: { children: ReactNode }) {
  return <em className="font-semibold not-italic text-red-700">{children}</em>
}

function Tag({ text, tone }: { text: string; tone: Tone }) {
  return (
    <span className={`whitespace-nowrap border px-1.5 font-sans text-xs font-medium ${TONES[tone]}`}>
      {text}
    </span>
  )
}

function Leader() {
  return <span className="min-w-2 flex-1 border-b border-dotted border-slate-300" />
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="my-1.5 flex items-baseline gap-1.5 text-[15px]">
      <span className="whitespace-nowrap font-sans text-[13px] text-slate-500">{label}</span>
      <Leader />
      <span className="text-right">{children}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-1 mt-5 border-b-2 border-slate-800 pb-0.5 font-sans text-[15px] font-semibold">
      {children}
    </h2>
  )
}

function ViewHeader({ title, sub, backTo, backLabel = "Retour", onBack }: {
  title: string
  sub?: string
  backTo?: View
  backLabel?: string
  onBack: (view: View) => void
}) {
  return (
    <header className="mb-2">
      {backTo && (
        <button
          onClick={() => onBack(backTo)}
          className="mb-2.5 font-sans text-[13px] font-medium text-slate-500 underline hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-slate-800"
        >
          {backLabel}
        </button>
      )}
      <h1 className="font-sans text-xl font-semibold leading-tight">{title}</h1>
      {sub && <p className="mt-0.5 font-sans text-[13px] text-slate-500">{sub}</p>}
    </header>
  )
}

function Line({ title, lines, aside, tag, onClick }: {
  title: string
  lines: string[]
  aside?: ReactNode
  tag?: { text: string; tone: Tone }
  onClick?: () => void
}) {
  const Root = onClick ? "button" : "div"
  return (
    <Root
      onClick={onClick}
      className={`flex w-full items-start justify-between gap-3 border-b border-slate-300 px-1 py-3 text-left ${
        onClick ? "cursor-pointer hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-slate-800" : ""
      }`}
    >
      <span className="block">
        <b className="block font-sans text-[15px] font-semibold">{title}</b>
        {lines.map((line) => (
          <span key={line} className="block text-[13px] leading-snug text-slate-500">{line}</span>
        ))}
      </span>
      <span className="block whitespace-nowrap text-right font-sans text-[13px] leading-snug">
        {tag && <Tag {...tag} />}
        {aside}
      </span>
    </Root>
  )
}

/* -------------------------------------------------------------------------- */
/*  Vues                                                                       */
/* -------------------------------------------------------------------------- */

type ViewProps = { overview: Overview; go: (view: View) => void }

function rateTone(rate: number | null): Tone {
  if (rate === null) return "neutral"
  if (rate < ABSENTEEISM_RATE_THRESHOLD) return "warn"
  if (rate >= 85) return "ok"
  return "neutral"
}

function HomeView({ overview, go }: ViewProps) {
  const { totals, byCourse, absentees } = overview

  const menu: { view: View; title: string; summary: ReactNode }[] = [
    {
      view: "cours",
      title: "Mes cours",
      summary: (
        <>
          {byCourse.length > 0
            ? <>Taux le plus bas : <Em>{formatRate(byCourse[0].rate)}</Em> ({byCourse[0].courseName}).</>
            : <>Aucun cours sur la période.</>}
        </>
      ),
    },
    {
      view: "surveiller",
      title: "À surveiller",
      summary: (
        <>
          {absentees.length > 0
            ? <><Em>{absentees.length} étudiant{absentees.length > 1 ? "s" : ""}</Em> sous {ABSENTEEISM_RATE_THRESHOLD} % de présence.</>
            : <>Personne sous le seuil d’absentéisme.</>}
        </>
      ),
    },
    {
      view: "pointages",
      title: "Détail des pointages",
      summary: (
        <>
          {plural(totals.sessions, "séance")} clôturée{totals.sessions > 1 ? "s" : ""} sur {TEACHER_OVERVIEW_WINDOW_DAYS} jours.
        </>
      ),
    },
  ]

  return (
    <section>
      <ViewHeader title="Fiche de présence" sub={`Espace professeur · ${TEACHER_OVERVIEW_WINDOW_DAYS} derniers jours`} onBack={go} />
      <div className="mt-2.5">
        <Field label="Séances clôturées">{totals.sessions}</Field>
        <Field label="Présence moyenne"><b className="font-semibold">{formatRate(totals.rate)}</b></Field>
        <Field label="Cours suivis">{byCourse.length}</Field>
      </div>

      {totals.sessions === 0 ? (
        <p className="mt-4 text-[13px] leading-snug text-slate-500">
          Aucune séance clôturée sur les {TEACHER_OVERVIEW_WINDOW_DAYS} derniers jours.
        </p>
      ) : (
        <>
          <SectionTitle>Rubriques</SectionTitle>
          <ul>
            {menu.map((item) => (
              <li key={item.view}>
                <button
                  onClick={() => go(item.view)}
                  className="block w-full border-b border-slate-300 px-1 py-3 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-slate-800"
                >
                  <span className="flex items-baseline gap-1.5">
                    <strong className="font-sans text-[15px] font-semibold">{item.title}</strong>
                    <Leader />
                    <span className="font-sans text-xs text-slate-500">Ouvrir</span>
                  </span>
                  <p className="mt-0.5 text-sm leading-snug text-slate-500">{item.summary}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function CoursesView({ overview, go }: ViewProps) {
  const { byCourse } = overview
  return (
    <section>
      <ViewHeader title="Mes cours" sub={`${TEACHER_OVERVIEW_WINDOW_DAYS} derniers jours`} backTo="home" onBack={go} />
      <div className="mt-2">
        {byCourse.map((c) => (
          <Line
            key={`${c.courseId}:${c.classId}`}
            title={c.courseName}
            lines={[`${c.className} · ${plural(c.sessions, "séance")}`]}
            aside={<><b className="block text-[15px] font-semibold">{formatRate(c.rate)}</b>présence</>}
            tag={{ text: formatRate(c.rate), tone: rateTone(c.rate) }}
          />
        ))}
      </div>
      <p className="mt-3 text-[13px] leading-snug text-slate-500">Taux poolé par cours : {(ABSENTEEISM_RATE_THRESHOLD)} % est le seuil d’absentéisme.</p>
    </section>
  )
}

function WatchedView({ overview, go }: ViewProps) {
  const { absentees } = overview
  return (
    <section>
      <ViewHeader
        title="À surveiller"
        sub={`Taux sous ${ABSENTEEISM_RATE_THRESHOLD} % · ${plural(ABSENTEEISM_MIN_SESSIONS, "séance")} minimum`}
        backTo="home"
        onBack={go}
      />
      <div className="mt-2">
        {absentees.length === 0 ? (
          <p className="mt-3 text-[13px] leading-snug text-slate-500">Personne sous le seuil d’absentéisme.</p>
        ) : (
          absentees.map((e) => (
            <Line
              key={e.studentId}
              title={[e.firstName, e.lastName].filter(Boolean).join(" ") || "Étudiant"}
              lines={[plural(e.absent, "absence"), plural(e.denominator, "pointage")]}
              aside={<b className="text-[15px] font-semibold">{formatRate(e.rate)}</b>}
              tag={{ text: "Sous le seuil", tone: "warn" }}
            />
          ))
        )}
      </div>
    </section>
  )
}

function TotalsView({ overview, go }: ViewProps) {
  const { totals } = overview
  const rows = [
    { label: "Présents", value: totals.present },
    { label: "Retards", value: totals.late },
    { label: "Absents", value: totals.absent },
    { label: "Justifiés", value: totals.excused },
    { label: "Pointages décomptés", value: totals.denominator },
  ]
  return (
    <section>
      <ViewHeader title="Détail des pointages" sub={`${plural(totals.sessions, "séance")} clôturée${totals.sessions > 1 ? "s" : ""} · ${TEACHER_OVERVIEW_WINDOW_DAYS} jours`} backTo="home" onBack={go} />
      <div className="mt-2.5">
        <Field label="Présence moyenne"><b className="font-semibold">{formatRate(totals.rate)}</b></Field>
        {rows.map(({ label, value }) => (
          <Field key={label} label={label}>{value}</Field>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

const VIEWS: Record<View, (props: ViewProps) => ReactNode> = {
  home: HomeView,
  cours: CoursesView,
  surveiller: WatchedView,
  pointages: TotalsView,
}

export default function TeacherAttendanceFiche({ overview }: { overview: Overview }) {
  const { view, go } = useFicheNavigation()
  const Current = VIEWS[view]

  return (
    <main className="min-h-dvh p-2 font-serif text-slate-800 sm:py-6">
      <div className="mx-auto max-w-160 border border-slate-800 p-1">
        <div className="border border-slate-300 px-3.5 pb-5 pt-4 sm:px-7 sm:pb-7 sm:pt-6">
          <Current overview={overview} go={go} />
        </div>
      </div>
    </main>
  )
}
