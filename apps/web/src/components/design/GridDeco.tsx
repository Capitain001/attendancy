import { GridPattern } from '@/components/ui/grid-pattern'

export function GridDeco() {
  return (
    <div aria-hidden className="pointer-events-none absolute dark:opacity-30 inset-0 [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/5 to-foreground/2 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
        <GridPattern
          width={22} height={22} x={-12} y={4}
          strokeDasharray="3"
          className="stroke-foreground/20 absolute inset-0 h-full w-full mix-blend-overlay"
        />
      </div>
    </div>
  )
}
