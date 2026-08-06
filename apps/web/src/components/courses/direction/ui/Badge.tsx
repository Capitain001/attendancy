import { cn } from '@/lib/utils'

export function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
        className,
      )}
    >
      {label}
    </span>
  )
}
