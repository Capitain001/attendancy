'use client'
import { School } from 'lucide-react'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProgramTrackEditButton } from '@/components/direction/academic/ProgramTrackForm'
import { Button } from '@/components/ui/button'
import { useManageProgramTracks } from '@/hooks/data/program-track/useManageProgramTracks'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { GetProgramTracksDto } from '@/services/program-track'
import type { DepartmentItem } from '@/services/department'

type ProgramTrackItem = NonNullable<GetProgramTracksDto>[number]

function ProgramTrackRow({
  track,
  departments,
}: {
  track: ProgramTrackItem
  departments: DepartmentItem[]
}) {
  const { remove } = useManageProgramTracks()

  return (
    <div className={cn(card.base, 'flex items-center gap-3')}>
      <School className="size-4 shrink-0 text-primary" strokeWidth={1.5} />

      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <span className="text-sm font-medium text-text-primary">{track.name}</span>
        {track.department && (
          <span className={typography.small}>{track.department.name}</span>
        )}
      </div>

      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
        {track._count.classes} classe{track._count.classes !== 1 ? 's' : ''}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <ProgramTrackEditButton
          id={track.id}
          name={track.name}
          departmentId={track.department?.id}
          departments={departments}
        />
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="sm"
              disabled={track._count.classes > 0}
              className="text-xs text-destructive hover:text-destructive disabled:opacity-40"
              title={
                track._count.classes > 0
                  ? "Archivez d'abord les classes associées"
                  : undefined
              }
            >
              Supprimer
            </Button>
          }
          title={`Supprimer "${track.name}" ?`}
          description="La filière sera supprimée définitivement."
          confirmLabel="Supprimer"
          destructive
          onConfirm={() => remove.mutate(track.id)}
        />
      </div>
    </div>
  )
}

export function ProgramTrackList({
  initialTracks,
  departments,
}: {
  initialTracks: ProgramTrackItem[]
  departments: DepartmentItem[]
}) {
  const { tracks, isLoading } = useManageProgramTracks()
  const data = tracks.length > 0 ? tracks : initialTracks

  return (
    <CollapseSection label="Filières" count={data.length} defaultOpen>
      {isLoading && data.length === 0 ? (
        <p className={typography.small}>Chargement…</p>
      ) : data.length === 0 ? (
        <div className="py-8 text-center">
          <School className="mx-auto mb-2 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucune filière créée.</p>
          <p className={typography.small}>Créez la première pour commencer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((t) => (
            <ProgramTrackRow key={t.id} track={t} departments={departments} />
          ))}
        </div>
      )}
    </CollapseSection>
  )
}
