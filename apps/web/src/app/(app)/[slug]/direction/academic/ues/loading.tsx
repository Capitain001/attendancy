import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeader } from '@/components/direction/SectionHeader'
import { card } from "@/styles"
import { cn } from "@/lib/utils"

export default function UEsLoading() {
  return (
    <div className="flex flex-col gap-y-4">
      {/* Bandeau placeholder */}
      <div className="p-0.5 w-full bg-muted rounded">
        <span className="w-1/2 mx-auto bg-primary rounded block text-center text-sm font-medium text-primary-foreground">
          LISTE DES UNITÉS D'ENSEIGNEMENT
        </span>
      </div>

      <SectionHeader
        title="Unités d'enseignement"
        action={<Skeleton className="h-9 w-28" />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-12 mt-1" />
            <Skeleton className="h-3 w-32 mt-2" />
          </div>
        ))}
      </section>

      <Skeleton className="h-4 w-full max-w-3xl" />
      <Skeleton className="h-4 w-1/2" />

      <div className="flex flex-col gap-6 mt-4">
        {/* Filtre + contrôles squelette */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>

        {/* Grille de cartes squelette (simulant un groupe de département par défaut) */}
        <div>
          <Skeleton className="h-5 w-48 mb-6 mt-2" />
          <div className="grid grid-cols-1 justify-items-center gap-x-3 gap-y-6 md:gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "relative flex h-[300px] w-full max-w-[280px] flex-col rounded-xs border border-border bg-card p-5 shadow-sm",
                  card.base
                )}
              >
                <Skeleton className="h-3 w-10 mt-1" />
                <Skeleton className="h-7 w-3/4 mt-4" />
                <Skeleton className="h-7 w-1/2 mt-1" />
                <Skeleton className="h-4 w-2/3 mt-5" />
                <div className="mt-auto flex items-center gap-2 border-t border-border/40 pt-3">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
