'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { BookMarked } from 'lucide-react'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProgramEditButton } from '@/components/direction/academic/ProgramForm'
import { Button } from '@/components/ui/button'
import { useManagePrograms } from '@/hooks/data/program/useManagePrograms'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { GetProgramsDto } from '@/services/program'
import type { GetProgramTracksDto } from '@/services/program-track'
import { Lock, Unlock } from "lucide-react";


type ProgramItem = GetProgramsDto[number]
type TrackItem = NonNullable<GetProgramTracksDto>[number]

function ProgramRow({
  program,
  tracks,
}: {
  program: ProgramItem
  tracks: TrackItem[]
}) {
  const { remove } = useManagePrograms()
  const params = useParams<{ slug: string }>()
  const slug = params?.slug ?? ''

  return (
    <div className={cn(card.base, 'flex items-center gap-3')}>
      <BookMarked className="size-4 shrink-0 text-primary" strokeWidth={1.5} />

      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <Link
          href={`/${slug}/direction/academic/programs/${program.id}`}
          className="text-sm font-medium text-text-primary hover:text-primary transition-colors truncate"
        >
          {program.name}
        </Link>
        {program.programTrack && (
          <span className={typography.small}>{program.programTrack.name}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {program.isLocked && (
          <span className="rounded-sm  border border-dashed  px-1.5 py-1 text-[9px] font-medium ">
            <Lock className="size-4" />
            
          </span>
        )}
        {!program.isActive && (
          <span className="rounded-sm bg-muted border border-dashed border-muted-foreground/30 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
            Desactiver
          </span>
        )}
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          {program.classes.length} classe{program.classes.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <ProgramEditButton
          id={program.id}
          name={program.name}
          description={program.description}
          programTrackId={program.programTrack?.id}
          tracks={tracks}
        />
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="sm"
              disabled={program.classes.length > 0}
              className="text-xs text-destructive hover:text-destructive disabled:opacity-40"
              title={
                program.classes.length > 0
                  ? 'Dissociez les classes avant de supprimer'
                  : undefined
              }
            >
              Supprimer
            </Button>
          }
          title={`Supprimer "${program.name}" ?`}
          description="Le programme sera supprimé définitivement."
          confirmLabel="Supprimer"
          destructive
          onConfirm={() => remove.mutate(program.id)}
        />
      </div>
    </div>
  )
}

export function ProgramList({
  initialPrograms,
  tracks,
}: {
  initialPrograms: ProgramItem[]
  tracks: TrackItem[]
}) {
  const { programs, isLoading } = useManagePrograms()
  const data = programs.length > 0 ? programs : initialPrograms

  return (
    <CollapseSection label="Programmes" count={data.length} defaultOpen>
      {isLoading && data.length === 0 ? (
        <p className={typography.small}>Chargement…</p>
      ) : data.length === 0 ? (
        <div className="py-8 text-center">
          <BookMarked className="mx-auto mb-2 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucun programme créé.</p>
          <p className={typography.small}>Créez le premier pour commencer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((p) => (
            <ProgramRow key={p.id} program={p} tracks={tracks} />
          ))}
        </div>
      )}
    </CollapseSection>
  )
}
