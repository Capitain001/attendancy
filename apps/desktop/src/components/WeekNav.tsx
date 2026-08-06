type Props = {
  label: string
  onPrev: () => void
  onNext: () => void
  canNext: boolean
}

export function WeekNav({ label, onPrev, onNext, canNext }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Semaine précédente"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <span className="min-w-[160px] text-center text-sm font-medium text-foreground">
        {label}
      </span>

      <button
        onClick={onNext}
        disabled={!canNext}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
        aria-label="Semaine suivante"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
