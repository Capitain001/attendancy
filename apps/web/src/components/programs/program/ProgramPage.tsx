"use client";

import React, { useState, useCallback, useEffect } from 'react';
import type { ProgramSemesterDTO, ProgramUECourses } from '@/services/ue/types';
import { getCourses } from '@/services/ue/utils';

import { GridDeco, CollapseSection } from './ui';
import { SemesterTable } from './SemesterTable';
import { mockProgram } from './data';
import { ProgramPageData } from './types';



export function semesterLabel(n: number) {
  return `Semestre ${n}`;
}


export type ProgramPageProps = {
  data?: ProgramPageData;
  onChange?: (semesters: ProgramSemesterDTO[]) => void;
};

export function ProgramPage({ data: initialData = mockProgram, onChange }: ProgramPageProps) {
  const [semesters, setSemesters] = useState<ProgramSemesterDTO[]>(initialData.semesters);

  const handleUEsChange = useCallback((semesterNum: number, newUEs: ProgramUECourses[]) => {
    setSemesters(prev => {
      const next = prev.map(sem => {
        if (sem.semester !== semesterNum) return sem;
        return { ...sem, ues: newUEs };
      });
      
      return next.map(block => {
        let totalCredits = 0;
        let totalDuration = 0;
        block.ues.forEach(u => {
          totalCredits += u.ueTotalCredits;
          totalDuration += u.ueTotalDuration;
        });
        return { ...block, totalCredits, totalDuration };
      });
    });
  }, []);

  useEffect(() => {
    onChange?.(semesters);
  }, [semesters, onChange]);

  const totalDuration = semesters.reduce((s, sem) => s + sem.totalDuration, 0);
  const totalCredits  = semesters.reduce((s, sem) => s + sem.totalCredits, 0);
  const totalUEs      = semesters.reduce((s, sem) => s + sem.ues.length, 0);
  const totalCourses  = semesters.reduce((s, sem) => s + sem.ues.reduce((ss, ue) => ss + getCourses(ue).length, 0), 0);

  return (
    <section className="relative w-full pt-6 pb-16 px-4">
      <div aria-hidden className="absolute inset-0 isolate z-0 contain-strict pointer-events-none">
        <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.05)_0,hsla(0,0%,55%,.01)_50%,transparent_80%)] absolute top-0 left-0 h-320 w-140 -translate-y-87.5 -rotate-45 rounded-full" />
      </div>

      <div className="relative mx-auto max-w-4xl">

        {/* Hero */} 
        <div className="relative overflow-hidden border border-dashed border-foreground/25 p-4 sm:p-5">
          <GridDeco />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-widest mb-1 truncate">
                {initialData.class.programTrack} · {initialData.class.academicYear}
              </p>
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight leading-tight">{initialData.class.program}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 rounded-sm border border-dashed border-blue-200">
                  {initialData.class.level}
                </span>
                <span className="text-[11px] sm:text-[12px] text-muted-foreground">{initialData.class.name}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 sm:gap-4 shrink-0">
              {[
                { val: semesters.length, lbl: 'Semestres' },
                { val: totalUEs,         lbl: 'UE' },
                { val: totalCourses,     lbl: 'Cours' },
                { val: `${totalCredits}`,lbl: 'Crédits' },
              ].map(({ val, lbl }) => (
                <div key={lbl} className="text-center">
                  <div className="text-lg sm:text-xl font-medium leading-none">{val}</div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-3 sm:mt-4">
            <div className="flex justify-between text-[9px] sm:text-[10px] text-muted-foreground mb-1.5">
              <span>Volume horaire total</span>
              <span>{totalDuration}h · {totalCredits} crédits</span>
            </div>
            <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
              {semesters.map((sem, i) => {
                const bgColors = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500'];
                const pct = totalDuration > 0
                  ? Math.round((sem.totalDuration / totalDuration) * 100)
                  : Math.round(100 / semesters.length);
                return <div key={sem.semester} className={`${bgColors[i % bgColors.length]} h-full rounded-sm`} style={{ width: `${pct}%` }} />;
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
              {semesters.map((sem, i) => (
                <div key={sem.semester} className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground">
                  <span className={`size-1.5 sm:size-2 rounded-full ${['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500'][i % 4]}`} />
                  {semesterLabel(sem.semester)} — {sem.totalDuration}h · {sem.totalCredits} cr.
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Semester sections */}
        {semesters.map((sem, i) => {
          const semColors = [
            { accent: '#3B82F6', label: 'text-blue-700',   bg: 'bg-blue-50' },
            { accent: '#8B5CF6', label: 'text-violet-700', bg: 'bg-violet-50' },
            { accent: '#10B981', label: 'text-emerald-700',bg: 'bg-emerald-50' },
            { accent: '#F59E0B', label: 'text-amber-700',  bg: 'bg-amber-50' },
          ][i % 4];

          const label = semesterLabel(sem.semester);
          const ues = sem.ues;

          return (
            <CollapseSection key={sem.semester} label={label} count={ues.length}>
              <div style={{ borderLeft: `2px dashed ${semColors.accent}40`, paddingLeft: '8px' }} className="sm:pl-3">
                <div className="flex items-center gap-2 mb-2.5 sm:mb-3 flex-wrap">
                  <span className={`inline-block px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-sm ${semColors.bg} ${semColors.label}`}>
                    {sem.totalDuration}h
                  </span>
                  <span className={`inline-block px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-sm ${semColors.bg} ${semColors.label}`}>
                    {sem.totalCredits} crédits
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                    {ues.length} UE · {ues.reduce((s, ue) => s + getCourses(ue).length, 0)} cours
                  </span>
                </div>
                <SemesterTable
                  ues={ues}
                  semesterTotalDuration={sem.totalDuration}
                  semesterTotalCredits={sem.totalCredits}
                  semesterIndex={i}
                  onUEsChange={(newUEs) => handleUEsChange(sem.semester, newUEs)}
                />
              </div>
            </CollapseSection>
          );
        })}
      </div>
    </section>
  );
}
