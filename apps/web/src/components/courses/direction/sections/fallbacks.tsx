import { cn } from '@/lib/utils'

export function BannerSkeleton() {
  return <div className="h-40 md:h-44 rounded-2xl bg-muted animate-pulse" />
}

export function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  )
}

export function BlockSkeleton({ className }: { className?: string }) {
  return <div className={cn('rounded-xl bg-muted animate-pulse', className)} />
}
