import { BackgroundPattern } from '@/components/design/BackgroundPattern'

interface CourseBannerProps {
  course: {
    id: string
    name: string
    credits: number
    ueCourse: { code: string | null }
    class: { name: string }
  }
}

export function CourseBanner({ course }: CourseBannerProps) {
  return (
    <div className="relative overflow-hidden flex flex-col justify-between bg-card border rounded-2xl p-5 h-40 md:h-44 transition-all duration-300">
      <BackgroundPattern pattern="pattern-noise" className="opacity-70 dark:opacity-60" />

      <div className="relative z-10 flex items-center justify-between">
        <span className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
          {course.ueCourse.code ?? '—'}
        </span>
      </div>

      <div className="relative z-10">
        <h1 className="text-xl md:text-2xl font-semibold leading-snug line-clamp-2">
          {course.name}
        </h1>
      </div>

      <div className="relative z-10 flex items-end justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold tabular-nums leading-none">{course.credits}</span>
          <span className="text-xs text-muted-foreground leading-none mt-1">crédits</span>
        </div>
        <span className="text-[10px] text-muted-foreground/50 font-mono">{course.class.name}</span>
      </div>
    </div>
  )
}
