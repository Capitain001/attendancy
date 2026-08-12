
"use client";

import { useState } from "react";

import { useProgramTracks } from "@/hooks/data/programTracks/useProgramTracks";
import { useDepartments } from "@/hooks/data/departments/useDepartments";

import { ProgramTrackDialog } from "../dialog/ProgramTrackDialog";
import type { ProgramTrackDto } from "@/services/program-track/types";
import ProgramTrackList from "../ui/ProgramTrackList";

export default function ProgramTrackPage() {
  // =====================
  // Data
  // =====================
  const {
    data,
    loading,
    error,
    delete: remove,
  } = useProgramTracks({ });

  const programTracks = data?.items ?? [];

  const {
    data: departmentsData,
    loading: departmentsLoading,
  } = useDepartments();

  const departments = departmentsData?.items ?? [];

  // =====================
  // UI State
  // =====================
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramTrackDto | undefined>();

  // =====================
  // Handlers
  // =====================
  const handleCreate = () => {
    setEditing(undefined);
    setOpen(true);
  };

  const handleEdit = (track: ProgramTrackDto) => {
    setEditing(track);
    setOpen(true);
  };

  // =====================
  // Render
  // =====================
  if (loading || departmentsLoading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erreur de chargement</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Programmes</h1>

        <button
          onClick={handleCreate}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Nouveau programme
        </button>
      </div>

      {/* List */}
      {/* <ProgramTrackList programTracks={programTracks} /> */}

      {/* Dialog */}
      {editing && (
        <ProgramTrackDialog
          open={open}
          onOpenChange={setOpen}
          programTrack={editing}
          departments={departments}
          onUpdate={async (data)=>{}}
          onDelete={async ()=>{}}
        />
      )}
    </div>
  );
}
