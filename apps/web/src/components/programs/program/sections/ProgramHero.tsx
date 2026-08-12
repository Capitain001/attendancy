"use client";

import React from "react";
import type { ProgramSemesterDTO } from "@/services/ue/types";
import { GridDeco } from "../ui";

export function ProgramHero({
  classInfo,
  semesters,
  totalUEs,
  totalCourses,
  totalCredits,
  totalDuration,
}: {
  classInfo?: {
    name?: string;
    level?: string;
    programTrack?: string;
    program?: string;
    academicYear?: string;
  };
  semesters: ProgramSemesterDTO[];
  totalUEs: number;
  totalCourses: number;
  totalCredits: number;
  totalDuration: number;
}) {
  return (
    <div className="relative overflow-hidden bg-card/70 border border-dashed border-foreground/25 p-4 sm:p-5">
      <GridDeco />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-widest mb-1 truncate">
            {classInfo?.programTrack || "Maquette Pédagogique"}{classInfo?.academicYear ? ` · ${classInfo.academicYear}` : ""}
          </p>
          <h1 className="text-xl sm:text-2xl font-medium tracking-tight leading-tight">
            {classInfo?.program || "Programme d'enseignement"}
          </h1>
          {(classInfo?.name || classInfo?.level) && (
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {classInfo.name && (
                <span className="text-[11px] sm:text-[12px] text-muted-foreground ">
                  {classInfo.name}
                </span>
              )}
              {classInfo.level && (
                <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-muted rounded-sm border-px border-dashed border-primary">
                  {classInfo.level}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 w-full justify-end ">
          {[
            { val: semesters.length, lbl: "Semestres" },
            { val: totalCourses, lbl: "Cours" },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="text-center">
              <div className="text-lg sm:text-xl font-medium leading-none">{val}</div>
              <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                {lbl}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* <div className="relative mt-3 sm:mt-4">
        <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-foreground mb-1.5">
          <span>Volume horaire total</span>
          <span>
            {totalDuration}h · {totalCredits} crédits
          </span>
        </div>
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
          {semesters.map((sem, i) => {
            const bgColors = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500"];
            const pct =
              totalDuration > 0
                ? Math.round((sem.totalDuration / totalDuration) * 100)
                : Math.round(100 / Math.max(1, semesters.length));
            return (
              <div
                key={sem.semester}
                className={`${bgColors[i % bgColors.length]} h-full rounded-sm`}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
      </div> */}
    </div>
  );
}

