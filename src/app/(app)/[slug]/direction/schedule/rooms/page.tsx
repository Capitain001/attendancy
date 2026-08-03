import { connection } from 'next/server'
import { getRoomsAction } from '@/services/room'
import { typography, card } from '@/styles'
import { cn } from '@/lib/utils'
import { Container, MapPin } from 'lucide-react'

export default async function RoomsPage() {
  await connection()
  const result = await getRoomsAction()

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  const rooms = result.data

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Salles</h1>
        <span className={typography.small}>{rooms.length} salle{rooms.length !== 1 ? 's' : ''}</span>
      </div>

      {rooms.length === 0 ? (
        <div className={cn(card.soft, 'py-12 text-center')}>
          <Container className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucune salle enregistrée.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <div key={r.id} className={cn(card.base, 'flex flex-col gap-2')}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-text-primary">{r.name}</span>
                {r.capacity != null && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                    {r.capacity} pl.
                  </span>
                )}
              </div>
              {r.location && (
                <span className={cn(typography.small, 'flex items-center gap-1')}>
                  <MapPin className="size-3" />
                  {r.location.name}
                </span>
              )}
              {r.equipment && r.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(r.equipment as string[]).map((eq, i) => (
                    <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-text-subtle">
                      {eq}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
