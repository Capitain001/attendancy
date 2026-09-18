'use client'

interface EmptyScheduleProps {
  title?: string
  description?: string
}

export function EmptySchedule({
  title = 'Aucun cours',
  description = "Il n'y a rien de prévu pour le moment.",
}: EmptyScheduleProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-foreground/15 px-6 py-16 text-center">
      <svg
        width="140"
        height="104"
        viewBox="0 0 140 104"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-foreground"
      >
        {/* rangées "fantômes", qui s'estompent comme le fade du ScrollArea */}
        <rect x="10" y="8" width="120" height="26" rx="8" fill="currentColor" fillOpacity="0.08" />
        <rect x="10" y="8" width="120" height="26" rx="8" stroke="currentColor" strokeOpacity="0.12" />
        <line x1="34" y1="21" x2="96" y2="21" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
        <circle cx="112" cy="21" r="2" fill="currentColor" fillOpacity="0.15" />

        <rect x="10" y="39" width="120" height="26" rx="8" fill="currentColor" fillOpacity="0.05" />
        <line x1="34" y1="52" x2="88" y2="52" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
        <circle cx="104" cy="52" r="2" fill="currentColor" fillOpacity="0.1" />

        <rect x="10" y="70" width="120" height="26" rx="8" fill="currentColor" fillOpacity="0.03" />
        <line x1="34" y1="83" x2="80" y2="83" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
        <circle cx="96" cy="83" r="2" fill="currentColor" fillOpacity="0.06" />

        {/* marqueur "vide" par-dessus, discret */}
        <circle cx="70" cy="52" r="16" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 4" />
      </svg>

      <div className="grid gap-1">
        <p className="text-sm font-medium text-foreground/70">{title}</p>
        <p className="text-xs text-foreground/40">{description}</p>
      </div>
    </div>
  )
}