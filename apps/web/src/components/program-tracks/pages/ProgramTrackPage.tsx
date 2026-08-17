
"use client";

import { useState } from "react";

import { useManageProgramTracks } from "@/hooks/data/program-track/useManageProgramTracks";
import { useDepartments } from "@/hooks/data/departments/useDepartments";

import { ProgramTrackDialog } from "../dialog/ProgramTrackDialog";
import type { ProgramTrackDto } from "@/services/program-track/types";
import ProgramTrackList from "../ui/ProgramTrackList";

export default function ProgramTrackPage() {
  // =====================
  // Data
  // =====================
  const { tracks, isLoading, remove } = useManageProgramTracks();
  const { data: departmentsData, loading: departmentsLoading } = useDepartments();

  const programTracks = tracks;
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
  if (isLoading || departmentsLoading) {
    return <div>Chargement...</div>;
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
