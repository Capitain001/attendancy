// src/components/users/avatars/ParticipantIcon.tsx

import { cn } from '@/lib/utils'
import UserIcon from '../UserIcon'

interface ParticipantIconProps {
  name: string
  avatarUrl?: string | null
  updatedAt?: string | number | Date | null
  selected?: boolean
  className?: string
}

export function ParticipantIcon({
  name,
  avatarUrl,
  updatedAt,
  selected = false,
  className,
}: ParticipantIconProps) {
  return (
    <div className={cn('flex w-[72px] shrink-0 flex-col items-center gap-1.5', className)}>
      <UserIcon
        name={name}
        avatarUrl={avatarUrl}
        updatedAt={updatedAt}
        className={cn(
          'size-14 transition-all',
          selected
            ? 'border-foreground ring-2 ring-foreground/20 ring-offset-2 ring-offset-background'
            : 'border-transparent',
        )}
      />
      <span
        className={cn(
          'w-full truncate text-center text-[11px] transition-colors',
          selected ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
      >
        {name}
      </span>
    </div>
  )
}