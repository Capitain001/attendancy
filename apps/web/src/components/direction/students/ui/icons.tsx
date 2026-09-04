import { cn } from '@/lib/utils'
import type { Sex } from '@/generated/prisma/browser'

export function SexIcon({
  sex,
  className,
}: {
  sex: Sex
  className?: string
}) {
  if (sex === 'FEMALE') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('text-pink-500/80', className)}
        aria-label="Féminin"
      >
        <circle cx="12" cy="9" r="5.5" />
        <path d="M12 14.5V22M8.5 19h7" />
      </svg>
    )
  }

  if (sex === 'MALE') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('text-blue-500/80', className)}
        aria-label="Masculin"
      >
        <circle cx="10" cy="14" r="5.5" />
        <path d="M14 10 21 3M21 3h-5M21 3v5" />
      </svg>
    )
  }

  return null
}