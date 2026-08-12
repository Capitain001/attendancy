'use client';

import { SemesterTable } from "./semester-table";
import { CreateUEDialog } from "./create-ue-dialog";
import { ProgramTable, OrgUEDTO } from "@/services/ue/types";
import { GetDepartmentsDto } from "@/services/department/types";
import {
  CreateUEInput,
  LinkUEInput,
  CreateUECourseInput,
} from "@/services/ue/validation";
import type { useProgramDnd } from "@/hooks/data/programs/useProgramDnd1";

interface ProgramViewerProps {
  programId: string;
  program: ProgramTable;
  availableUes: OrgUEDTO;
  departments: GetDepartmentsDto;
  onRefresh?: () => void;
  onCreateUE: (
    data: CreateUEInput
  ) => Promise<{ success: boolean; error?: string; data?: unknown }>;
  onLinkUE: (
    data: LinkUEInput
  ) => Promise<{ success: boolean; error?: string }>;
  onCreateCourse: (
    data: CreateUECourseInput
  ) => Promise<{ success: boolean; error?: string }>;
  onRemoveCourse: (
    ueCourseId: string
  ) => Promise<{ success: boolean; error?: string }>;
  dnd: ReturnType<typeof useProgramDnd>;
  isEditing?: boolean;
}

export function ProgramViewer({
  programId,
  program,
  availableUes,
  departments,
  onRefresh,
  onCreateUE,
  onLinkUE,
  onCreateCourse,
  onRemoveCourse,
  dnd,
  isEditing = false,
}: ProgramViewerProps) {

  // Affichons ici tous les semestres dans le programme, plus le prochain vide
  const maxSemester = program.length > 0
    ? Math.max(...program.map(p => p.semester))
    : 0;

  const semestersToShow = Array.from({ length: Math.max(maxSemester + 1, 2) }, (_, i) => i + 1);

  return (
    <div className="space-y-12">
      {semestersToShow.map((semester) => {
        const semesterData = program.find(p => p.semester === semester);
        const semesterUEs = semesterData?.ues || [];
        const linkedUEIds = semesterUEs.map((u) => u.ue.id);

        return (
          <div key={semester} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold uppercase tracking-wider text-primary/80">
                SEMESTRE {semester}
              </h2>
              {isEditing && (
                <CreateUEDialog
                  programId={programId}
                  semester={semester}
                  allUes={availableUes}
                  departments={departments}
                  linkedUEIds={linkedUEIds}
                  onCreateUE={onCreateUE}
                  onLinkUE={onLinkUE}
                />
              )}
            </div>

            {semesterUEs.length > 0 ? (
              <SemesterTable
                semester={semester}
                ues={semesterUEs}
                onCreateCourse={onCreateCourse}
                onRemoveCourse={onRemoveCourse}
                dnd={dnd}
                isEditing={isEditing}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center text-muted-foreground">
                Aucune UE pour ce semestre
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
