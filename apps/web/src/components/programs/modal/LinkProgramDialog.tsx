"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SelectProgram } from "../ui/SelectProgram";
import { linkProgramToClassAction } from "@/services/program/actions";
import type { GetProgramsDto } from "@/services/program/types";

interface LinkProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  programs: GetProgramsDto;
}

export function LinkProgramDialog({
  open,
  onOpenChange,
  classId,
  programs,
}: LinkProgramDialogProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedProgramId) {
      toast.error("Veuillez sélectionner un programme");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await linkProgramToClassAction({
        classId,
        programId: selectedProgramId,
      });

      if ("error" in res && res.error) {
        toast.error(
          typeof res.error === "string"
            ? res.error
            : "Erreur lors de l'association du programme"
        );
        return;
      }

      toast.success("Programme associé avec succès");
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to link program:", err);
      toast.error("Une erreur est survenue lors de l'association.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Associer un programme</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Sélectionnez le programme d'études à associer à cette promotion.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Programme <span className="text-destructive">*</span>
            </label>
            <SelectProgram
              programs={programs}
              value={selectedProgramId}
              onChange={setSelectedProgramId}
              placeholder="Sélectionner un programme..."
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedProgramId || isSubmitting}
          >
            {isSubmitting ? "Association..." : "Associer le programme"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
