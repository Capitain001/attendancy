"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProgramTrackForm } from "../form/ProgramTrackForm";
import { addProgramTrackAction } from "@/services/program-track/actions";
import type { AddProgramTrackData, UpdateProgramTrackData } from "@/services/program-track/database";
import { toast } from "sonner";
import { revalidateAction } from "@/lib/revalidate";
import { DepartmentDto } from "@/services/department/types";

interface AddProgramTrackProps {
  departments: DepartmentDto[];
  slug: string; 
}

export function AddProgramTrack({ departments, slug }: AddProgramTrackProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (data: UpdateProgramTrackData) => {
    setIsLoading(true);
    try {
      // Convert UpdateProgramTrackData to AddProgramTrackData
      if (!data.name || !data.departmentId) {
        toast.error("Le nom et le département sont requis");
        return;
      }
      
      await addProgramTrackAction({
        name: data.name,
        departmentId: data.departmentId
      });
      await revalidateAction({path:"direction/program-track", slug})
      toast.success("Filière créée avec succès");
      setOpen(false);
     
    } catch (err) {
      toast.error("Une erreur est survenue lors de la création");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nouvelle filière
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une nouvelle filière</DialogTitle>
        </DialogHeader>

        <ProgramTrackForm
          departments={departments}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
