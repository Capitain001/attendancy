// src/components/personal/teacher/ui/RemainingCircle.tsx
type Props = {
  /** `count.remaining` : séances ONGOING + PENDING (en cours incluse). */
  count: number
}

export function RemainingCircle({ count }: Props) {
  return (
    <div className="relative flex size-40 items-center justify-center rounded-full bg-muted">
      {/* Bordure SVG personnalisée */}
      <svg className="absolute inset-0 size-full -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="48%"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          /* 6px de tiret, 6px d'espace */
          strokeDasharray="6 6"
          className="text-muted-foreground/50"
        />
      </svg>

      <p className="text-6xl font-light tabular-nums text-foreground">
        {String(count).padStart(2, '0')}
        <span className="sr-only"> cours restants</span>
      </p>
    </div>
  )
}