import { cn } from '@/lib/utils'

export interface CompactMetricCardProps {
  label: string
  value: number | string
  sub?: string
}

export function CompactMetricCard({ label, value, sub }: CompactMetricCardProps) {
  return (
    <div className="flex flex-col border-l-2 border-primary/40 pl-3">
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-text-primary tracking-tight leading-none">{value}</span>
        <span className="text-xs font-medium text-text-subtle uppercase tracking-wider">{label}</span>
      </div>
      {sub && (
        <span className="text-[11px] text-text-subtle/70 mt-1">{sub}</span>
      )}
    </div>
  )
}
