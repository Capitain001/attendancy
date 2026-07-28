import { GripVertical } from "lucide-react"

// components/ui/session-progress.tsx
interface SessionProgressProps {
  value: number       // 0–100
  label?: string
  sublabel?: string
  color?: string
}

export function SessionProgress({
  value,
  label,
  sublabel,
  color = "#F4607A",
}: SessionProgressProps) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}%</span>
        </div>
      )}
      <div
        className="relative h-9 rounded-full overflow-hidden border border-border"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(128,128,128,0.1) 5px, rgba(128,128,128,0.1) 10px)",
        }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full flex items-center justify-end transition-all duration-500"
          style={{ width: `${Math.max(value, 10)}%`, backgroundColor: color }}
        >
          <div className="w-8 h-8 rounded-full bg-background mr-0.5 flex items-center justify-center shrink-0">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>
      {sublabel && (
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      )}
    </div>
  )
}