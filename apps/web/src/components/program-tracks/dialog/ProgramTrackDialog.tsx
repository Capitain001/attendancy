"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ProgramTrackForm } from "../form/ProgramTrackForm";
import type { ProgramTrackDto } from "@/services/program-track/types";
import type { UpdateProgramTrackData } from "@/services/program-track/database";

interface ProgramTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programTrack: ProgramTrackDto;
  departments: Array<{ id: string; name: string }>;
  onUpdate: (data: UpdateProgramTrackData) => Promise<void>;
  onDelete: () => Promise<void>;
  isLoading?: boolean;
}

export function ProgramTrackDialog({
  open,
  onOpenChange,
  programTrack,
  departments,
  onUpdate,
  onDelete,
  isLoading = false,
}: ProgramTrackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le programme</DialogTitle>
        </DialogHeader>

        <ProgramTrackForm
          programTrack={programTrack}
          departments={departments}
          onSubmit={onUpdate}
          onDelete={onDelete}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
