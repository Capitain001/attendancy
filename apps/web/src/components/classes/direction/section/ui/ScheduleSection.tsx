'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ClassProfileData } from './types'
import { SCHEDULE_STATUS_CONFIG, formatTime, sessionDurationHours } from './helpers'
import { GridDeco } from './GridDeco'
import { EmptyPlanning } from './EmptyPlanning'
import UserIcon from '@/components/users/UserIcon'
import { Clock } from 'lucide-react'

function ScheduleModal({
  schedule,
  onClose,
}: {
  schedule: ClassProfileData['upcomingSchedules'][number]
  onClose: () => void
}) {
  const sc = SCHEDULE_STATUS_CONFIG[schedule.status]
  const sessionHours = sessionDurationHours(schedule.startTime, schedule.endTime)
  const done = schedule.courseHoursDone ?? 0
  const total = schedule.courseHoursTotal ?? 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-background border border-dashed border-foreground/25 rounded overflow-hidden"
      >
        <GridDeco />
        <div className="relative z-10 p-6 space-y-7">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
              {schedule.room}
            </p>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded-sm ${sc.badge}`}>
              <span className={`size-1 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            <button onClick={onClose} className="text-muted-foreground/40 hover:text-foreground transition-colors p-1 -mr-1">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <h3 className="text-xl font-semibold tracking-tight leading-none text-foreground/90">
            {schedule.courseName}
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 w-12 shrink-0">Prof</span>
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-foreground/5 flex items-center justify-center border border-foreground/10 overflow-hidden">
                  <UserIcon className="size-5 text-muted-foreground" />
                </div>
                <span className="text-[13px] font-medium">{schedule.teacherName}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 w-12 shrink-0">Heure</span>
              <div className="flex items-center gap-2 text-[13px]">
                <svg className="size-3.5 text-muted-foreground/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" strokeLinecap="round" />
                </svg>
                <span className="font-medium tabular-nums text-foreground/80">
                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                </span>
              </div>
            </div>

            {total > 0 && (
              <div className="pt-1">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 w-12 shrink-0">Durée</span>
                  <span className="text-[11px] tabular-nums font-semibold">
                    {done + sessionHours}h <span className="text-muted-foreground/50 font-normal">/ {total}h total</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ScheduleCard({
  schedule,
  onClick,
}: {
  schedule: ClassProfileData['upcomingSchedules'][number]
  now: number
  onClick: () => void
}) {
  const isCanceled = schedule.status === 'CANCELED' || schedule.status === 'MISSED'

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`relative p-4 border border-dashed border-foreground/30 dark:border-border rounded-2xl bg-card overflow-hidden hover:bg-card/70 transition-colors text-left ${isCanceled ? 'opacity-50' : ''}`}
    >
      <GridDeco />
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold truncate pr-2">{schedule.courseName}</h3>
          <span className="text-[10px] font-mono text-inherit/90 dark:opacity-50">{schedule.status}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <svg className="size-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {schedule.room}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 opacity-60" />
            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

export function ScheduleSection({
  schedules,
  planningHref,
}: {
  schedules: ClassProfileData['upcomingSchedules']
  planningHref?: string
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  const hasOngoing = useMemo(
    () =>
      schedules.some(
        (s) =>
          s.status === 'PENDING' &&
          new Date(s.startTime).getTime() <= now &&
          now < new Date(s.endTime).getTime(),
      ),
    [schedules, now],
  )

  useEffect(() => {
    if (!hasOngoing) return
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [hasOngoing])

  const selected = useMemo(
    () => schedules.find((s) => s.id === selectedId) ?? null,
    [schedules, selectedId],
  )

  if (schedules.length === 0) {
    return <EmptyPlanning href={planningHref ?? '#'} />
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {schedules.map((s) => (
          <ScheduleCard key={s.id} schedule={s} now={now} onClick={() => setSelectedId(s.id)} />
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <ScheduleModal schedule={selected} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
