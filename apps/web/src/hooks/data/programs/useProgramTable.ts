import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getProgramUEsTableAction } from "@/services/ue/actions";
import { OrgUEDTO, ProgramTable as ProgramTableType } from "@/services/ue/types";
import { CACHE_KEYS, CACHE_TIME } from "@/config/client_cache";

interface UseProgramTableResult {
  program: ProgramTableType;
  availableUes: OrgUEDTO;
  isLoading: boolean;
  error: Error | null;
}

// Gère les données nécessaires au composant ProgramTable
export function useProgramTable(
  programId: string,
  allUes: OrgUEDTO
): UseProgramTableResult {
  const {
    data: programData,
    isLoading,
    error,
  } = useQuery({
    queryKey: CACHE_KEYS.PROGRAMS.BY_ID(programId),
    queryFn: async () => {
      const result = await getProgramUEsTableAction({ programId });
      if ('error' in result) throw new Error(result.error);
      return (result.data ?? []) as unknown as ProgramTableType;
    },
    enabled: !!programId,
    staleTime: CACHE_TIME.MEDIUM,
  });

  const program = programData ?? [];

  // IDs des UEs déjà présentes dans le programme
  const existingUeIds = useMemo(() => {
    return program.flatMap((session) => session.ues.map((u) => u.ue.id));
  }, [program]);

  // UEs disponibles pour ajout (pas encore dans le programme)
  const availableUes = useMemo(() => {
    return allUes.filter((ue) => !existingUeIds.includes(ue.id));
  }, [allUes, existingUeIds]);

  return {
    program,
    availableUes,
    isLoading,
    error: error ?? null,
  };
}
