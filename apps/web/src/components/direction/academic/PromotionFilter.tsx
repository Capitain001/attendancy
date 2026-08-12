import { Search } from 'lucide-react'
import { input } from '@/styles'
import { LEVEL_LABEL } from '@/services/class/constants'

export type ProgramTrack = { id: string; name: string }

interface PromotionFilterProps {
  query: string
  setQuery: (q: string) => void
  trackId: string
  setTrackId: (id: string) => void
  level: string
  setLevel: (lvl: string) => void
  programTracks: ProgramTrack[]
}

export function PromotionFilter({
  query,
  setQuery,
  trackId,
  setTrackId,
  level,
  setLevel,
  programTracks,
}: PromotionFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher une promotion..."
          className={`${input.base} pl-9 w-full`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="flex flex-end max-w-[400px] gap-2">
        <select
          className={input.base}
          value={trackId}
          onChange={(e) => setTrackId(e.target.value)}
        >
          <option value="">Toutes les filières</option>
          {programTracks.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          className={input.base}
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="">Tous niveaux</option>
          {Object.entries(LEVEL_LABEL).map(([key, val]) => (
            <option key={key} value={key}>{val}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
