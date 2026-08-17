'use client'
import { MapPin, Container } from 'lucide-react'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useRooms } from '@/hooks/data/rooms/useRooms'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

type RoomItem = {
  id: string
  name: string
  capacity: number | null
  equipment: unknown
  location: { name: string } | null
}

function RoomRow({ room }: { room: RoomItem }) {
  const rooms = useRooms()
  const remove = rooms.delete
  const isDeleting = rooms.isDeleting

  return (
    <div className={cn(card.base, 'flex items-center gap-3')}>
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{room.name}</span>
          {room.capacity != null && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-text-secondary">
              {room.capacity} pl.
            </span>
          )}
        </div>
        {room.location && (
          <span className={cn(typography.small, 'flex items-center gap-1')}>
            <MapPin className="size-3" />
            {room.location.name}
          </span>
        )}
        {Array.isArray(room.equipment) && room.equipment.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {(room.equipment as string[]).map((eq, i) => (
              <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-text-subtle">
                {eq}
              </span>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        trigger={
          <Button
            variant="ghost"
            size="sm"
            disabled={isDeleting || !remove}
            className="shrink-0 text-xs text-destructive hover:text-destructive"
          >
            Retirer
          </Button>
        }
        title={`Retirer "${room.name}" ?`}
        description="La salle sera désactivée et ne sera plus disponible pour la planification."
        confirmLabel="Retirer"
        destructive
        onConfirm={() => {
          if (remove) void remove(room.id)
        }}
      />
    </div>
  )
}

export function RoomList({ initialRooms }: { initialRooms: RoomItem[] }) {
  const roomsHook = useRooms()
  const rooms = roomsHook.data?.items as RoomItem[] | undefined
  const isLoading = roomsHook.loading
  const data = rooms?.length ? rooms : initialRooms

  return (
    <CollapseSection label="Salles" count={data.length} defaultOpen>
      {isLoading && data.length === 0 ? (
        <p className={typography.small}>Chargement…</p>
      ) : data.length === 0 ? (
        <div className="py-8 text-center">
          <Container className="mx-auto mb-2 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucune salle enregistrée.</p>
          <p className={typography.small}>Ajoutez la première salle.</p>
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {data.map((r) => (
            <RoomRow key={r.id} room={r} />
          ))}
        </div>
      )}
    </CollapseSection>
  )
}
