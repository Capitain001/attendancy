// src/components/programs/section/ProgramTable.tsx
"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProgramViewer } from "./program-viewer";
import { ConfirmationDialog } from "../ui/ConfirmationDialog";
import { OrgUEDTO, ProgramTable as ProgramTableType } from "@/services/ue/types";
import { GetDepartmentsDto } from "@/services/department/types";
import { useProgramTable } from "@/hooks/data/programs/useProgramTable";
import { useProgramActions } from "@/hooks/data/programs/useProgramActions";
import { useProgramDnd } from "@/hooks/data/programs/useProgramDnd1";
import { useProgramReorder } from "@/hooks/data/programs/useProgramReorder";
import { CACHE_KEYS } from "@/config/client_cache";

interface ProgramTableProps {
  programId: string;
  allUes: OrgUEDTO;
  departments: GetDepartmentsDto;
  slug: string;
  classId: string;
  isEditing?: boolean;
}

export default function ProgramTable({
  programId,
  allUes,
  departments,
  slug,
  classId,
  isEditing = false,
}: ProgramTableProps) {
  const { program, availableUes, isLoading, error } = useProgramTable(programId, allUes);
  const queryClient = useQueryClient();
  const onProgramChange = useCallback(
    (updater: (prev: ProgramTableType) => ProgramTableType) => {
      queryClient.setQueryData<ProgramTableType>(
        CACHE_KEYS.PROGRAMS.BY_ID(programId),
        (prev) => updater(prev ?? [])
      );
    },
    [queryClient, programId]
  );
  const dnd = useProgramDnd(program, onProgramChange);
  const reorder = useProgramReorder({ programId, program });

  const {
    createUE,
    linkUE,
    createCourse,
    requestRemoveCourse,
    deleteDialogOpen,
    onDeleteDialogChange,
    confirmRemoveCourse,
  } = useProgramActions({ programId, classId });

  return (
    <div>
      {isLoading && <p>Chargement du programme...</p>}
      {error && !isLoading && (
        <p className="text-red-500 text-sm">
          Erreur lors du chargement du programme: {error.message}
        </p>
      )}

      <ProgramViewer
        programId={programId}
        program={program}
        availableUes={availableUes}
        departments={departments}
        onCreateUE={createUE}
        onLinkUE={linkUE}
        onCreateCourse={createCourse}
        onRemoveCourse={requestRemoveCourse}
        dnd={dnd}
        isEditing={isEditing}
      />

      {reorder.isDirty && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            type="button"
            disabled={reorder.status === "saving"}
            onClick={reorder.save}
            className={[
              "rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition-colors",
              reorder.status === "saving"
                ? "cursor-not-allowed bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            ].join(" ")}
          >
            {reorder.status === "saving" ? "Enregistrement…" : "Enregistrer la disposition"}
          </button>
        </div>
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={onDeleteDialogChange}
        title="Supprimer le cours"
        description="Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible."
        confirmLabel="Supprimer"
        onConfirm={confirmRemoveCourse}
        variant="destructive"
      />
    </div>
  );
}
