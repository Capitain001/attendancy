'use client'

import { useState } from 'react'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { useClasses } from '@/hooks/data/classes/useClasses'
import { PromotionFilter, ProgramTrack } from './PromotionFilter'
import { PromotionTable } from './promotion/PromotionTable'
import { GetClassesDto } from '@/services/class'

type YearDTO = {
  id: string;
  name: string;
  isCurrent: boolean;
};

export function PromotionList({ 
  initialClasses, 
  programTracks = [], 
  years = [], 
  currentYearId 
}: { 
  initialClasses: GetClassesDto; 
  programTracks?: ProgramTrack[]; 
  years?: YearDTO[]; 
  currentYearId?: string 
}) {
  const [query, setQuery] = useState('')
  const [trackId, setTrackId] = useState('')
  const [level, setLevel] = useState('')
  
  const defaultYearId = currentYearId ?? years.find(y => y.isCurrent)?.id ?? years[0]?.id;
  const [yearId, setYearId] = useState<string | undefined>(defaultYearId)

  const { data: { items: classes = [] } = {}, loading: isLoading } = useClasses({
    yearId: yearId || undefined,
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
      <PromotionFilter 
        query={query} 
        setQuery={setQuery} 
        trackId={trackId} 
        setTrackId={setTrackId} 
        level={level} 
        setLevel={setLevel} 
        programTracks={programTracks} 
        yearId={yearId}
        setYearId={setYearId}
        years={years}
      />
      <PromotionTable data={rows} isLoading={isLoading} />
    </CollapseSection>
  )
}