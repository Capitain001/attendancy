"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { ProgramForm } from "../form/ProgramForm";
import { usePrograms } from "@/hooks/data/programs/usePrograms";
import type { GetProgramsDto } from "@/services/program/types";
import type { GetProgramTracksItem } from "@/services/program-track/types";
import { SelectProgramTrack } from "@/components/program-tracks/ui/SelectProgramTrack";
// import { SelectProgramTrack } from "@/components/program-tracks/ui/SelectProgramTrack";

interface ProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: GetProgramsDto[number];
  classId?: string;
  programTrackId?: string;
  programTracks?: NonNullable<GetProgramTracksItem>[];
}

export function ProgramDialog({
  open,
  onOpenChange,
  program,
  classId,
  programTrackId,
  programTracks,
}: ProgramDialogProps) {
  const { create, update, loading } = usePrograms({
    classId,
    enabled: false,
  });

  const [selectedProgramTrackId, setSelectedProgramTrackId] = useState(
    program?.programTrack?.id ?? programTrackId ?? ""
  );

  useEffect(() => {
    if (!program) {
      setSelectedProgramTrackId(programTrackId ?? "");
    }
  }, [program, programTrackId]);

  const isEdit = !!program;

  const handleSubmit = async (data: {
    name: string;
    description?: string | null;
  }) => {
    if (!isEdit && !selectedProgramTrackId) {
      toast.error("Veuillez sélectionner un parcours");
      return;
    }

    const payload = {
      name: data.name,
      description: data.description ?? undefined,
    };

    if (isEdit && program) {
      if (!update) {
        throw new Error("Fonction de mise à jour non disponible");
      }
      await update({
        id: program.id,
        data: payload,
      });
    } else {
      if (!create) {
        throw new Error("Fonction de création non disponible");
      }
      await create({
        ...payload,
        classId,
        programTrackId: selectedProgramTrackId,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le programme" : "Créer un programme"}
          </DialogTitle>
        </DialogHeader>

        {!program && programTracks && (
          <div className="space-y-2 pb-4">
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Parcours <span className="text-destructive">*</span>
            </label>
            <SelectProgramTrack
              programTracks={programTracks}
              value={selectedProgramTrackId}
              onChange={setSelectedProgramTrackId}
              placeholder="Sélectionner un parcours"
              className="w-full"
            />
          </div>
        )}

        <ProgramForm
          program={program}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={loading}
        />
      </DialogContent>
    </Dialog>
  );
}
