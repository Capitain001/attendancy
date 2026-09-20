'use client'

interface GhostEmptyEvaluationsProps {
  title?: string
  description?: string
}

export function GhostEmptyEvaluations({
  title = 'Aucune évaluation programmée',
  description = 'Les devoirs, examens et notes de ce cours apparaîtront ici.',
}: GhostEmptyEvaluationsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-foreground/15 px-6 py-16 text-center">
      <svg
        width="140"
        height="104"
        viewBox="0 0 140 104"
        fill="none"
        className="text-foreground"
      >
        {/* row 1 — closest to "real", highest opacity */}
        <rect
          x="10"
          y="8"
          width="120"
          height="26"
          rx="8"
          fill="currentColor"
          fillOpacity="0.08"
        />
        <rect
          x="10"
          y="8"
          width="120"
          height="26"
          rx="8"
          stroke="currentColor"
          strokeOpacity="0.12"
        />
        <circle cx="20" cy="21" r="3" fill="currentColor" fillOpacity="0.2" />
        <line
          x1="28"
          y1="18"
          x2="74"
          y2="18"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="24"
          x2="52"
          y2="24"
          stroke="currentColor"
          strokeOpacity="0.09"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="90"
          y1="21"
          x2="118"
          y2="21"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* row 2 — fading */}
        <rect
          x="10"
          y="39"
          width="120"
          height="26"
          rx="8"
          fill="currentColor"
          fillOpacity="0.05"
        />
        <circle cx="20" cy="52" r="3" fill="currentColor" fillOpacity="0.12" />
        <line
          x1="28"
          y1="49"
          x2="68"
          y2="49"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="55"
          x2="46"
          y2="55"
          stroke="currentColor"
          strokeOpacity="0.06"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="92"
          y1="52"
          x2="114"
          y2="52"
          stroke="currentColor"
          strokeOpacity="0.08"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* row 3 — nearly gone */}
        <rect
          x="10"
          y="70"
          width="120"
          height="26"
          rx="8"
          fill="currentColor"
          fillOpacity="0.03"
        />
        <circle cx="20" cy="83" r="3" fill="currentColor" fillOpacity="0.06" />
        <line
          x1="28"
          y1="80"
          x2="60"
          y2="80"
          stroke="currentColor"
          strokeOpacity="0.06"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="94"
          y1="83"
          x2="110"
          y2="83"
          stroke="currentColor"
          strokeOpacity="0.04"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* the one quiet "empty" marker, centered over the stack */}
        <circle
          cx="70"
          cy="52"
          r="16"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeDasharray="3 4"
        />
      </svg>

      <div className="grid gap-1">
        <p className="text-sm font-medium text-foreground/70">{title}</p>
        <p className="text-xs text-foreground/40">{description}</p>
      </div>
    </div>
  )
}
