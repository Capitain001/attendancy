"use server";

import { getOrgUEAction } from '@/services/ue/actions';
import { ProgramUEInfo } from './ProgramUEInfo';
import { getDepartmentsAction } from '@/services/department/actions';


export  async function ProgramInfo({ programId }: { programId: string }) {
    const [
      { data: orgUes, error:ueError },
      { data: departments, error:departmentsError },
    ] = await Promise.all([
      getOrgUEAction(),
      getDepartmentsAction(),
    ])

    if (ueError || !orgUes) {
      return <div className="p-6">Erreur : {ueError}</div>
    }
    
  return <ProgramUEInfo programId={programId} allUes={orgUes} departments={departments??[]} />;
}
