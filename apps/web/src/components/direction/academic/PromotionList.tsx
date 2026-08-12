'use client'
import { useState } from 'react'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { useManageClasses } from '@/hooks/data/class/useManageClasses'
import { useDebounce } from '@/hooks/use-debounce'
import { PromotionFilter, ProgramTrack } from './PromotionFilter'
import { PromotionTable, PromotionRow } from './PromotionTable'

export function PromotionList({ 
  initialClasses,
  programTracks = [],
  currentYearId
}: { 
  initialClasses: PromotionRow[],
  programTracks?: ProgramTrack[],
  currentYearId?: string
}) {
  const [query, setQuery] = useState('')
  const [trackId, setTrackId] = useState('')
  const [level, setLevel] = useState('')

  const debouncedQuery = useDebounce(query, 300)

  const { classes, isLoading } = useManageClasses(currentYearId, debouncedQuery, trackId)
  
  // If we have filters active or we fetched data, use `classes`. Otherwise fallback to `initialClasses`.
  const baseData = (debouncedQuery || trackId || classes.length > 0) ? (classes as PromotionRow[]) : initialClasses
  
  // Client-side level filtering
  const data = level ? baseData.filter(c => c.level === level) : baseData

  return (
    <CollapseSection label="Promotions" count={data.length} defaultOpen>
      <PromotionFilter 
        query={query} 
        setQuery={setQuery}
        trackId={trackId}
        setTrackId={setTrackId}
        level={level}
        setLevel={setLevel}
        programTracks={programTracks}
      />
      <PromotionTable 
        data={data} 
        isLoading={isLoading} 
      />
    </CollapseSection>
  )
}
