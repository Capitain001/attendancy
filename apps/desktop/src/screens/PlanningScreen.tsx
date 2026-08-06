import { useState } from 'react'
import { PlanningView } from '@attendancy/planning'
import { WeekNav } from '../components/WeekNav'
import { useAppContext } from '../context/AppContext'

function getWeekRange(offset: number): { from: string; to: string; label: string } {
  const now = new Date()
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + offset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt      = (d: Date) => d.toISOString().slice(0, 10)
  const fmtShort = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return { from: fmt(monday), to: fmt(sunday), label: `${fmtShort(monday)} – ${fmtShort(sunday)}` }
}

export function PlanningScreen() {
  const { classId } = useAppContext()
  const [weekOffset, setWeekOffset] = useState(0)
  const { from, to, label } = getWeekRange(weekOffset)

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-center border-b border-border/20 bg-background/80 px-4 py-3 backdrop-blur-sm">
        <WeekNav
          label={label}
          onPrev={() => setWeekOffset((o) => o - 1)}
          onNext={() => setWeekOffset((o) => o + 1)}
          canNext={weekOffset < 4}
        />
      </div>
      <PlanningView classId={classId} from={from} to={to} />
    </div>
  )
}
