'use client'

import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { STATUS_CONFIG, type ScheduleWithUi } from './types'
import { formatRange, getAudienceLabel } from './format'
import StatusClock from '@/components/ux/StatusClock'

interface PinnedScheduleCardProps {
  schedule: ScheduleWithUi
  label: string
  isExpanded: boolean
  onToggle: () => void
}

export function PinnedScheduleCard({ schedule, label, isExpanded, onToggle }: PinnedScheduleCardProps) {
  const status = STATUS_CONFIG[schedule.uiStatus]

  return (
    <div className="space-y-2 min-h-[320px]">
      <div className="text-xs font-mono uppercase tracking-wider text-teacher-muted flex items-center gap-1.5">
        <StatusClock status={schedule.uiStatus} />
        {label}
      </div>

      <div className="bg-card rounded-lg p-4 border border-teacher-surface-muted space-y-3">
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-start justify-between text-left group"
        >
          <div className="space-y-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-teacher-muted">{formatRange(schedule)}</span>
              <span aria-label={status.label} className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            </div>
            <h3 className="text-base font-semibold text-teacher-fg truncate">{schedule.course.name}</h3>
            <p className="text-xs text-teacher-muted truncate">{getAudienceLabel(schedule)}</p>
          </div>

          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="p-1 text-teacher-muted group-hover:text-teacher-fg shrink-0"
          >
            <ChevronDown className="size-4" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-teacher-surface-muted text-xs space-y-1.5 text-teacher-muted">
                <div className="flex justify-between">
                  <span>Horaire</span>
                  <span className="font-mono font-medium text-teacher-fg">{formatRange(schedule)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Salle</span>
                  <span className="font-medium text-teacher-fg">{schedule.room.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Classe</span>
                  <span className="font-medium text-teacher-fg">{schedule.class.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Groupe</span>
                  <span className="font-medium text-teacher-fg">{schedule.group?.name ?? 'Classe entière'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Statut</span>
                  <span className="font-medium text-teacher-fg">{status.label}</span>
                </div>

                {schedule.notes && (
                  <p className="pt-2 mt-2 text-xs leading-relaxed text-teacher-muted border-t border-teacher-surface-muted truncate">
                    {schedule.notes}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}