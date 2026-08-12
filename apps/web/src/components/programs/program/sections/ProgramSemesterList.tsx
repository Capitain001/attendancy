"use client";

import React from "react";
import type { ProgramSemesterDTO } from "@/services/ue/types";
import { CollapseSection } from "../ui";
import { SemesterTable } from "../SemesterTable";
import { semesterLabel } from "../ProgramPage";

export function ProgramSemesterList({
  semesters,
  isEditing,
  onUEsChange,
  onAddUE,
  onUnlinkUE,
  onAddCourse,
  onDeleteCourse,
  onEditUE,
  onEditCourse,
}: {
  semesters: ProgramSemesterDTO[];
  isEditing: boolean;
  onUEsChange: (semester: number, newUEs: ProgramSemesterDTO["ues"]) => void;
  onAddUE: (semester: number) => void;
  onUnlinkUE: (programUEId: string) => void;
  onAddCourse: (ueId: string) => void;
  onDeleteCourse: (courseId: string) => void;
  onEditUE: (ue: ProgramSemesterDTO["ues"][number]) => void;
  onEditCourse: (course: any, ueId: string) => void;
}) {
  // Programme vide — afficher un point d'entrée
  if (semesters.length === 0) {
    return (
      <div className="border border-dashed border-foreground/20 rounded-sm p-8 flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Aucun semestre défini
        </p>
        {isEditing && (
          <button
            onClick={() => onAddUE(1)}
            className="h-8 px-4 text-xs bg-foreground text-background font-medium rounded-sm hover:opacity-90 transition-opacity"
          >
            Ajouter une UE au semestre 1
          </button>
        )}
        {!isEditing && (
          <p className="text-[11px] text-muted-foreground">
            Activez le mode édition pour commencer à structurer ce programme.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {semesters.map((sem, i) => {
        const semColors = [
          { accent: "#3B82F6" },
          { accent: "#8B5CF6" },
          { accent: "#10B981" },
          { accent: "#F59E0B" },
        ][i % 4];

        return (
          <CollapseSection
            key={sem.semester}
            label={semesterLabel(sem.semester)}
            count={sem.ues.length}
          >
            <div
              style={{ borderLeft: `2px dashed ${semColors.accent}40`, paddingLeft: "8px" }}
              className="sm:pl-3"
            >
              <SemesterTable
                ues={sem.ues}
                semesterTotalDuration={sem.totalDuration}
                semesterTotalCredits={sem.totalCredits}
                semesterIndex={sem.semester}
                onUEsChange={(newUEs) => onUEsChange(sem.semester, newUEs)}
                isEditing={isEditing}
                onAddUE={() => onAddUE(sem.semester)}
                onUnlinkUE={onUnlinkUE}
                onAddCourse={onAddCourse}
                onDeleteCourse={onDeleteCourse}
                onEditUE={onEditUE as any}
                onEditCourse={onEditCourse}
              />
            </div>
          </CollapseSection>
        );
      })}
    </>
  );
}
