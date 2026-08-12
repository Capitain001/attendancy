"use client";

import { useState } from "react";
import ProgramSelector from "./ProgramSelector";
import ProgramTable from "./ProgramTable";
import { linkProgramToClassAction } from "@/services/program/actions";
import { GetDepartmentsDto } from "@/services/department/types";
import { OrgUEDTO } from "@/services/ue/types";
import { GetProgramsDto } from "@/services/program/types";
import { Button } from "@/components/ui/button";


interface ProgramSectionProps {
  initialProgramId: string;
  programs: GetProgramsDto;
  allUes: OrgUEDTO;
  departments: GetDepartmentsDto;
  classId: string;
  programTrackId: string;
  slug: string;
}   
export default function ProgramSection({
  initialProgramId,
  programs,
  allUes,
  departments,
  classId,
  slug,
  programTrackId,
}: ProgramSectionProps) {

  const [programId, setProgramId] = useState(initialProgramId);

  const handleProgramChange = async (newProgramId: string) => {
    //permet de changer le programme sélectionné 
    setProgramId(newProgramId);
  };

  const handleLinkProgramToClass = async () => {
    await linkProgramToClassAction({
      classId,
      programId: programId,
    });
  };

  return (
    <div className="space-y-6">
   {/* permet de sélectionner d'autres programmes  a afficher  */}
   {/* on recuper uniquement les programmes (programTrackId) de la filiere de la classe  */}
      <div className="flex py-4 justify-between">
        <ProgramSelector
          value={programId}
          programs={programs}
          onChange={handleProgramChange}
        />
          {/* button link program to class */}
          <Button onClick={handleLinkProgramToClass}>
            Lier le programme à la classe
          </Button>
      </div>

      <ProgramTable
        programId={programId}
        allUes={allUes}
        departments={departments}
        classId={classId}
        slug={slug}
      />


    </div>
  );
}