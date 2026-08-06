import Link from 'next/link'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  sub: string
  href?: string
}

export function MetricCard({ label, value, sub, href }: MetricCardProps) {
  const classes = cn(
    'block rounded-lg bg-muted/50 p-4',
    href &&
      'cursor-pointer transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  )

  const content = (
    <>
      <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground md:text-2xl">{value}</p>
      <p className="mt-0.5 hidden text-xs text-muted-foreground md:block">{sub}</p>
    </>
  )

  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  )
}
