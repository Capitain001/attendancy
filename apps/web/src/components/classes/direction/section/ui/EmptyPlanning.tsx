import Link from 'next/link'
import { GridDeco } from '../../../../design/GridDeco'
import { cn } from '@/lib/utils'

type EmptyPlanningProps = {
  href: string
  message?: string
  title?: string
  className?: string
}

export function EmptyPlanning({
  href,
  message = "Aucune séance prévue aujourd'hui",
  title = 'Consulter le planning',
  className,
}: EmptyPlanningProps) {
  return (
    <div className={cn(
      'relative border border-dashed border-foreground/15 rounded-2xl p-10 flex flex-col items-center justify-center text-center overflow-hidden',
      className,
    )}>
      <GridDeco />
      <div className="relative z-10 space-y-3">
        <p className="text-[13px] font-medium text-muted-foreground/60">{message}</p>
        <Link
          href={href}
          className="inline-block text-[11px] font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground underline underline-offset-4 decoration-foreground/20 transition-colors"
        >
          {title}
        </Link>
      </div>
    </div>
  )
}
