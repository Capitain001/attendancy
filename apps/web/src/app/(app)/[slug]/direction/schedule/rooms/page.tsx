import { connection } from 'next/server'
import { getRoomsAction } from '@/services/room'
import { MetricCard } from '@/components/stats/ui/MetricCard'
import { SectionHeader } from '@/components/direction/SectionHeader'
import { RoomList } from '@/components/direction/rooms/RoomList'
import { RoomCreateButton } from '@/components/direction/rooms/RoomForm'
import { typography } from '@/styles'

export default async function RoomsPage() {
  await connection()
  const result = await getRoomsAction()

  if ('error' in result) {
    return <p className={typography.body}>{result.error}</p>
  }

  const rooms = result.data
  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity ?? 0), 0)

  return (
    <div className="flex flex-col gap-y-4">
      <SectionHeader
        title="Salles"
        action={<RoomCreateButton />}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard
          label="Salles disponibles"
          value={String(rooms.length)}
          sub="dans cet établissement"
        />
        <MetricCard
          label="Capacité totale"
          value={totalCapacity > 0 ? String(totalCapacity) : '—'}
          sub="places au total"
        />
      </section>

      <RoomList initialRooms={rooms} />
    </div>
  )
}
