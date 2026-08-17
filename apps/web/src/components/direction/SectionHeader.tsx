import type { ReactNode } from 'react'
import { typography } from '@/styles'

interface SectionHeaderProps {
  title: string
  count?: number
  countLabel?: string
  action?: ReactNode
  meta?: ReactNode
  description?: string
}

export function SectionHeader({ title, count, countLabel, action, meta, description }: SectionHeaderProps) {
  const countText =
    count !== undefined && countLabel
      ? `${count} ${count !== 1 ? countLabel : countLabel.replace(/s$/, '')}`
      : undefined

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-base font-semibold text-text-primary">{title}</h1>
        {description && <p className={typography.body}>{description}</p>}
      </div>
      <div className="flex items-center gap-3">
        {meta}
        {countText && <span className={typography.small}>{countText}</span>}
        {action}
      </div>
    </div>
  )
}
