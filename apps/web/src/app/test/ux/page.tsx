'use client'

import { useState } from 'react'
import { fr } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/custom/calendar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Données factices : un jour "a des données" selon un motif déterministe
const CHIPS = [
  { id: 'presences', label: 'Présences', dot: 'bg-emerald-500' },
  { id: 'absences', label: 'Absences', dot: 'bg-red-500' },
  { id: 'annulees', label: 'Annulées', dot: 'bg-orange-400' },
  { id: 'rattrapages', label: 'Rattrapages', dot: 'bg-sky-400' },
] as const

const hasData = (date: Date, seed: number) => (date.getDate() * (seed + 2)) % 4 === 0

export default function TestCalendarPage() {
  const [mode, setMode] = useState<'single' | 'range'>('single')
  const [chipIndex, setChipIndex] = useState(0)
  const [month, setMonth] = useState(() => new Date())
  const [date, setDate] = useState<Date | undefined>(() => new Date())
  const [range, setRange] = useState<DateRange | undefined>()

  const chip = CHIPS[chipIndex]

  const dayFooter = (d: Date) =>
    hasData(d, chipIndex) ? (
      <span className={cn('block size-1.5 rounded-full', chip.dot)} />
    ) : null

  const goToday = () => {
    const today = new Date()
    setMonth(today)
    setDate(today)
  }

  const shared = {
    locale: fr,
    month,
    onMonthChange: setMonth,
    todayLabel: 'Auj.',
    dayFooter,
    classNames: { root: 'w-full' },
  }

  return (
    <div className="flex min-h-screen justify-center bg-background">
      <div className="flex w-full max-w-md flex-col gap-5 p-4">
        {/* Bascule single / range */}
        <div className="flex gap-2">
          {(['single', 'range'] as const).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setMode(m)}
            >
              {m === 'single' ? 'Jour' : 'Plage'}
            </Button>
          ))}
        </div>

        {/* Pastilles de filtre : changent la couleur des points */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CHIPS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setChipIndex(i)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                i === chipIndex
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-foreground',
              )}
            >
              <span className={cn('size-3 rounded-full', c.dot)} />
              {c.label}
            </button>
          ))}
        </div>

        {/* Calendrier */}
        {mode === 'single' ? (
          <Calendar {...shared} mode="single" selected={date} onSelect={setDate} />
        ) : (
          <Calendar {...shared} mode="range" selected={range} onSelect={setRange} />
        )}

        {/* Barre d'actions */}
        <div className="mt-auto flex gap-3">
          <Button variant="secondary" className="h-12 rounded-full px-6" onClick={goToday}>
            Aujourd'hui
          </Button>
          <Button className="h-12 flex-1 rounded-full">
            {mode === 'single'
              ? date
                ? `Aller au ${date.toLocaleDateString('fr-FR')}`
                : 'Choisir une date'
              : range?.from
                ? `${range.from.toLocaleDateString('fr-FR')}${range.to ? ` → ${range.to.toLocaleDateString('fr-FR')}` : ''}`
                : 'Choisir une plage'}
          </Button>
        </div>
      </div>
    </div>
  )
}