import { cn } from '@attendancy/ui'

type IllustrationProps = { className?: string }

export function TimerIllustration({ className }: IllustrationProps) {
  return (
    <div className={cn('relative', className)}>
      <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="h-full w-full text-muted-foreground/60">
        <rect x="38" y="24" width="44" height="7" rx="3.5" className="fill-card" stroke="currentColor" strokeWidth="2.5" />
        <rect x="38" y="89" width="44" height="7" rx="3.5" className="fill-card" stroke="currentColor" strokeWidth="2.5" />
        <path
          d="M45 29c0 13 11 19 15 22 4-3 15-9 15-22Z"
          className="fill-card"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M45 91c0-13 11-19 15-22 4 3 15 9 15 22Z"
          className="fill-card"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M53 34c1 7 5 11 7 13 2-2 6-6 7-13Z" className="fill-primary/40" />
        <path d="M51 88c2-6 6-9 9-11 3 2 7 5 9 11Z" className="fill-primary/25" />
        <path d="M60 53v8" className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function CalendarRestIllustration({ className }: IllustrationProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute top-4 right-4">
        <div className="relative size-7">
          <div className="absolute inset-0 rounded-full bg-primary/20" />
          <div className="absolute inset-1.5 rounded-full bg-primary/40" />
        </div>
      </div>
      <svg viewBox="0 0 120 120" fill="none" aria-hidden="true" className="h-full w-full text-muted-foreground/60">
        <rect x="22" y="34" width="76" height="64" rx="10" className="fill-card" stroke="currentColor" strokeWidth="2.5" />
        <path d="M22 52h76" stroke="currentColor" strokeWidth="2.5" />
        <path d="M40 28v12M80 28v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M42 72c4 6 12 10 18 10s14-4 18-10" className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
        <circle cx="46" cy="64" r="2.5" className="fill-primary" />
        <circle cx="74" cy="64" r="2.5" className="fill-primary" />
        <path d="M10 104c10-4 90-4 100 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      </svg>
    </div>
  )
}

export function TeacherEmpty({
  illustration,
  title,
  hint,
  className,
  children,
}: {
  illustration: React.ReactNode
  title: string
  hint?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-foreground/80 bg-card/80 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="w-32">{illustration}</div>
      <p className="font-serif text-lg leading-snug">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}
