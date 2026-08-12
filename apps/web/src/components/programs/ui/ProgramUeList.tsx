"use client";

import type { UpdateUEData } from "@/services/ue/database";
import { ProgramUe } from "./ProgramUe";
import type { ProgramUECourses } from "@/services/ue/types";

interface ProgramUeListProps {
  ues: ProgramUECourses[];
  departments: { id: string; name: string }[];
  loadingIds?: string[];
  onEdit: (ueId: string, data: UpdateUEData) => Promise<void>;
  onDelete: (ueId: string) => Promise<void>;
  onDetach: (ueId: string) => Promise<void>;
}

export function ProgramUeList({
  ues,
  departments,
  loadingIds = [],
  onEdit,
  onDelete,
  onDetach,
}: ProgramUeListProps) {

  const {} = ues;
  return (
    <>
      {ues.map((pu) => (
        
        <ProgramUe
          key={pu.ue.id}
          ue={pu.ue}
          departments={departments}
          loading={loadingIds.includes(pu.ue.id)}
          onEdit={onEdit}
          onDelete={onDelete}
          onDetach={onDetach}
        />
        
      ))}
    </>
  );
}
