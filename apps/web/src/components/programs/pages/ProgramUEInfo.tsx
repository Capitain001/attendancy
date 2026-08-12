"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  createUEAction,
  updateUEAction,
  removeUEAction,
  removeUEFromProgramAction,
  addUEToProgramAction,
  getProgramUEsTableAction
} from '@/services/ue/actions';
import type { CreateUeData, UpdateUEData } from '@/services/ue/database';
import { ProgramViewer } from '../section/program-viewer';
import { ProgramUELoader } from '@/components/organization/loader';
import { OrgUEDTO, ProgramTable } from '@/services/ue/types';
import { useMemo } from 'react';
import { DepartmentDto } from '@/services/department/types';


interface ProgramUEInfoProps {
  programId: string;
  allUes: OrgUEDTO; // tout les ues de l'org 
  departments: DepartmentDto[]
}


export function ProgramUEInfo({ programId, allUes, departments }: ProgramUEInfoProps) {

  const [program, setProgram] = useState<ProgramTable>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flat list of ues already in the program for easy filtering
  const existingUeIds = useMemo(() => {
    return program.flatMap(s => s.ues.map(u => u.ue.id));
  }, [program]);

  const availableUes = useMemo(() => {
    return allUes.filter(ue => !existingUeIds.includes(ue.id));
  }, [allUes, existingUeIds]);



  useEffect(() => {
    fetchUEs();
  }, [programId]);

  // ================== Handlers ==================
  const handleCreate = async (data: CreateUeData) => {
    try {
      const result = await createUEAction({ data, programId });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("UE créée avec succès");
      fetchUEs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
    }
  };

  const handleEdit = async (ueId: string, data: Partial<UpdateUEData>) => {
    try {
      if (Object.keys(data).length === 0) {
        toast.info("Aucune modification détectée");
        return;
      }

      const result = await updateUEAction({ ueId, data });
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("UE modifiée avec succès");
      fetchUEs(); // Refetch to get updated structure/totals
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la modification");
    }
  };

  const handleDelete = async (ueId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette UE ?")) return;
    try {
      const result = await removeUEAction({ ueId });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("UE supprimée avec succès");
      fetchUEs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    }
  };


  const handleDetach = async (ueId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer cette UE du programme ?")) return;
    try {
      const result = await removeUEFromProgramAction({ ueId, programId });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("UE retirée du programme avec succès");
      fetchUEs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors du retrait");
    }
  };


  const handleAttach = async (ueId: string) => {
    try {
      const result = await addUEToProgramAction({ ueId, programId });
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("UE ajoutée au programme avec succès");
      fetchUEs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout au programme");
    }
  };

  // ================== Fetch ==================
  const fetchUEs = async () => {
    try {
      setLoading(true);
      const { data: programTable, error: fetchError } = await getProgramUEsTableAction({ programId });
      if (fetchError || !programTable) {
        setError(fetchError || 'Programme non trouvé');
        return;
      }
      setProgram(programTable);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };



  // ================== Render ==================
  if (loading) return <ProgramUELoader message="Chargement..." />;
  if (error) return <ProgramUELoader message={`Erreur: ${error}`} />;


  return (
    <div className="mt-4">
      <pre>{JSON.stringify(programId, null, 2)}</pre>
      <pre>{JSON.stringify(program, null, 2)}</pre>
      {/* <ProgramViewer
    
        programId={programId}
        program={program}
        availableUes={availableUes}
        departments={departments}
        onRefresh={fetchUEs}
      /> */}
    </div>
  );
}
