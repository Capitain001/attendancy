"use client";

import { useEffect, useMemo, useState } from 'react';
import type { DepartmentDto } from '@/services/department/types';
import type { GetUEsDto, ProgramTable } from '@/services/ue/types';

interface ProgramUEInfoProps {
  programId: string;
  allUes: GetUEsDto;
  departments: DepartmentDto[];
}

export function ProgramUEInfo({ programId, allUes, departments }: ProgramUEInfoProps) {
  const [program, setProgram] = useState<ProgramTable>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const existingUeIds = useMemo(() => program.flatMap((s) => s.ues.map((u) => u.ue.id)), [program]);
  const availableUes = useMemo(() => allUes.filter((ue) => !existingUeIds.includes(ue.id)), [allUes, existingUeIds]);

  useEffect(() => {
    setLoading(false)
    setProgram([])
    setError(null)
  }, [programId])

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
  if (error) return <div className="p-4 text-sm text-destructive">Erreur : {error}</div>

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/20 p-4 text-sm">
      <div className="font-medium">Programme {programId}</div>
      <div>UE disponibles : {availableUes.length}</div>
      <div>Départements : {departments.length}</div>
      <pre className="overflow-x-auto text-xs">{JSON.stringify(program, null, 2)}</pre>
    </div>
  )
}
