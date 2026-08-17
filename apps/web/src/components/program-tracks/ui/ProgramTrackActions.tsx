"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";


import { updateProgramTrackAction, removeProgramTrackAction } from "@/services/program-track/actions";
import type { ProgramTrackDto } from "@/services/program-track/types";
import { ProgramTrackDialog } from "../dialog/ProgramTrackDialog";
import { UpdateProgramTrackData } from "@/services/program-track/database";
import { Edit, Trash } from "lucide-react";

interface ProgramTrackActionsProps {
  programTrack: ProgramTrackDto;
  departments: Array<{ id: string; name: string }>;
}

export function ProgramTrackActions({
  programTrack,
  departments,
}: ProgramTrackActionsProps) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  /* UPDATE */
  const handleUpdate = async (data: UpdateProgramTrackData) => {
    setLoading(true);

    const res = await updateProgramTrackAction(programTrack.id, data);

    setLoading(false);

    if (!res?.error) {
      setOpenEdit(false);
    }
  };

  /* DELETE */
  const handleDelete = async () => {
    setLoading(true);
    setOpenDelete(true);
    const res = await removeProgramTrackAction(programTrack.id);

    setLoading(false);

    if (!res?.error) {
      setOpenDelete(false);
    }
  };

  return (
    <>
      {/* Buttons */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpenEdit(true)}>
          <Edit size={14} />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="hover:opacity-75"
          onClick={() => setOpenDelete(true)}
        >
              <Trash size={14} />
        </Button>
      </div>

      {/* Edit dialog */}
      <ProgramTrackDialog
        open={openEdit}
        onOpenChange={setOpenEdit}
        programTrack={programTrack}
        departments={departments}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      {/* Delete confirmation */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer la filière ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              La filière <strong>{programTrack.name}</strong> sera supprimée
              définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Suppression..." : "Supprimer"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
