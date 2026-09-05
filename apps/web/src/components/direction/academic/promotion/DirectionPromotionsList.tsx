"use client";

import { useState } from "react";

import { CollapseSection } from "@/components/layout/CollapseSection";
import { useClasses } from "@/hooks/data/classes/useClasses";

import { PromotionList } from "./PromotionList";
import { ProgramTrack } from "./PromotionFilter";
import { SelectYear } from "../year/SelectYear";
import { GetClassesDto } from "@/services/class";

type YearDTO = {
  id: string;
  name: string;
  isCurrent: boolean;
};

interface DirectionPromotionsListProps {
  initialClasses: GetClassesDto;
  programTracks?: ProgramTrack[];
  years?: YearDTO[];
  currentYearId?: string;
}

export function DirectionPromotionsList({
  initialClasses,
  programTracks = [],
  years = [],
  currentYearId,
}: DirectionPromotionsListProps) {
  const defaultYearId = currentYearId ?? years.find((y) => y.isCurrent)?.id ?? years[0]?.id;
  const [yearId, setYearId] = useState<string | undefined>(defaultYearId);

  const { data: { items : classes = [] } = {}, loading: isLoading } = useClasses({
    yearId: yearId || undefined,
  });

  const rows = classes.length > 0 || !isLoading ? classes : initialClasses;

  return (
    <div className="flex flex-col gap-y-4">
      {/* Barre : année */}
      <div className="flex items-center justify-between gap-3">
        <SelectYear years={years} selectedYearId={yearId} onChange={setYearId} />
      </div>

      {/* Liste des promotions */}
      <CollapseSection label="Promotions" count={rows.length} defaultOpen>
        <PromotionList data={rows} isLoading={isLoading} programTracks={programTracks} />
      </CollapseSection>
    </div>
  );
}
