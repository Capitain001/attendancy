import { cn } from '@/lib/utils'

interface AttendanceBarProps {
  attendanceRate: number
  className?: string
}

export function AttendanceBar({ attendanceRate, className }: AttendanceBarProps) {
  const rate = Math.round(attendanceRate)
  return (
    <div className={cn('space-y-1.5 rounded-md border border-foreground/20 bg-card p-2', className)}>
      <div className="h-[4px] overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-md bg-foreground/50 transition-all duration-500"
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  )
}

interface AttendanceTableBarProps {
  attendanceRate: number
  className?: string
}

export function AttendanceTableBar({ attendanceRate, className }: AttendanceTableBarProps) {
  const rate = Math.round(attendanceRate)
  return (
    <div className={cn('relative h-[22px] w-full rounded bg-foreground/[0.06] overflow-hidden', className)}>
      <div
        className="absolute inset-y-0 left-0 rounded bg-foreground/[0.12] transition-all duration-500"
        style={{ width: `${rate}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-mono font-medium text-foreground/35 pointer-events-none select-none">
        {rate}%
      </span>
    </div>
  )
}
