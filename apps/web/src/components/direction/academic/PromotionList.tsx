'use client'

import { useState } from 'react'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { useClasses } from '@/hooks/data/classes/useClasses'
import { PromotionFilter, ProgramTrack } from './PromotionFilter'
import { PromotionTable, PromotionRow } from './PromotionTable'

export function PromotionList({ initialClasses, programTracks = [], currentYearId }: { initialClasses: PromotionRow[]; programTracks?: ProgramTrack[]; currentYearId?: string }) {
  const [query, setQuery] = useState('')
  const [trackId, setTrackId] = useState('')
  const [level, setLevel] = useState('')

  const { data: { items: classes = [] } = {}, loading: isLoading } = useClasses({
    yearId: currentYearId,
  })

  const data = classes.filter((cls) => {
    const matchesName = !query || cls.name.toLowerCase().includes(query.toLowerCase())
    const matchesTrack = !trackId || cls.programTrackId === trackId
    const matchesLevel = !level || cls.level === level
    return matchesName && matchesTrack && matchesLevel
  })

  const rows = classes.length > 0 || !isLoading ? data : initialClasses

  return (
    <CollapseSection label="Promotions" count={rows.length} defaultOpen>
      <PromotionFilter query={query} setQuery={setQuery} trackId={trackId} setTrackId={setTrackId} level={level} setLevel={setLevel} programTracks={programTracks} />
      <PromotionTable data={rows} isLoading={isLoading} />
    </CollapseSection>
  )
}