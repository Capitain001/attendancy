import { cn } from '@/lib/utils'

export function Section({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-border/50 bg-card p-5', className)}>
      {children}
    </div>
  )
}

export function SectionHeader({
  title,
  action,
}: {
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </p>
      {action}
    </div>
  )
}
