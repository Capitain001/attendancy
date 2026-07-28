import Link from 'next/link'
import { cn } from '@/lib/utils'
import { card, typography } from '@/styles'

interface MetricCardProps {
  label: string
  value: string
  sub: string
  href?: string
}


export function MetricCard({
  label,
  value,
  sub,
  href,
}: MetricCardProps) {
  const classes = href ? card.statInteractive : card.stat

  const content = (
    <>
      <p className={cn("mb-1.5", typography.sub)}>
        {label}
      </p>

      <p className={typography.metric}>
        {value}
      </p>

      <p className={cn("mt-0.5 hidden md:block", typography.small)}>
        {sub}
      </p>
    </>
  )

  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>
      {content}
    </div>
  )
}