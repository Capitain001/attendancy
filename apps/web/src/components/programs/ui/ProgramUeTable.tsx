//src/components/programs/ui/ProgramUeTable.tsx
"use client";

import { ProgramLabel } from "./ProgramLabel";
import { ProgramUeList } from "./ProgramUeList";
import { AddProgramUe } from "./AddProgramUe";
import type { CreateUeData, UpdateUEData } from "@/services/ue/database";
import type { OrgUEDTO, ProgramTable } from "@/services/ue/types";

interface ProgramUeTableProps {
  program: ProgramTable;
  availableUes: OrgUEDTO;
  departments: { id: string; name: string }[];
  loadingIds?: string[];
  onCreate: (data: CreateUeData) => Promise<void>;
  onEdit: (ueId: string, data: UpdateUEData) => Promise<void>;
  onDelete: (ueId: string) => Promise<void>;
  onDetach: (ueId: string) => Promise<void>;
  onAttach: (ueId: string) => Promise<void>;
}

export function ProgramUeTable({
  availableUes,
  program,
  departments,
  loadingIds = [],
  onCreate,
  onEdit,
  onDelete,
  onDetach,
  onAttach,
}: ProgramUeTableProps) {
  return (
    <div className="space-y-6">
      {program.map((semester) => (
        <div key={semester.semester} className="space-y-2 border-2 bg-pattern-cross min-h-72 p-4 rounded overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className=" font-bold uppercase tracking-wider text-primary/50">
              Semestre {semester.semester}
            </h3>
          </div>

          <ProgramLabel />
          <ProgramUeList
            ues={semester.ues}
            departments={departments}
            loadingIds={loadingIds}
            onEdit={onEdit}
            onDelete={onDelete}
            onDetach={onDetach}
          />

          {/* TOTAL SEMESTRE ROW */}
          <div className="flex items-center gap-2 p-2 bg-muted/30 font-bold border-t-2 mt-2">
            <div className="flex-1 text-right px-4 uppercase text-sm tracking-widest text-muted-foreground">
              Total Semestre {semester.semester}
            </div>
            <div className="w-24 md:w-32 text-center text-primary">
              {semester.totalDuration} H
            </div>
            <div className="w-12 md:w-20 text-center text-primary">
              {semester.totalCredits}
            </div>
          </div>
        </div>
      ))}

      <div className=" rounded bg-muted/20">
        <AddProgramUe
          availableUes={availableUes}
          departments={departments}
          onCreate={onCreate}
          onAttach={onAttach}
        />
      </div>
    </div>
  );
}
