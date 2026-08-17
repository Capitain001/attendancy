"use server";

import { getUEsAction } from '@/services/ue/actions';
import { getDepartmentsAction } from '@/services/department/actions';

export async function ProgramInfo({ programId }: { programId: string }) {
  const [
    { data: orgUes, error: ueError },
    { data: departments, error: departmentsError },
  ] = await Promise.all([
    getUEsAction(),
    getDepartmentsAction(),
  ])

  if (ueError || !orgUes) {
    return <div className="p-6">Erreur : {ueError ?? 'Impossible de charger les UE.'}</div>
  }

  if (departmentsError) {
    return <div className="p-6">Erreur : {departmentsError}</div>
  }

  return (
    <div className="p-6 text-sm text-muted-foreground">
      Programme {programId} — {orgUes.length} UE chargées ({departments?.length ?? 0} départements).
    </div>
  )
}
